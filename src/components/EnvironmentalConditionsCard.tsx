'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Thermometer, Droplets, CloudFog, Info, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { gsap } from 'gsap';

interface EnvironmentalConditionsCardProps {
  temp?: number | string | null;
  humidity?: number | string | null;
  vpd?: number | string | null;
  thermalLockout?: boolean;
  autoMode?: boolean;
  sensorFault?: boolean;
  isOnline?: boolean;
  isSimulated?: boolean;
}

const MAX_SAFE_TEMP = 35.0;

function parseSafeNumber(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
}

export const EnvironmentalConditionsCard: React.FC<EnvironmentalConditionsCardProps> = ({
  temp,
  humidity,
  vpd,
  thermalLockout = false,
  autoMode = true,
  sensorFault = false,
  isOnline = false,
  isSimulated = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const lockoutBannerRef = useRef<HTMLDivElement>(null);
  const [showVpdTooltip, setShowVpdTooltip] = useState<boolean>(false);

  const effectiveActive = isOnline || isSimulated;

  const parsedTemp = parseSafeNumber(temp);
  const parsedHumidity = parseSafeNumber(humidity);
  const parsedVpd = parseSafeNumber(vpd);

  // Entrance animation: play once when mounted, avoid replaying on telemetry updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  // Restrained transition when thermal lockout state toggles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !lockoutBannerRef.current) return;

    if (thermalLockout && autoMode) {
      gsap.fromTo(
        lockoutBannerRef.current,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [thermalLockout, autoMode]);

  const hasMissingTelemetry = effectiveActive && (parsedTemp === null || parsedHumidity === null);
  const isLockoutActive = thermalLockout && autoMode;

  return (
    <div className="sub-panel-card environmental-conditions-card" ref={cardRef}>
      {/* Header Row */}
      <div className="centerpiece-top-row" style={{ marginBottom: 16 }}>
        <div>
          <span className="eyebrow-label">Microclimate Telemetry • DHT11</span>
          <h3 className="centerpiece-title" style={{ fontSize: 20 }}>
            Environmental Conditions
          </h3>
        </div>

        <div className="centerpiece-status-badges">
          {isLockoutActive ? (
            <div
              className="status-pill condition-dry"
              style={{
                background: 'rgba(239, 68, 68, 0.22)',
                borderColor: 'rgba(239, 68, 68, 0.45)',
                color: '#fca5a5',
              }}
            >
              <AlertTriangle size={13} />
              <span>Thermal Lockout</span>
            </div>
          ) : sensorFault ? (
            <div
              className="status-pill condition-dry"
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                borderColor: 'rgba(245, 158, 11, 0.45)',
                color: '#fde68a',
              }}
            >
              <ShieldAlert size={13} />
              <span>Sensor Fault</span>
            </div>
          ) : effectiveActive ? (
            <div className="status-pill condition-optimal">
              <CheckCircle2 size={13} />
              <span>Climate Optimal</span>
            </div>
          ) : (
            <div className="status-pill condition-neutral">
              <span>Scanning Sensors...</span>
            </div>
          )}
        </div>
      </div>

      {/* Critical Thermal Lockout Alert in AUTO Mode */}
      {isLockoutActive && (
        <div
          ref={lockoutBannerRef}
          className="thermal-lockout-banner"
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
              Ambient temperature is{' '}
              <strong style={{ color: '#ffffff' }}>
                {parsedTemp !== null ? `${parsedTemp.toFixed(1)}°C` : 'exceeding limits'} / {MAX_SAFE_TEMP.toFixed(1)}°C limit
              </strong>
              . Automatic watering is locked out by hardware safety controls to prevent thermal shock to root systems.
              Switch to Manual Mode if an emergency override is required.
            </p>
          </div>
        </div>
      )}

      {/* Sensor Divergence Discrepancy Alert */}
      {sensorFault && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.14)',
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
            <strong>Sensor Divergence Warning:</strong> Soil moisture probes disagree significantly. Automatic irrigation paused as a precaution.
          </span>
        </div>
      )}

      {/* Sensor Data Unavailable Warning */}
      {hasMissingTelemetry && (
        <div
          style={{
            background: 'rgba(100, 116, 139, 0.12)',
            border: '1px solid rgba(100, 116, 139, 0.25)',
            borderRadius: 10,
            padding: '8px 12px',
            marginBottom: 14,
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Info size={14} color="var(--brand-sage)" />
          <span>DHT11 climate sensor data initializing or temporarily unavailable. Showing latest verified states.</span>
        </div>
      )}

      {/* 3-Metric Responsive Grid */}
      <div className="environmental-metrics-grid">
        {/* Metric 1: Temperature */}
        <div className="env-metric-item">
          <div className="env-metric-header">
            <div
              className="env-icon-wrapper"
              style={{
                background: 'rgba(251, 146, 60, 0.15)',
                color: '#fb923c',
                border: '1px solid rgba(251, 146, 60, 0.3)',
              }}
            >
              <Thermometer size={18} />
            </div>
            <span className="env-metric-label">Temperature</span>
          </div>

          <div className="env-metric-value-row">
            <span
              className="env-metric-value"
              style={{
                color:
                  parsedTemp !== null && parsedTemp > MAX_SAFE_TEMP
                    ? '#f87171'
                    : 'var(--warm-ivory)',
              }}
            >
              {parsedTemp !== null ? parsedTemp.toFixed(1) : '--'}
            </span>
            <span className="env-metric-unit">°C</span>
          </div>

          <span className="env-metric-subtext">
            {parsedTemp !== null
              ? parsedTemp > MAX_SAFE_TEMP
                ? `Exceeds ${MAX_SAFE_TEMP}°C safe threshold`
                : 'Within safe thermal range'
              : 'Waiting for sensor'}
          </span>
        </div>

        {/* Metric 2: Relative Humidity */}
        <div className="env-metric-item">
          <div className="env-metric-header">
            <div
              className="env-icon-wrapper"
              style={{
                background: 'rgba(34, 211, 238, 0.15)',
                color: '#22d3ee',
                border: '1px solid rgba(34, 211, 238, 0.3)',
              }}
            >
              <Droplets size={18} />
            </div>
            <span className="env-metric-label">Relative Humidity</span>
          </div>

          <div className="env-metric-value-row">
            <span className="env-metric-value" style={{ color: 'var(--warm-ivory)' }}>
              {parsedHumidity !== null ? Math.round(parsedHumidity) : '--'}
            </span>
            <span className="env-metric-unit">%</span>
          </div>

          <span className="env-metric-subtext">
            {parsedHumidity !== null
              ? parsedHumidity < 30
                ? 'Dry ambient air — high evaporation'
                : parsedHumidity > 80
                ? 'High humidity — low evaporation'
                : 'Balanced ambient moisture'
              : 'Waiting for sensor'}
          </span>
        </div>

        {/* Metric 3: Vapour Pressure Deficit (VPD) */}
        <div className="env-metric-item vpd-item">
          <div className="env-metric-header">
            <div
              className="env-icon-wrapper"
              style={{
                background: 'rgba(52, 211, 153, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.25)',
              }}
            >
              <CloudFog size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="env-metric-label">Vapour Deficit (VPD)</span>
              <button
                type="button"
                onClick={() => setShowVpdTooltip(!showVpdTooltip)}
                onMouseEnter={() => setShowVpdTooltip(true)}
                onMouseLeave={() => setShowVpdTooltip(false)}
                className="vpd-tooltip-trigger"
                title="Learn about Vapour Pressure Deficit"
                aria-label="Vapour Pressure Deficit explanation"
              >
                <Info size={12} />
              </button>
            </div>
          </div>

          <div className="env-metric-value-row">
            <span className="env-metric-value" style={{ color: 'var(--brand-sage)', fontSize: 24 }}>
              {parsedVpd !== null ? parsedVpd.toFixed(2) : '--'}
            </span>
            <span className="env-metric-unit" style={{ fontSize: 13 }}>kPa</span>
          </div>

          <span className="env-metric-subtext" style={{ fontSize: 11 }}>
            {parsedVpd !== null
              ? parsedVpd > 1.6
                ? 'High transpiration stress'
                : parsedVpd < 0.4
                ? 'Low transpiration rate'
                : 'Healthy transpiration gradient'
              : 'Secondary metric'}
          </span>

          {/* Interactive Tooltip Overlay */}
          {showVpdTooltip && (
            <div className="vpd-tooltip-bubble">
              <strong>Vapour Pressure Deficit (VPD):</strong>
              <p>
                Represents the difference between the moisture the air could hold and the moisture it currently contains, adjusted for temperature. Lower VPD means humid air (slow drying); higher VPD drives rapid transpiration and dry soil.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

