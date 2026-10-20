'use client';

import React from 'react';
import { Droplet, CheckCircle2, AlertTriangle, Clock, Waves } from 'lucide-react';

interface MoistureGaugeProps {
  moisture: number | string | null;
  isPumpOn: boolean;
  mode: 'auto' | 'manual';
  lastUpdated: string | null;
  targetRange?: [number, number];
  isSimulated?: boolean;
  isOnline?: boolean;
}

export const MoistureGauge: React.FC<MoistureGaugeProps> = ({
  moisture,
  isPumpOn,
  mode,
  lastUpdated,
  targetRange = [40, 70],
  isSimulated = false,
  isOnline = false,
}) => {
  const effectiveActive = isSimulated || isOnline;

  const numMoisture =
    typeof moisture === 'number'
      ? moisture
      : typeof moisture === 'string' && !isNaN(parseFloat(moisture))
      ? parseFloat(moisture)
      : null;

  const validPct = effectiveActive && numMoisture !== null ? Math.min(100, Math.max(0, numMoisture)) : null;

  let conditionText = 'Awaiting Sensor Signal';
  let conditionBadgeClass = 'condition-neutral';
  let barGradient = 'linear-gradient(90deg, #d8f3dc, #52b788)';
  let ConditionIcon = Clock;

  if (!effectiveActive) {
    conditionText = 'Scanning for ESP32...';
    conditionBadgeClass = 'condition-neutral';
    ConditionIcon = Clock;
  } else if (validPct === null) {
    conditionText = 'Sensor Disconnected';
    conditionBadgeClass = 'condition-neutral';
  } else if (validPct < targetRange[0]) {
    conditionText = validPct < 25 ? 'Critically Low Moisture' : 'Below Target — Dry Soil';
    conditionBadgeClass = 'condition-dry';
    barGradient = 'linear-gradient(90deg, #f87171, #fb923c)';
    ConditionIcon = AlertTriangle;
  } else if (validPct > targetRange[1]) {
    conditionText = 'Saturated / Excess Moisture';
    conditionBadgeClass = 'condition-wet';
    barGradient = 'linear-gradient(90deg, #38bdf8, #2dd4bf)';
    ConditionIcon = Waves;
  } else {
    conditionText = 'Optimal Moisture Range';
    conditionBadgeClass = 'condition-optimal';
    barGradient = 'linear-gradient(90deg, #40916c, #52b788, #74c69d)';
    ConditionIcon = CheckCircle2;
  }

  const targetMinPos = targetRange[0];
  const targetWidth = targetRange[1] - targetRange[0];

  return (
    <div className="moisture-centerpiece-card">
      <div className="centerpiece-top-row">
        <div>
          <span className="eyebrow-label">Primary Living Telemetry</span>
          <h3 className="centerpiece-title">Soil Moisture Level</h3>
        </div>

        <div className="centerpiece-status-badges">
          <div className={`status-pill ${conditionBadgeClass}`}>
            <ConditionIcon size={13} />
            <span>{conditionText}</span>
          </div>
        </div>
      </div>

      {/* Hero Moisture Percentage Display */}
      <div className="moisture-hero-readout">
        <div className="readout-num-wrapper">
          <span className="readout-huge-number">
            {validPct !== null ? Math.round(validPct) : '--'}
          </span>
          <span className="readout-unit">%</span>
        </div>

        <div className="readout-meta">
          <div className="moisture-level-indicator">
            <Droplet
              size={20}
              className={isPumpOn ? 'droplet-active' : ''}
              color={validPct !== null && validPct < targetRange[0] ? '#fb923c' : '#52b788'}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>
              {validPct !== null ? `${validPct.toFixed(1)}% Saturation` : effectiveActive ? 'No reading yet' : 'Hardware Disconnected'}
            </span>
          </div>
          <span className="last-read-timestamp">
            {effectiveActive
              ? lastUpdated
                ? `Last verified reading: ${lastUpdated}`
                : 'Awaiting incoming packet from ESP32'
              : '🔍 Continuously scanning — connects automatically when ESP32 is on Wi-Fi'}
          </span>
        </div>
      </div>

      {/* Proportional Linear Moisture Scale with Target Range Band */}
      <div className="moisture-bar-container">
        <div className="bar-track">
          <div
            className="target-zone-band"
            style={{
              left: `${targetMinPos}%`,
              width: `${targetWidth}%`,
            }}
            title={`Ideal Target Zone: ${targetRange[0]}% – ${targetRange[1]}%`}
          >
            <span className="target-zone-label">Target {targetRange[0]}–{targetRange[1]}%</span>
          </div>

          <div
            className="bar-fill"
            style={{
              width: `${validPct ?? 0}%`,
              background: barGradient,
            }}
          >
            <div className="bar-water-shimmer" />
            {validPct !== null && validPct > 8 && (
              <div className="bar-handle-dot" />
            )}
          </div>
        </div>

        <div className="scale-labels-row">
          <span>0% (Dry)</span>
          <span style={{ color: '#52b788', fontWeight: 600 }}>Target: {targetRange[0]}%–{targetRange[1]}%</span>
          <span>100% (Saturated)</span>
        </div>
      </div>

      {/* Realtime Context Bar — always 3 in a row, no wrapping */}
      <div className="centerpiece-footer-info">
        <div className="info-item">
          <span className="info-dot" style={{ backgroundColor: isPumpOn ? '#38bdf8' : '#737b70' }} />
          <span>Pump: <strong>{isPumpOn ? 'ACTIVE' : 'OFF'}</strong></span>
        </div>

        <div className="info-item">
          <span>Mode: <strong>{mode.toUpperCase()}</strong></span>
        </div>

        <div className="info-item">
          <span>
            Stream:{' '}
            <strong
              style={{
                color: isSimulated ? '#fbbf24' : isOnline ? '#34d399' : '#38bdf8',
              }}
            >
              {isSimulated ? 'DEMO' : isOnline ? 'LIVE' : 'SCANNING...'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
