'use client';

import React from 'react';
import { Droplet, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Waves } from 'lucide-react';

interface MoistureGaugeProps {
  moisture: number | string | null;
  rawAdc?: number;
  isPumpOn: boolean;
  mode: 'auto' | 'manual';
  lastUpdated: string | null;
  targetRange?: [number, number]; // default [40, 70]
  isCalibrated?: boolean;
  isSimulated?: boolean;
}

export const MoistureGauge: React.FC<MoistureGaugeProps> = ({
  moisture,
  rawAdc,
  isPumpOn,
  mode,
  lastUpdated,
  targetRange = [40, 70],
  isCalibrated = true,
  isSimulated = false,
}) => {
  // Validate and parse numerical percentage
  const numMoisture =
    typeof moisture === 'number'
      ? moisture
      : typeof moisture === 'string' && !isNaN(parseFloat(moisture))
      ? parseFloat(moisture)
      : null;

  const validPct = numMoisture !== null ? Math.min(100, Math.max(0, numMoisture)) : null;

  // Determine condition
  let conditionText = 'Awaiting Sensor Signal';
  let conditionBadgeClass = 'condition-neutral';
  let barGradient = 'linear-gradient(90deg, #d8f3dc, #52b788)';
  let ConditionIcon = Clock;

  if (validPct === null) {
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

  // Calculate target range indicator positions (in %)
  const targetMinPos = targetRange[0];
  const targetWidth = targetRange[1] - targetRange[0];

  return (
    <div className="moisture-centerpiece-card">
      <div className="centerpiece-top-row">
        <div>
          <span className="eyebrow-label">Primary Living Telemetry</span>
          <h3 className="centerpiece-title">Calibrated Soil Moisture</h3>
        </div>

        <div className="centerpiece-status-badges">
          <div className={`status-pill ${conditionBadgeClass}`}>
            <ConditionIcon size={13} />
            <span>{conditionText}</span>
          </div>

          <div className="calibrated-tag" title="Inverted capacitive/resistive sensor calibration: 4095 ADC = 0% moisture">
            <ShieldCheck size={12} color="#52b788" />
            <span>{rawAdc !== undefined ? `ADC: ${rawAdc} (Inverted)` : '4095 ADC = 0% (Inverted)'}</span>
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
              {validPct !== null ? `${validPct.toFixed(1)}% Saturation` : 'No reading yet'}
            </span>
          </div>
          <span className="last-read-timestamp">
            {rawAdc !== undefined
              ? `Sensor 12-bit ADC: ${rawAdc} (4095 = dry 0%)`
              : lastUpdated
              ? `Last verified reading: ${lastUpdated}`
              : 'Awaiting incoming packet from ESP32'}
          </span>
        </div>
      </div>

      {/* Proportional Linear Moisture Scale with Target Range Band */}
      <div className="moisture-bar-container">
        <div className="bar-track">
          {/* Target Zone Shading overlay */}
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

          {/* Active Moisture Fill Bar */}
          <div
            className="bar-fill"
            style={{
              width: `${validPct ?? 0}%`,
              background: barGradient,
            }}
          >
            {/* Water Wave animation inside bar */}
            <div className="bar-water-shimmer" />
            {validPct !== null && validPct > 8 && (
              <div className="bar-handle-dot" />
            )}
          </div>
        </div>

        {/* 0 to 100% Scale Markers */}
        <div className="scale-labels-row">
          <span>0% (Dry • 4095 ADC)</span>
          <span style={{ color: '#52b788', fontWeight: 600 }}>Target: {targetRange[0]}%–{targetRange[1]}%</span>
          <span>100% (Wet • ~1200 ADC)</span>
        </div>
      </div>

      {/* Realtime Context Bar */}
      <div className="centerpiece-footer-info">
        <div className="info-item">
          <span className="info-dot" style={{ backgroundColor: isPumpOn ? '#38bdf8' : '#737b70' }} />
          <span>Pump Valve: <strong>{isPumpOn ? 'DISPENSING WATER' : 'CLOSED'}</strong></span>
        </div>

        <div className="info-item">
          <span>Operating Mode: <strong>{mode.toUpperCase()}</strong></span>
        </div>

        <div className="info-item">
          <span>Stream: <strong>{isSimulated ? 'DEMO VIRTUAL' : 'LIVE ESP32 RTDB'}</strong></span>
        </div>
      </div>
    </div>
  );
};
