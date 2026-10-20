'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, Database } from 'firebase/database';
import { getFirebaseDb, DEFAULT_FIREBASE_CONFIG } from '@/lib/firebase';
import { ForestBackground } from '@/components/ForestBackground';
import { Header } from '@/components/Header';
import { PlantCompanion } from '@/components/PlantCompanion';
import { MoistureGauge } from '@/components/MoistureGauge';
import { PumpController } from '@/components/PumpController';
import { EnvironmentCards } from '@/components/EnvironmentCards';
import { TelemetryChart } from '@/components/TelemetryChart';
import { ActivityLogView } from '@/components/ActivityLogView';
import { SettingsModal } from '@/components/SettingsModal';
import { PlantProfileModal, PLANT_PRESETS, PlantPreset } from '@/components/PlantProfileModal';
import { parseAndCalibrateMoisture } from '@/lib/calibration';
import { playSound } from '@/lib/sounds';
import { TelemetryData, ActivityLog, HistoryPoint } from '@/types';

export default function RootwiseDashboardPage() {
  const [dbUrl, setDbUrl] = useState<string>(DEFAULT_FIREBASE_CONFIG.databaseURL);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Selected Plant Profile
  const [currentPlant, setCurrentPlant] = useState<PlantPreset>(PLANT_PRESETS[0]);

  // Core Hardware & Telemetry State
  const [moisture, setMoisture] = useState<number | string | null>(null);
  const [rawAdc, setRawAdc] = useState<number | undefined>(undefined);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [pumpState, setPumpState] = useState<'on' | 'off'>('off');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);

  // History & Activity Logs
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const dbRef = useRef<Database | null>(null);

  // Append Activity Log
  const addLog = useCallback((message: string, type: ActivityLog['type'] = 'info') => {
    const newLog: ActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      type,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 40)]);
  }, []);

  // Record Telemetry Point
  const recordHistory = useCallback((moistureVal: number) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory((prev) => {
      const updated = [...prev, { time: timeStr, moisture: moistureVal }];
      return updated.slice(-20);
    });
  }, []);

  // Firebase Realtime Connection & Telemetry Stream
  useEffect(() => {
    if (isSimulated) return;

    try {
      const database = getFirebaseDb(dbUrl);
      dbRef.current = database;
      if (!database) return;

      setIsLoading(true);

      // Connected State listener
      const connectedRef = ref(database, '.info/connected');
      const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
        const val = snapshot.val();
        setIsConnected(Boolean(val));
        if (val) {
          setIsLoading(false);
          addLog('ESP32 link established over Firebase RTDB', 'success');
        }
      });

      // Telemetry stream listener
      const telemetryRef = ref(database, 'telemetry');
      const unsubscribeTelemetry = onValue(
        telemetryRef,
        (snapshot) => {
          const data = snapshot.val();
          setIsLoading(false);
          if (data) {
            setTelemetry(data);
            const rawVal = data.moisture;

            // Invert 12-bit ADC mapping: 4095 ADC -> 0% moisture
            const calibrated = parseAndCalibrateMoisture(rawVal);
            if (calibrated) {
              setMoisture(calibrated.percentage);
              setRawAdc(calibrated.rawAdc);
              setLastUpdated(new Date().toLocaleTimeString());
              recordHistory(calibrated.percentage);
            }
          }
        },
        (error) => {
          console.warn('Firebase telemetry error:', error);
          setIsConnected(false);
          setIsLoading(false);
          addLog(`Stream error: ${error.message}`, 'warning');
        }
      );

      // Commands listener
      const commandsRef = ref(database, 'commands');
      const unsubscribeCommands = onValue(commandsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.mode) setMode(data.mode);
          if (data.pump) setPumpState(data.pump);
        }
      });

      return () => {
        unsubscribeConnected();
        unsubscribeTelemetry();
        unsubscribeCommands();
      };
    } catch (err: any) {
      console.error('Firebase setup failed:', err);
      setIsConnected(false);
      setIsLoading(false);
      addLog(`Failed to connect: ${err?.message || 'Check database URL'}`, 'warning');
    }
  }, [dbUrl, isSimulated, addLog, recordHistory]);

  // Actuator Command Dispatch
  const setPump = useCallback(
    (state: 'on' | 'off') => {
      if (soundEnabled) {
        playSound(state === 'on' ? 'power-on' : 'power-off');
        if (state === 'on') {
          setTimeout(() => playSound('water'), 200);
        }
      }

      setPumpState(state);
      addLog(`Actuator: Water pump turned ${state.toUpperCase()}`, state === 'on' ? 'pump-on' : 'pump-off');

      if (isSimulated) return;

      if (dbRef.current) {
        const startTime = performance.now();
        set(ref(dbRef.current, 'commands'), { mode: 'manual', pump: state })
          .then(() => {
            setLatencyMs(Math.round(performance.now() - startTime));
          })
          .catch((err) => {
            addLog(`Pump command error: ${err.message}`, 'warning');
          });
      }
    },
    [isSimulated, soundEnabled, addLog]
  );

  const toggleMode = useCallback(() => {
    if (soundEnabled) playSound('mode');

    const nextMode = mode === 'auto' ? 'manual' : 'auto';
    setMode(nextMode);
    addLog(`Mode switched to ${nextMode.toUpperCase()}`, 'info');

    if (isSimulated) return;

    if (dbRef.current) {
      const startTime = performance.now();
      set(ref(dbRef.current, 'commands'), { mode: nextMode, pump: 'off' })
        .then(() => {
          setPumpState('off');
          setLatencyMs(Math.round(performance.now() - startTime));
        })
        .catch((err) => {
          addLog(`Mode command error: ${err.message}`, 'warning');
        });
    }
  }, [mode, isSimulated, soundEnabled, addLog]);

  // Expose global methods for backwards compatibility or console testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setPump = setPump;
      (window as any).toggleMode = toggleMode;
    }
  }, [setPump, toggleMode]);

  // Simulation Engine (when hardware is offline or demo mode enabled)
  useEffect(() => {
    if (!isSimulated) return;

    setIsConnected(true);
    if (moisture === null) {
      setMoisture(52);
      setRawAdc(Math.round(4095 - (52 / 100) * (4095 - 1200)));
      recordHistory(52);
    }

    const interval = setInterval(() => {
      setMoisture((prev) => {
        let current = typeof prev === 'number' ? prev : 52;

        if (pumpState === 'on') {
          current = Math.min(95, current + Math.floor(Math.random() * 3 + 2));
        } else {
          // Slow natural soil evaporation
          current = Math.max(0, current - (Math.random() > 0.4 ? 1 : 0));
        }

        // Inverted ADC formula: 0% = 4095, 100% = 1200
        const simAdc = Math.round(4095 - (current / 100) * (4095 - 1200));
        setRawAdc(simAdc);

        recordHistory(current);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        // Auto mode automated threshold trigger
        if (mode === 'auto') {
          if (current < currentPlant.minMoisture && pumpState === 'off') {
            setPump('on');
            addLog(`[Rootwise AI] Moisture dropped below ${currentPlant.minMoisture}%. Irrigating plant.`, 'pump-on');
          } else if (current >= currentPlant.maxMoisture && pumpState === 'on') {
            setPump('off');
            addLog(`[Rootwise AI] Target moisture (${currentPlant.maxMoisture}%) reached. Valve closed.`, 'pump-off');
          }
        }

        return current;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulated, pumpState, mode, moisture, currentPlant, recordHistory, setPump, addLog]);

  const handleToggleSimulation = () => {
    if (soundEnabled) playSound('click');
    const nextState = !isSimulated;
    setIsSimulated(nextState);
    if (nextState) {
      addLog('Demo Simulation Mode enabled. Generating virtual soil readings.', 'info');
      setMoisture(46);
      setRawAdc(Math.round(4095 - (46 / 100) * (4095 - 1200)));
      recordHistory(46);
    } else {
      addLog('Reconnecting to live physical ESP32 stream.', 'info');
      setMoisture(null);
      setRawAdc(undefined);
    }
  };

  const handleForceRefresh = () => {
    if (soundEnabled) playSound('click');
    setIsLoading(true);
    addLog('Refreshing Firebase telemetry feed...', 'info');
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 600);
  };

  const targetRange: [number, number] = [currentPlant.minMoisture, currentPlant.maxMoisture];

  return (
    <>
      {/* Animated Forest Background with Leaves and Fireflies */}
      <ForestBackground />

      <main className="app-container">
        <div className="glass-panel">
          {/* Header */}
          <Header
            isConnected={isConnected}
            isSimulated={isSimulated}
            onToggleSimulated={handleToggleSimulation}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              playSound('click');
              setSoundEnabled(!soundEnabled);
            }}
            onOpenSettings={() => {
              if (soundEnabled) playSound('click');
              setIsSettingsOpen(true);
            }}
            onRefresh={handleForceRefresh}
            isLoading={isLoading}
            plantName={currentPlant.name}
            onOpenPlantProfile={() => {
              if (soundEnabled) playSound('click');
              setIsPlantModalOpen(true);
            }}
          />

          <div className="dashboard-content">
            {/* Top Duo: Botanical Plant Companion & Moisture Centerpiece */}
            <div className="hero-duo-grid">
              <PlantCompanion
                plantName={currentPlant.name}
                location={currentPlant.location}
                moisture={typeof moisture === 'number' ? moisture : typeof moisture === 'string' ? parseFloat(moisture) || null : null}
                isPumpOn={pumpState === 'on'}
                mode={mode}
                onQuickWater={() => setPump('on')}
                onOpenPlantProfile={() => setIsPlantModalOpen(true)}
              />

              <MoistureGauge
                moisture={moisture}
                rawAdc={rawAdc}
                isPumpOn={pumpState === 'on'}
                mode={mode}
                lastUpdated={lastUpdated}
                targetRange={targetRange}
                isCalibrated={true}
                isSimulated={isSimulated}
              />
            </div>

            {/* Actuator Controls with Dosing Presets & Safeguards */}
            <PumpController
              mode={mode}
              pumpState={pumpState}
              onSetPump={setPump}
              onToggleMode={toggleMode}
              disabled={!isConnected && !isSimulated}
            />

            {/* Environmental Readings & Hardware Status */}
            <EnvironmentCards
              telemetry={telemetry}
              mode={mode}
              pumpState={pumpState}
              lastUpdated={lastUpdated}
              latencyMs={latencyMs}
              rawAdc={rawAdc}
              calibratedMoisture={moisture !== null ? Number(moisture) : null}
            />

            {/* Realtime Moisture Trajectory Chart with Target Band */}
            <TelemetryChart history={history} targetRange={targetRange} />

            {/* Activity & Actuation Event Logs */}
            <ActivityLogView
              logs={logs}
              onClear={() => {
                if (soundEnabled) playSound('click');
                setLogs([]);
              }}
            />

            {/* Footer */}
            <footer className="footer-tools">
              <span>Rootwise • Living Soil Automation</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>Hardware: ESP32 Node (4095 ADC = 0% Dry)</span>
                <span>Cloud: Firebase RTDB</span>
              </div>
            </footer>
          </div>
        </div>

        {/* Plant Species & Profile Modal */}
        <PlantProfileModal
          isOpen={isPlantModalOpen}
          onClose={() => setIsPlantModalOpen(false)}
          selectedPlant={currentPlant}
          onSelectPlant={(plant) => {
            setCurrentPlant(plant);
            addLog(`Plant profile switched to ${plant.name}`, 'info');
          }}
        />

        {/* Hardware Firebase Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUrl={dbUrl}
          onSaveUrl={(newUrl) => {
            setDbUrl(newUrl);
            addLog(`Updated Firebase RTDB URL: ${newUrl}`, 'info');
          }}
        />
      </main>
    </>
  );
}
