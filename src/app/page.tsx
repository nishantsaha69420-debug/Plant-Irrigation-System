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
import { MouseTrail } from '@/components/MouseTrail';
import { parseAndCalibrateMoisture } from '@/lib/calibration';
import { playSound } from '@/lib/sounds';
import { TelemetryData, ActivityLog, HistoryPoint } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// How many seconds without a new telemetry update before we consider ESP32 offline
const ESP_OFFLINE_THRESHOLD_SEC = 6;

export default function RootwiseDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [dbUrl, setDbUrl] = useState<string>(DEFAULT_FIREBASE_CONFIG.databaseURL);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isEspOnline, setIsEspOnline] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Selected Plant Profile
  const [currentPlant, setCurrentPlant] = useState<PlantPreset>(PLANT_PRESETS[0]);

  // Core Hardware & Telemetry State
  const [moisture, setMoisture] = useState<number | string | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [pumpState, setPumpState] = useState<'on' | 'off'>('off');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);

  // History & Activity Logs
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const dbRef = useRef<Database | null>(null);
  const lastTelemetryTimestampRef = useRef<number>(0);
  const isInitialSnapshotRef = useRef<boolean>(true);
  const espOnlineCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ESP32 online heartbeat check — if no new telemetry in N seconds, mark offline
  useEffect(() => {
    if (isSimulated) {
      setIsEspOnline(true);
      return;
    }

    espOnlineCheckRef.current = setInterval(() => {
      if (lastTelemetryTimestampRef.current === 0) {
        setIsEspOnline(false);
        return;
      }
      const elapsed = (Date.now() - lastTelemetryTimestampRef.current) / 1000;
      if (elapsed > ESP_OFFLINE_THRESHOLD_SEC) {
        setIsEspOnline(false);
      } else {
        setIsEspOnline(true);
      }
    }, 2000);

    return () => {
      if (espOnlineCheckRef.current) clearInterval(espOnlineCheckRef.current);
    };
  }, [isSimulated]);

  // Firebase Realtime Connection & Telemetry Stream
  useEffect(() => {
    if (isSimulated) return;

    try {
      const database = getFirebaseDb(dbUrl);
      dbRef.current = database;
      if (!database) return;

      setIsLoading(true);

      // Connected State listener (browser <-> Firebase, NOT ESP32)
      const connectedRef = ref(database, '.info/connected');
      const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
        const val = snapshot.val();
        setIsConnected(Boolean(val));
        if (val) {
          setIsLoading(false);
          addLog('Firebase RTDB connection established', 'success');
        }
      });

      // Telemetry stream listener — this is the real ESP32 heartbeat
      const telemetryRef = ref(database, 'telemetry');
      const unsubscribeTelemetry = onValue(
        telemetryRef,
        (snapshot) => {
          const data = snapshot.val();
          setIsLoading(false);
          if (!data) return;

          // The very first snapshot delivered by Firebase RTDB on subscription
          // is just the stale, historic data sitting in the cloud database.
          // If the ESP32 is completely powered OFF, Firebase will send this snapshot
          // once and then NEVER again.
          // We only mark the ESP32 as ONLINE when an active packet is pushed by the hardware!
          if (isInitialSnapshotRef.current) {
            isInitialSnapshotRef.current = false;
            setTelemetry(data);
            return;
          }

          // Active live telemetry packet received from ESP32!
          lastTelemetryTimestampRef.current = Date.now();
          if (!isEspOnline) {
            addLog('ESP32 stream discovered on Wi-Fi! Live telemetry auto-connected.', 'success');
            if (soundEnabled) playSound('power-on');
          }
          setIsEspOnline(true);

          setTelemetry(data);
          const rawVal = data.moisture;

          // Invert 12-bit ADC mapping: 4095 ADC -> 0% moisture
          const calibrated = parseAndCalibrateMoisture(rawVal);
          if (calibrated) {
            setMoisture(calibrated.percentage);
            setLastUpdated(new Date().toLocaleTimeString());
            recordHistory(calibrated.percentage);
          }
        },
        (error) => {
          console.warn('Firebase telemetry error:', error);
          setIsConnected(false);
          setIsEspOnline(false);
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
      setIsEspOnline(false);
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

  // Simulation Engine
  useEffect(() => {
    if (!isSimulated) return;

    setIsConnected(true);
    setIsEspOnline(true);
    if (moisture === null) {
      setMoisture(52);
      recordHistory(52);
    }

    const interval = setInterval(() => {
      setMoisture((prev) => {
        let current = typeof prev === 'number' ? prev : 52;

        if (pumpState === 'on') {
          current = Math.min(95, current + Math.floor(Math.random() * 3 + 2));
        } else {
          current = Math.max(0, current - (Math.random() > 0.4 ? 1 : 0));
        }

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
      recordHistory(46);
    } else {
      addLog('Reconnecting to live physical ESP32 stream.', 'info');
      setMoisture(null);
      isInitialSnapshotRef.current = true;
      lastTelemetryTimestampRef.current = 0;
      setIsEspOnline(false);
    }
  };

  const handleForceRefresh = () => {
    if (soundEnabled) playSound('click');
    setIsLoading(true);
    addLog('Scanning network for ESP32 telemetry broadcast...', 'info');
    setTimeout(() => {
      setIsLoading(false);
      const isAlive =
        lastTelemetryTimestampRef.current !== 0 &&
        (Date.now() - lastTelemetryTimestampRef.current) / 1000 <= ESP_OFFLINE_THRESHOLD_SEC;
      if (isAlive) {
        setLastUpdated(new Date().toLocaleTimeString());
        addLog('ESP32 stream verified live and transmitting', 'success');
      } else {
        addLog('Continuous background scanner active. Waiting for ESP32 on Wi-Fi...', 'info');
      }
    }, 500);
  };

  // Protection: redirect unauthenticated visitors to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/');
    }
  }, [authLoading, user, router]);

  // Use isEspOnline for actual hardware status (not just Firebase connectivity)
  const effectiveOnline = isSimulated || isEspOnline;

  const targetRange: [number, number] = [currentPlant.minMoisture, currentPlant.maxMoisture];

  if (authLoading) {
    return (
      <>
        <MouseTrail />
        <ForestBackground />
        <main className="app-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="auth-spinner" />
            <p style={{ color: 'var(--brand-sage)', fontSize: '0.95rem', fontWeight: 500 }}>
              Connecting to living soil ecosystem...
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Mouse Trail Effect */}
      <MouseTrail />

      {/* Animated Forest Background with Leaves and Fireflies */}
      <ForestBackground />

      <main className="app-container">
        <div className="glass-panel">
          {/* Header — uses isEspOnline and passes active scanning state */}
          <Header
            isConnected={isEspOnline}
            isScanning={!effectiveOnline}
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
            user={user}
            onLogout={logout}
          />


          <div className="dashboard-content">
            {/* ESP32 Continuous Discovery & Scanning Banner */}
            {!effectiveOnline && (
              <div className="esp-offline-banner">
                <div className="radar-scan-dot" />
                <div style={{ flex: 1 }}>
                  <strong>🔍 Scanning for ESP32 on Wi-Fi...</strong>
                  <p>
                    Rootwise is continuously scanning your network. As soon as your ESP32 powers on and connects to the internet, it will automatically connect and stream live soil readings.
                  </p>
                  <div className="scanner-progress-track">
                    <div className="scanner-progress-bar" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleToggleSimulation}
                    className="banner-sim-btn"
                    title="Explore dashboard with virtual soil moisture"
                  >
                    Try Demo Mode
                  </button>
                </div>
              </div>
            )}

            {/* Top Duo: Botanical Plant Companion & Moisture Centerpiece */}
            <div className="hero-duo-grid">
              <PlantCompanion
                plantName={currentPlant.name}
                location={currentPlant.location}
                moisture={typeof moisture === 'number' ? moisture : typeof moisture === 'string' ? parseFloat(moisture) || null : null}
                isPumpOn={effectiveOnline && pumpState === 'on'}
                mode={mode}
                onQuickWater={() => setPump('on')}
                onOpenPlantProfile={() => setIsPlantModalOpen(true)}
                isOnline={effectiveOnline}
              />

              <MoistureGauge
                moisture={moisture}
                isPumpOn={effectiveOnline && pumpState === 'on'}
                mode={mode}
                lastUpdated={lastUpdated}
                targetRange={targetRange}
                isSimulated={isSimulated}
                isOnline={effectiveOnline}
              />
            </div>

            {/* Actuator Controls */}
            <PumpController
              mode={mode}
              pumpState={pumpState}
              onSetPump={setPump}
              onToggleMode={toggleMode}
              disabled={!effectiveOnline}
            />

            {/* Environmental Readings & Hardware Status */}
            <EnvironmentCards
              telemetry={telemetry}
              mode={mode}
              pumpState={pumpState}
              lastUpdated={lastUpdated}
              latencyMs={latencyMs}
              isOnline={effectiveOnline}
            />

            {/* Realtime Moisture Trajectory Chart with Target Band */}
            <TelemetryChart history={history} targetRange={targetRange} isOnline={effectiveOnline} />

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
              <span>Cloud: Firebase RTDB</span>
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
