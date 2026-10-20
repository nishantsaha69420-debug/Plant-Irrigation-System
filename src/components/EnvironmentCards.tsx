'use client';

import React from 'react';
import { Cpu, Power, Wifi, WifiOff } from 'lucide-react';
import { TelemetryData } from '@/types';

interface EnvironmentCardsProps {
  telemetry: TelemetryData | null;
  mode: 'auto' | 'manual';
  pumpState: 'on' | 'off';
  lastUpdated: string | null;
  latencyMs?: number;
  isOnline?: boolean;
}

export const EnvironmentCards: React.FC<EnvironmentCardsProps> = ({
  telemetry,
  mode,
  pumpState,
  lastUpdated,
  latencyMs,
  isOnline = false,
}) => {
  return (
    <div className="side-cards-column">
      {/* Operating Mode Card */}
      <div className="mini-telemetry-card">
        <div className="mini-card-info">
          <span className="mini-card-label">Hardware Discovery</span>
          <div className="mini-card-value">
            <span
              style={{
                color: !isOnline ? '#38bdf8' : mode === 'auto' ? '#74c69d' : '#38bdf8',
                fontWeight: 700,
              }}
            >
              {!isOnline ? 'Scanning for ESP32...' : mode === 'auto' ? 'Automated AI Mode' : 'Direct Manual Control'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: !isOnline ? '#7dd3fc' : 'var(--text-dim)' }}>
            {!isOnline ? 'Continuous network scan active — will link automatically' : mode === 'auto' ? 'ESP32 monitors moisture thresholds' : 'Human actuator overrides active'}
          </span>
        </div>
        <div
          className="mini-card-icon"
          style={{
            background: !isOnline ? 'rgba(56, 189, 248, 0.15)' : mode === 'auto' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${!isOnline ? 'rgba(56, 189, 248, 0.35)' : mode === 'auto' ? 'rgba(82, 183, 136, 0.35)' : 'rgba(56, 189, 248, 0.3)'}`,
          }}
        >
          <Cpu size={22} color={!isOnline ? '#38bdf8' : mode === 'auto' ? '#74c69d' : '#38bdf8'} />
        </div>
      </div>

      {/* Valve Actuator State Card */}
      <div className="mini-telemetry-card">
        <div className="mini-card-info">
          <span className="mini-card-label">Pump Relay Status</span>
          <div className="mini-card-value">
            <span
              style={{
                color: !isOnline ? 'var(--text-muted)' : pumpState === 'on' ? '#34d399' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {!isOnline ? 'VALVE CLOSED (WAITING FOR ESP32)' : pumpState === 'on' ? 'VALVE OPEN (IRRIGATING)' : 'VALVE CLOSED (IDLE)'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {!isOnline ? 'Connects automatically when ESP32 powers on Wi-Fi' : pumpState === 'on' ? 'Dispensing water' : 'Static water line sealed'}
          </span>
        </div>
        <div
          className="mini-card-icon"
          style={{
            background: isOnline && pumpState === 'on' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isOnline && pumpState === 'on' ? 'rgba(52, 211, 153, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
          }}
        >
          <Power size={22} color={isOnline && pumpState === 'on' ? '#34d399' : '#64748b'} />
        </div>
      </div>

      {/* Cloud Transport Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: isOnline ? 'var(--text-dim)' : '#7dd3fc',
          padding: '4px 6px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isOnline ? (
            <Wifi size={12} color="#52b788" />
          ) : (
            <Wifi size={12} color="#38bdf8" className="animate-spin" />
          )}
          <span>
            ESP32 Stream:{' '}
            <strong style={{ color: isOnline ? '#74c69d' : '#38bdf8' }}>
              {isOnline ? (lastUpdated ? `Live @ ${lastUpdated}` : 'Active') : 'Scanning (Auto-connects on Wi-Fi)'}
            </strong>
          </span>
        </span>
        {isOnline && latencyMs !== undefined && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{latencyMs}ms ping</span>
        )}
      </div>
    </div>
  );
};
