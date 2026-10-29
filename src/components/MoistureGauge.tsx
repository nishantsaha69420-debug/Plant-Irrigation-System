'use client';

import React, { useEffect, useRef } from 'react';
import { Droplet, CheckCircle2, AlertTriangle, Clock, Waves, ShieldAlert } from 'lucide-react';
import { parseAndCalibrateMoisture } from '@/lib/calibration';
import { gsap } from 'gsap';

interface MoistureGaugeProps {
  moisture: number | string | null;
  avgMoisture?: number | string | null;
  soil1?: number | string | null;
  soil2?: number | string | null;
  sensorFault?: boolean;
  isPumpOn: boolean;
  mode: 'auto' | 'manual';
  lastUpdated: string | null;
  targetRange?: [number, number];
  isSimulated?: boolean;
  isOnline?: boolean;
}

export const MoistureGauge: React.FC<MoistureGaugeProps> = ({
  moisture,
  avgMoisture,
  soil1,
  soil2,
  sensorFault = false,
  isPumpOn,
  mode,
  lastUpdated,
  targetRange = [40, 70],
  isSimulated = false,
  isOnline = false,
}) => {
  const effectiveActive = isSimulated || isOnline;
  const barFillRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const prevPctRef = useRef<number>(0);

  const numMoisture =
    typeof moisture === 'number'
      ? moisture
      : typeof moisture === 'string' && !isNaN(parseFloat(moisture))
      ? parseFloat(moisture)
      : null;

  const validPct = effectiveActive && numMoisture !== null ? Math.min(100, Math.max(0, numMoisture)) : null;

  // GSAP animation for smooth bar width and number transitions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targetWidth = validPct ?? 0;

    if (barFillRef.current) {
      if (prefersReduced) {
        barFillRef.current.style.width = `${targetWidth}%`;
      } else {
        gsap.to(barFillRef.current, {
          width: `${targetWidth}%`,
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    }

    if (numberRef.current && validPct !== null && !prefersReduced) {
      const startVal = prevPctRef.current;
      const endVal = Math.round(validPct);
      const counter = { val: startVal };

      gsap.to(counter, {
        val: endVal,
        duration: 0.5,
        ease: 'power1.out',
        overwrite: 'auto',
        onUpdate: () => {
          if (numberRef.current) {
            numberRef.current.textContent = String(Math.round(counter.val));
          }
        },
      });
      prevPctRef.current = endVal;
    } else if (numberRef.current) {
      numberRef.current.textContent = validPct !== null ? String(Math.round(validPct)) : '--';
      if (validPct !== null) prevPctRef.current = Math.round(validPct);
    }
  }, [validPct]);

  // Compute individual probe percentages for secondary diagnostic line
  const probe1Cal = soil1 !== undefined && soil1 !== null && soil1 !== '' ? parseAndCalibrateMoisture(soil1) : null;
  const probe2Cal = soil2 !== undefined && soil2 !== null && soil2 !== '' ? parseAndCalibrateMoisture(soil2) : null;
  const isAtMaxADC = (Number(soil1) >= 4090 && Number(soil2) >= 4090);

  let conditionText = 'Awaiting Sensor Signal';
  let conditionBadgeClass = 'condition-neutral';
  let barGradient = 'linear-gradient(90deg, #d8f3dc, #52b788)';
  let ConditionIcon = Clock;

  if (sensorFault) {
    conditionText = 'Sensor Discrepancy Fault';
    conditionBadgeClass = 'condition-dry';
    ConditionIcon = ShieldAlert;
    barGradient = 'linear-gradient(90deg, #f87171, #fb923c)';
  } else if (!effectiveActive) {
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
          <h3 className="centerpiece-title">Averaged Soil Moisture</h3>
        </div>

        <div className="centerpiece-status-badges">
          <div className={`status-pill ${conditionBadgeClass}`}>
            <ConditionIcon size={13} />
            <span>{conditionText}</span>
          </div>
          {sensorFault && (
            <div
              className="status-pill condition-dry"
              style={{
                background: 'rgba(239, 68, 68, 0.22)',
                borderColor: 'rgba(239, 68, 68, 0.45)',
                color: '#fca5a5',
              }}
              title="Dual capacitive probes diverge significantly. Irrigation safeguards active."
            >
              <AlertTriangle size={13} />
              <span>Fault Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Fault Critical Warning Alert */}
      {sensorFault && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#fca5a5',
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          <ShieldAlert size={16} color="#f87171" style={{ flexShrink: 0 }} />
          <span>
            <strong>Sensor Divergence Warning:</strong> Soil probes 1 and 2 disagree beyond tolerance. This averaged percentage is not guaranteed reliable. Automatic watering is paused.
          </span>
        </div>
      )}

      {/* Hero Moisture Percentage Display */}
      <div className="moisture-hero-readout">
        <div className="readout-num-wrapper">
          <span className="readout-huge-number" ref={numberRef}>
            {validPct !== null ? Math.round(validPct) : '--'}
          </span>
          <span className="readout-unit">%</span>
        </div>

        <div className="readout-meta">
          <div className="moisture-level-indicator">
            <Droplet
              size={20}
              className={isPumpOn ? 'droplet-active' : ''}
              color={
                sensorFault
                  ? '#f87171'
                  : validPct !== null && validPct < targetRange[0]
                  ? '#fb923c'
                  : '#52b788'
              }
            />
            <span
              style={{
                fontWeight: 600,
                color: sensorFault ? '#fca5a5' : 'var(--text-main)',
                fontSize: 14,
              }}
            >
              {sensorFault
                ? 'Fault Detected — Verification Needed'
                : validPct !== null
                ? `${validPct.toFixed(1)}% Averaged Saturation`
                : effectiveActive
                ? 'No reading yet'
                : 'Hardware Disconnected'}
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

      {/* Secondary Diagnostic Line: Individual Sensor Readings */}
      {(soil1 !== undefined || soil2 !== undefined || avgMoisture !== undefined) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(10, 23, 16, 0.65)',
            border: '1px solid rgba(116, 198, 157, 0.16)',
            borderRadius: 10,
            fontSize: 11.5,
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <span style={{ color: 'var(--brand-sage)', fontWeight: 600 }}>
            Dual Probes (Diagnostic):
          </span>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>
              Sensor 1:{' '}
              <strong style={{ color: 'var(--warm-ivory)' }}>
                {probe1Cal ? `${probe1Cal.percentage}%` : soil1 !== undefined ? `ADC ${soil1}` : '--'}
              </strong>
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>
              Sensor 2:{' '}
              <strong style={{ color: 'var(--warm-ivory)' }}>
                {probe2Cal ? `${probe2Cal.percentage}%` : soil2 !== undefined ? `ADC ${soil2}` : '--'}
              </strong>
            </span>
            {avgMoisture !== undefined && avgMoisture !== null && (
              <>
                <span style={{ opacity: 0.4 }}>|</span>
                <span style={{ color: 'var(--text-dim)' }}>
                  Avg ADC: <strong style={{ color: 'var(--text-muted)' }}>{Math.round(Number(avgMoisture))}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hardware Tip when both sensors are at max ADC 4095 */}
      {isAtMaxADC && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 10,
            fontSize: 11.5,
            color: '#fde68a',
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <strong>⚠️ Both probes reading dry rail (ADC 4095 = 0% moisture).</strong>
          <div style={{ opacity: 0.9, marginTop: 2 }}>
            If probes are already in moist soil, ensure: 1) Sensors are powered from <strong>5V/VIN</strong>, 2) Connected to <strong>ADC1 pins (GPIO 4 &amp; 5)</strong>, and 3) <code>analogSetAttenuation(ADC_11db)</code> is enabled in the ESP32 code.
          </div>
        </div>
      )}

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
            ref={barFillRef}
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

      {/* Realtime Context Bar */}
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
