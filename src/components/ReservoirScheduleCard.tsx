'use client';

import React from 'react';
import { Waves, Calendar, Droplets, CheckCircle, Clock } from 'lucide-react';

interface ReservoirScheduleCardProps {
  reservoirPct?: number; // default 82
  lastWateredTime?: string;
  nextWateredEst?: string;
  weeklyDoseMl?: number;
}

export const ReservoirScheduleCard: React.FC<ReservoirScheduleCardProps> = ({
  reservoirPct = 82,
  lastWateredTime = 'Today at 02:45 PM',
  nextWateredEst = 'In ~4.5 hours (soil drying trend)',
  weeklyDoseMl = 1450,
}) => {
  return (
    <div className="reservoir-schedule-grid">
      {/* Reservoir Tank Card */}
      <div className="sub-panel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Waves size={16} color="#38bdf8" />
            <span className="eyebrow-label">Water Supply Tank</span>
          </div>
          <span style={{ fontSize: 12, color: '#52b788', fontWeight: 700 }}>Optimal Supply</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Animated Mini Tank Visual */}
          <div className="mini-tank-visual">
            <div
              className="mini-tank-fill"
              style={{ height: `${reservoirPct}%` }}
            >
              <div className="tank-wave" />
            </div>
            <span className="tank-pct-label">{reservoirPct}%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              1.8 Liters Remaining
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Estimated 14 days of automatic hydration before refill.
            </p>
          </div>
        </div>
      </div>

      {/* Intelligent Irrigation Schedule Card */}
      <div className="sub-panel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#74c69d" />
            <span className="eyebrow-label">Hydration Routine</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Adaptive AI</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <CheckCircle size={15} color="#52b788" />
            <span style={{ color: 'var(--text-muted)' }}>Last watered:</span>
            <strong style={{ color: 'var(--text-main)' }}>{lastWateredTime}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Clock size={15} color="#fbbf24" />
            <span style={{ color: 'var(--text-muted)' }}>Next anticipated drink:</span>
            <strong style={{ color: '#fbbf24' }}>{nextWateredEst}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Droplets size={15} color="#38bdf8" />
            <span style={{ color: 'var(--text-muted)' }}>7-day volume:</span>
            <strong style={{ color: 'var(--text-main)' }}>{weeklyDoseMl} ml total</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
