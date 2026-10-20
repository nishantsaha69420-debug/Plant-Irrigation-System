'use client';

import React from 'react';
import { ActivityLog } from '@/types';
import { ListFilter, Trash2 } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onClear: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onClear }) => {
  return (
    <div className="activity-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListFilter size={16} color="#94a3b8" />
          <span className="section-title">Telemetry & Actuation Log</span>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="tool-badge-btn"
            style={{ padding: '3px 8px', fontSize: 11 }}
            type="button"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="activity-list">
        {logs.length === 0 ? (
          <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '16px 0' }}>
            No activity logged yet. Actuations and alerts will appear here.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`activity-item ${log.type}`}>
              <span>{log.message}</span>
              <span className="activity-time">{log.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
