'use client';

import React, { useState, useEffect } from 'react';
import { Power, Cpu, Droplet, Sparkles, Timer, ShieldCheck } from 'lucide-react';

interface PumpControllerProps {
  mode: 'auto' | 'manual';
  pumpState: 'on' | 'off';
  onSetPump: (state: 'on' | 'off') => void;
  onToggleMode: () => void;
  disabled?: boolean;
}

export const PumpController: React.FC<PumpControllerProps> = ({
  mode,
  pumpState,
  onSetPump,
  onToggleMode,
  disabled = false,
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

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
            title="Click to toggle between Auto AI and Manual control"
          >
            <Cpu size={14} />
            <span>{mode === 'auto' ? 'AI Auto Mode' : 'Manual Mode'}</span>
          </button>
        </div>
      </div>

      {/* Preset Friendly Watering Sips */}
      <div className="watering-presets-block">
        <span className="presets-title">Gentle Dosing Presets</span>
        <div className="preset-buttons-grid">
          <button
            type="button"
            onClick={() => handleStartPreset('Quick Sip', 5)}
            disabled={disabled || secondsRemaining !== null || pumpState === 'on'}
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
            disabled={disabled || secondsRemaining !== null || pumpState === 'on'}
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
            disabled={disabled || secondsRemaining !== null || pumpState === 'on'}
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
            disabled={disabled}
            className="pump-action-btn btn-turn-on"
            title="Start pump with 30s hardware failsafe"
          >
            <Power size={18} />
            <span>Turn Pump ON</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopPump}
            disabled={disabled}
            className="pump-action-btn btn-turn-off"
            title="Immediately turn pump OFF"
          >
            <Power size={18} />
            <span>Turn Pump OFF</span>
          </button>
        )}
      </div>

      {/* Safety Notice */}
      <div className="safeguards-notice">
        <ShieldCheck size={15} color="#52b788" />
        <span>
          <strong>Hardware Safeguards Enforced:</strong> Maximum continuous run duration is limited to 30 seconds to prevent overwatering or dry pump damage.
        </span>
      </div>
    </div>
  );
};
