'use client';

import React, { useState, useEffect } from 'react';
import { Power, Cpu, Droplet, Timer, ShieldCheck, WifiOff, AlertTriangle, ShieldAlert, Loader2, Lock } from 'lucide-react';

interface PumpControllerProps {
  mode: 'auto' | 'manual';
  pumpState: 'on' | 'off';
  onSetPump: (state: 'on' | 'off') => void;
  onToggleMode: () => void;
  disabled?: boolean;
  thermalLockout?: boolean;
  temp?: number | string | null;
  sensorFault?: boolean;
  isPendingConfirmation?: boolean;
}

const MAX_SAFE_TEMP = 35.0;

export const PumpController: React.FC<PumpControllerProps> = ({
  mode,
  pumpState,
  onSetPump,
  onToggleMode,
  disabled = false,
  thermalLockout = false,
  temp,
  sensorFault = false,
  isPendingConfirmation = false,
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const numTemp =
    temp !== undefined && temp !== null && temp !== ''
      ? typeof temp === 'number'
        ? temp
        : parseFloat(String(temp))
      : null;

  const isHighTemp = numTemp !== null && !isNaN(numTemp) && numTemp > MAX_SAFE_TEMP;
  const isThermalActive = thermalLockout || isHighTemp;
  const isAutoMode = mode === 'auto';
  const isAutoThermalLocked = isAutoMode && isThermalActive;

  // Countdown timer for presets
  useEffect(() => {
    if (secondsRemaining === null) return;
    if (secondsRemaining <= 0) {
      onSetPump('off');
      setSecondsRemaining(null);
      setActivePreset(null);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onSetPump]);

  const handleStartPreset = (name: string, durationSec: number) => {
    // Strictly prevent preset actuation in Auto Mode, during thermal lockout, or while offline
    if (disabled || isPendingConfirmation || isAutoMode || isAutoThermalLocked) return;
    setActivePreset(name);
    setSecondsRemaining(durationSec);
    onSetPump('on');
  };

  const handleStopPump = () => {
    setSecondsRemaining(null);
    setActivePreset(null);
    onSetPump('off');
  };

  return (
    <div className="actuators-card">
      {/* Offline Alert */}
      {disabled && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          <WifiOff size={16} color="#f87171" style={{ flexShrink: 0 }} />
          <span>
            <strong>Controls Locked:</strong> Please connect your ESP32 to Wi-Fi to operate irrigation pumps and change modes.
          </span>
        </div>
      )}

      {/* AUTO Mode Thermal Lockout Warning Banner */}
      {isAutoThermalLocked && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.22), rgba(251, 146, 60, 0.18))',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: '0 6px 24px rgba(239, 68, 68, 0.25)',
          }}
        >
          <AlertTriangle size={24} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.55 }}>
            <strong style={{ color: '#ffffff', display: 'block', fontSize: 14, marginBottom: 3, letterSpacing: '0.02em' }}>
              ⚠️ HARMFUL TO WATER: High Temperature ({numTemp !== null ? `${numTemp.toFixed(1)}°C` : '>35°C'}) Detected!
            </strong>
            <p style={{ color: '#fecdd3', margin: 0 }}>
              Automatic irrigation is <strong>LOCKED OUT</strong> to prevent thermal root shock and rapid water evaporation.
              Ambient temperature exceeds the <strong>{MAX_SAFE_TEMP.toFixed(1)}°C safety threshold</strong>.
              Automated watering is completely halted. If emergency irrigation is required, switch to <strong>Manual Mode</strong> to override.
            </p>
          </div>
        </div>
      )}

      {/* AUTO Mode Sensor Fault Warning Banner */}
      {isAutoMode && sensorFault && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#fde68a',
            fontSize: 12.5,
          }}
        >
          <ShieldAlert size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span>
            <strong>Sensor Fault Warning:</strong> Soil moisture readings diverge beyond the configured limit. Automatic irrigation is paused.
          </span>
        </div>
      )}

      {/* Actuator Header */}
      <div className="actuators-header">
        <div>
          <span className="eyebrow-label">Physical Actuators & Safeguards</span>
          <h3 className="section-heading">Irrigation Controls</h3>
        </div>

        <div className="mode-switch-wrapper">
          <span className="mode-label">Mode:</span>
          <button
            type="button"
            onClick={onToggleMode}
            disabled={disabled}
            className={`mode-toggle-pill ${isAutoMode ? 'mode-auto' : 'mode-manual'}`}
            title={disabled ? 'Connect ESP32 to Wi-Fi to switch mode' : 'Click to toggle between Auto AI and Manual control'}
          >
            <Cpu size={14} />
            <span>{disabled ? 'Offline' : isAutoMode ? 'AI Auto Mode' : 'Manual Mode'}</span>
          </button>
        </div>
      </div>

      {/* Auto Mode Informational Lock Banner */}
      {isAutoMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: isAutoThermalLocked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(82, 183, 136, 0.08)',
            border: `1px solid ${isAutoThermalLocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(116, 198, 157, 0.2)'}`,
            borderRadius: 12,
            fontSize: 12,
            color: isAutoThermalLocked ? '#fca5a5' : 'var(--text-muted)',
            lineHeight: 1.45,
          }}
        >
          <Lock size={15} color={isAutoThermalLocked ? '#f87171' : 'var(--brand-sage)'} style={{ flexShrink: 0 }} />
          <span>
            {isAutoThermalLocked ? (
              <strong>Thermal Safety Lockout Active: Automated and manual watering triggers are blocked. Switch to Manual Mode to override.</strong>
            ) : (
              <span>Manual pump controls are locked in <strong>Auto Mode</strong>. The ESP32 governs watering autonomously based on soil thresholds. Switch to <strong>Manual Mode</strong> to take direct actuator control.</span>
            )}
          </span>
        </div>
      )}

      {/* Preset Friendly Watering Sips */}
      <div className="watering-presets-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="presets-title">Gentle Dosing Presets</span>
          {isAutoMode && (
            <span style={{ fontSize: 11, color: isAutoThermalLocked ? '#f87171' : 'var(--brand-sage)', fontWeight: 600 }}>
              {isAutoThermalLocked ? '🔒 Blocked (>35°C)' : '🔒 Locked in Auto Mode'}
            </span>
          )}
        </div>
        <div className="preset-buttons-grid">
          <button
            type="button"
            onClick={() => handleStartPreset('Quick Sip', 5)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on' || isPendingConfirmation || isAutoMode}
            className="preset-btn"
            style={{
              opacity: isAutoMode ? 0.45 : 1,
              cursor: isAutoMode ? 'not-allowed' : 'pointer',
            }}
            title={isAutoMode ? 'Switch to Manual Mode to use dosing presets' : 'Run pump for 5 seconds'}
          >
            <div className="preset-icon-circle">
              {isAutoMode ? <Lock size={14} /> : <Droplet size={15} />}
            </div>
            <div className="preset-btn-text">
              <strong>Quick Sip</strong>
              <span>5 seconds (~150ml)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleStartPreset('Standard Drink', 10)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on' || isPendingConfirmation || isAutoMode}
            className="preset-btn"
            style={{
              opacity: isAutoMode ? 0.45 : 1,
              cursor: isAutoMode ? 'not-allowed' : 'pointer',
            }}
            title={isAutoMode ? 'Switch to Manual Mode to use dosing presets' : 'Run pump for 10 seconds'}
          >
            <div className="preset-icon-circle">
              {isAutoMode ? <Lock size={14} /> : <Droplet size={15} />}
            </div>
            <div className="preset-btn-text">
              <strong>Standard Drink</strong>
              <span>10 seconds (~300ml)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleStartPreset('Deep Soak', 20)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on' || isPendingConfirmation || isAutoMode}
            className="preset-btn"
            style={{
              opacity: isAutoMode ? 0.45 : 1,
              cursor: isAutoMode ? 'not-allowed' : 'pointer',
            }}
            title={isAutoMode ? 'Switch to Manual Mode to use dosing presets' : 'Run pump for 20 seconds'}
          >
            <div className="preset-icon-circle">
              {isAutoMode ? <Lock size={14} /> : <Droplet size={15} />}
            </div>
            <div className="preset-btn-text">
              <strong>Deep Soak</strong>
              <span>20 seconds (~600ml)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Active Irrigation Banner with countdown */}
      {secondsRemaining !== null && pumpState === 'on' && (
        <div className="active-spray-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Timer size={20} className="pulse-icon" />
            <div>
              <strong>{activePreset} in progress</strong>
              <p style={{ fontSize: 12, opacity: 0.9 }}>
                Safety countdown: <strong>{secondsRemaining}s</strong> remaining before automatic cutoff.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStopPump}
            className="emergency-stop-btn"
          >
            Stop Now
          </button>
        </div>
      )}

      {/* Manual Start/Stop Direct Overrides */}
      <div className="direct-controls-row">
        {pumpState === 'off' ? (
          <button
            type="button"
            onClick={() => onSetPump('on')}
            disabled={disabled || isPendingConfirmation || isAutoMode}
            className="pump-action-btn btn-turn-on"
            style={{
              opacity: isAutoMode ? 0.45 : 1,
              cursor: isAutoMode ? 'not-allowed' : 'pointer',
              background: isAutoThermalLocked
                ? 'rgba(239, 68, 68, 0.15)'
                : undefined,
              borderColor: isAutoThermalLocked
                ? 'rgba(239, 68, 68, 0.4)'
                : undefined,
            }}
            title={
              isAutoThermalLocked
                ? 'Thermal Lockout Active: Switch to Manual Mode to override'
                : isAutoMode
                ? 'Switch to Manual Mode to operate pump manually'
                : 'Start pump with 30s hardware failsafe'
            }
          >
            {isPendingConfirmation ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying with ESP32...</span>
              </>
            ) : isAutoThermalLocked ? (
              <>
                <Lock size={18} color="#f87171" />
                <span style={{ color: '#fca5a5' }}>Blocked: Thermal Lockout (&gt;35°C)</span>
              </>
            ) : isAutoMode ? (
              <>
                <Lock size={18} />
                <span>Locked in Auto Mode</span>
              </>
            ) : (
              <>
                <Power size={18} />
                <span>Turn Pump ON</span>
                {isHighTemp && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(239, 68, 68, 0.35)',
                      border: '1px solid rgba(239, 68, 68, 0.6)',
                      padding: '2px 7px',
                      borderRadius: 4,
                      marginLeft: 4,
                      color: '#fecdd3',
                      fontWeight: 700,
                    }}
                  >
                    ⚠ Override Thermal Lockout
                  </span>
                )}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopPump}
            disabled={disabled || isPendingConfirmation}
            className="pump-action-btn btn-turn-off"
            title="Immediately turn pump OFF"
          >
            {isPendingConfirmation ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Stopping Pump...</span>
              </>
            ) : (
              <>
                <Power size={18} />
                <span>Turn Pump OFF (Stop)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Safety Notice */}
      <div className="safeguards-notice">
        <ShieldCheck size={15} color="#52b788" />
        <span>
          <strong>Hardware Safeguards Enforced:</strong> Automatic irrigation pauses when temperature exceeds {MAX_SAFE_TEMP.toFixed(1)}°C.
          Manual pump runtime is hardware failsafe limited to 30 seconds.
        </span>
      </div>
    </div>
  );
};
