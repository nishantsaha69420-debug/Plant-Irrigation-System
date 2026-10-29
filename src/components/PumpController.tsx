'use client';

import React, { useState, useEffect } from 'react';
import { Power, Cpu, Droplet, Timer, ShieldCheck, WifiOff, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

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
    if (disabled || isPendingConfirmation) return;
    setActivePreset(name);
    setSecondsRemaining(durationSec);
    onSetPump('on');
  };

  const handleStopPump = () => {
    setSecondsRemaining(null);
    setActivePreset(null);
    onSetPump('off');
  };

  const isAutoThermalLocked = mode === 'auto' && (thermalLockout || (numTemp !== null && numTemp > MAX_SAFE_TEMP));

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
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.18), rgba(251, 146, 60, 0.15))',
            border: '1.5px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
          }}
        >
          <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: '#fca5a5', display: 'block', fontSize: 13.5, marginBottom: 2 }}>
              Thermal Lockout Active — Automatic Irrigation Paused
            </strong>
            <p style={{ color: '#fecdd3', margin: 0 }}>
              Temperature is{' '}
              <strong style={{ color: '#ffffff' }}>
                {numTemp !== null && !isNaN(numTemp) ? `${numTemp.toFixed(1)}°C` : '>35.0°C'} / {MAX_SAFE_TEMP.toFixed(1)}°C limit
              </strong>
              . The physical ESP32 has blocked automatic irrigation to prevent thermal shock to hot root zones.
              Switch to Manual Mode if an emergency manual irrigation is required.
            </p>
          </div>
        </div>
      )}

      {/* AUTO Mode Sensor Fault Warning Banner */}
      {mode === 'auto' && sensorFault && (
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
            className={`mode-toggle-pill ${mode === 'auto' ? 'mode-auto' : 'mode-manual'}`}
            title={disabled ? 'Connect ESP32 to Wi-Fi to switch mode' : 'Click to toggle between Auto AI and Manual control'}
          >
            <Cpu size={14} />
            <span>{disabled ? 'Offline' : mode === 'auto' ? 'AI Auto Mode' : 'Manual Mode'}</span>
          </button>
        </div>
      </div>

      {/* Preset Friendly Watering Sips */}
      <div className="watering-presets-block">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="presets-title">Gentle Dosing Presets</span>
          {mode === 'auto' && (
            <span style={{ fontSize: 11, color: 'var(--brand-sage)' }}>
              Managed by ESP32 thresholds in Auto Mode
            </span>
          )}
        </div>
        <div className="preset-buttons-grid">
          <button
            type="button"
            onClick={() => handleStartPreset('Quick Sip', 5)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on' || isPendingConfirmation}
            className="preset-btn"
          >
            <div className="preset-icon-circle">
              <Droplet size={15} />
            </div>
            <div className="preset-btn-text">
              <strong>Quick Sip</strong>
              <span>5 seconds (~150ml)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleStartPreset('Standard Drink', 10)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on' || isPendingConfirmation}
            className="preset-btn"
          >
            <div className="preset-icon-circle">
              <Droplet size={15} />
            </div>
            <div className="preset-btn-text">
              <strong>Standard Drink</strong>
              <span>10 seconds (~300ml)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleStartPreset('Deep Soak', 20)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on' || isPendingConfirmation}
            className="preset-btn"
          >
            <div className="preset-icon-circle">
              <Droplet size={15} />
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
            disabled={disabled || isPendingConfirmation}
            className="pump-action-btn btn-turn-on"
            title="Start pump with 30s hardware failsafe"
          >
            {isPendingConfirmation ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying with ESP32...</span>
              </>
            ) : (
              <>
                <Power size={18} />
                <span>Turn Pump ON</span>
                {numTemp !== null && numTemp > MAX_SAFE_TEMP && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(239, 68, 68, 0.3)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginLeft: 4,
                      color: '#fca5a5',
                    }}
                  >
                    High Temp Override
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
                <span>Turn Pump OFF</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Safety Notice */}
      <div className="safeguards-notice">
        <ShieldCheck size={15} color="#52b788" />
        <span>
          <strong>Hardware Safeguards Enforced:</strong> Maximum continuous run duration is limited to 30 seconds.
          Temperature safety lockout pauses automatic watering above {MAX_SAFE_TEMP.toFixed(1)}°C.
        </span>
      </div>
    </div>
  );
};
