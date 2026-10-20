'use client';

import React, { useState } from 'react';
import { X, Check, RotateCcw, Database } from 'lucide-react';
import { DEFAULT_FIREBASE_CONFIG } from '@/lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUrl(urlInput.trim());
    onClose();
  };

  const handleReset = () => {
    setUrlInput(DEFAULT_FIREBASE_CONFIG.databaseURL);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={20} color="#38bdf8" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Firebase Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="tool-badge-btn"
            style={{ padding: 6, borderRadius: '50%' }}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
          Specify your Firebase Realtime Database URL. The system listens to <code>/telemetry</code> and dispatches actuations to <code>/commands</code>.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
              Database URL
            </label>
            <input
              type="text"
              className="input-field"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://your-project.firebaseio.com"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <button
              type="button"
              onClick={handleReset}
              className="tool-badge-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCcw size={14} />
              <span>Reset Default</span>
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="tool-badge-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="action-btn btn-on"
                style={{ width: 'auto', padding: '10px 20px', fontSize: 14 }}
              >
                <Check size={16} />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
