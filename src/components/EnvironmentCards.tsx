'use client';

import React from 'react';
import { Cpu, Power, Wifi, ShieldCheck, Activity } from 'lucide-react';
import { TelemetryData } from '@/types';

interface EnvironmentCardsProps {
  telemetry: TelemetryData | null;
  mode: 'auto' | 'manual';
  pumpState: 'on' | 'off';
  lastUpdated: string | null;
  latencyMs?: number;
  rawAdc?: number;
  calibratedMoisture?: number | null;
}

export const EnvironmentCards: React.FC<EnvironmentCardsProps> = ({
  telemetry,
  mode,
  pumpState,
  lastUpdated,
  latencyMs,
  rawAdc,
  calibratedMoisture,
}) => {
  return (
    <div className="side-cards-column">
      {/* Operating Mode Card */}
      <div className="mini-telemetry-card">
        <div className="mini-card-info">
          <span className="mini-card-label">Automation State</span>
          <div className="mini-card-value">
            <span
              style={{
                color: mode === 'auto' ? '#74c69d' : '#38bdf8',
                fontWeight: 700,
              }}
            >
              {mode === 'auto' ? 'Automated AI Mode' : 'Direct Manual Control'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {mode === 'auto' ? 'ESP32 monitors moisture thresholds' : 'Human actuator overrides active'}
          </span>
        </div>
        <div
          className="mini-card-icon"
          style={{
            background: mode === 'auto' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${mode === 'auto' ? 'rgba(82, 183, 136, 0.35)' : 'rgba(56, 189, 248, 0.3)'}`,
          }}
        >
          <Cpu size={22} color={mode === 'auto' ? '#74c69d' : '#38bdf8'} />
        </div>
      </div>

      {/* Valve Actuator State Card */}
      <div className="mini-telemetry-card">
        <div className="mini-card-info">
          <span className="mini-card-label">Pump Relay Status</span>
          <div className="mini-card-value">
            <span
              style={{
                color: pumpState === 'on' ? '#34d399' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {pumpState === 'on' ? 'VALVE OPEN (IRRIGATING)' : 'VALVE CLOSED (IDLE)'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {pumpState === 'on' ? 'Dispensing water' : 'Static water line sealed'}
          </span>
        </div>
        <div
          className="mini-card-icon"
          style={{
            background: pumpState === 'on' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${pumpState === 'on' ? 'rgba(52, 211, 153, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
          }}
        >
          <Power size={22} color={pumpState === 'on' ? '#34d399' : '#64748b'} />
        </div>
      </div>

      {/* Inverted Sensor Calibration Status Card */}
      <div className="mini-telemetry-card">
        <div className="mini-card-info">
          <span className="mini-card-label">Soil Sensor Calibration</span>
          <div className="mini-card-value" style={{ fontSize: 16 }}>
            <span>
              {rawAdc !== undefined ? `ADC: ${rawAdc}` : '12-bit ADC Inverted'}
            </span>
            <span style={{ fontSize: 13, color: '#52b788', fontWeight: 600, marginLeft: 6 }}>
              {calibratedMoisture !== null && calibratedMoisture !== undefined ? `(${calibratedMoisture}%)` : ''}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Inverted mapping active: 4095 ADC = 0% moisture
          </span>
        </div>
        <div
          className="mini-card-icon"
          style={{
            background: 'rgba(82, 183, 136, 0.15)',
            border: '1px solid rgba(82, 183, 136, 0.35)',
          }}
        >
          <ShieldCheck size={22} color="#74c69d" />
        </div>
      </div>

      {/* Cloud Transport Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--text-dim)',
          padding: '4px 6px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wifi size={12} color="#52b788" />
          ESP32 Stream: {lastUpdated ? `Live @ ${lastUpdated}` : 'Listening...'}
        </span>
        {latencyMs !== undefined && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{latencyMs}ms ping</span>
        )}
      </div>
    </div>
  );
};
