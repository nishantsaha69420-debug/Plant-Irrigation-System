'use client';

import React from 'react';
import { HistoryPoint } from '@/types';
import { TrendingUp, Sprout } from 'lucide-react';

interface TelemetryChartProps {
  history: HistoryPoint[];
  targetRange?: [number, number];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  history,
  targetRange = [40, 70],
}) => {
  if (history.length < 2) {
    return (
      <div className="history-card">
        <div className="history-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#74c69d" />
            <span className="section-title">Root Zone Moisture Trajectory</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Collecting telemetry points...</span>
        </div>
        <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          Listening for ESP32 moisture stream to construct trajectory...
        </div>
      </div>
    );
  }

  // Calculate SVG bounds
  const width = 600;
  const height = 120;
  const paddingY = 16;
  const paddingX = 14;

  const values = history.map((h) => h.moisture);
  const minVal = Math.max(0, Math.min(...values) - 10);
  const maxVal = Math.min(100, Math.max(...values) + 10);
  const range = maxVal - minVal || 1;

  const points = history.map((pt, index) => {
    const x = paddingX + (index / (history.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((pt.moisture - minVal) / range) * (height - 2 * paddingY);
    return { x, y, ...pt };
  });

  const pathD = points.reduce((acc, curr, index) => {
    return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Area path for gradient fill
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

  // Target band coordinates on Y axis
  const targetMinY = Math.max(0, height - paddingY - ((targetRange[0] - minVal) / range) * (height - 2 * paddingY));
  const targetMaxY = Math.max(0, height - paddingY - ((targetRange[1] - minVal) / range) * (height - 2 * paddingY));
  const targetBandHeight = Math.abs(targetMinY - targetMaxY);
  const targetBandTop = Math.min(targetMinY, targetMaxY);

  const currentVal = lastPoint.moisture;
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return (
    <div className="history-card">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="#74c69d" />
          <span className="section-title">Soil Moisture History & Target Zone</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Average: <strong style={{ color: 'var(--text-main)' }}>{avgVal}%</strong></span>
          <span>Latest: <strong style={{ color: '#52b788' }}>{currentVal}%</strong></span>
        </div>
      </div>

      <div className="chart-wrapper">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="forestAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52b788" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2d6a4f" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="forestStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#74c69d" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Target Zone Shaded Band */}
          {targetRange[1] >= minVal && targetRange[0] <= maxVal && (
            <rect
              x={paddingX}
              y={targetBandTop}
              width={width - 2 * paddingX}
              height={targetBandHeight}
              fill="rgba(82, 183, 136, 0.08)"
              stroke="rgba(82, 183, 136, 0.2)"
              strokeDasharray="3 3"
            />
          )}

          {/* Area fill */}
          <path d={areaD} fill="url(#forestAreaGrad)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#forestStrokeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glowing latest dot */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="5"
            fill="#52b788"
            stroke="#ffffff"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 6px rgba(82, 183, 136, 0.8))' }}
          />
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
        <span>Start: {history[0].time}</span>
        <span style={{ color: '#52b788' }}>Shaded band represents {targetRange[0]}%–{targetRange[1]}% ideal zone</span>
        <span>Latest: {lastPoint.time}</span>
      </div>
    </div>
  );
};
