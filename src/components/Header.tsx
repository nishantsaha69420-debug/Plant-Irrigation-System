'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sprout,
  Volume2,
  VolumeX,
  Sliders,
  PlayCircle,
  StopCircle,
  RefreshCw,
  ChevronDown,
  User as UserIcon,
  LogOut,
  LogIn,
} from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  plantName: string;
  onOpenPlantProfile: () => void;
  isScanning?: boolean;
  user?: { displayName?: string | null; email?: string | null } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  isSimulated,
  onToggleSimulated,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onRefresh,
  isLoading,
  plantName,
  onOpenPlantProfile,
  isScanning = false,
  user,
  onLogout,
}) => {
  return (
    <header className="dashboard-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Sprout size={26} color="#74c69d" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h1 className="brand-title">Rootwise</h1>
            <span className="brand-badge-version">v2.1</span>
          </div>
          <p className="brand-tagline">A little intelligence. A healthier root system.</p>
        </div>
      </div>

      {/* Center Plant Selector Quick Dropdown */}
      <button
        type="button"
        onClick={onOpenPlantProfile}
        className="header-plant-selector"
        title="Switch plant zone or care settings"
      >
        <span style={{ fontSize: 14 }}>🪴</span>
        <span className="header-plant-label">{plantName}</span>
        <ChevronDown size={14} color="var(--brand-sage)" />
      </button>

      {/* Action Controls & Hardware Status */}
      <div className="header-actions-group">
        <button
          onClick={onToggleSimulated}
          className={`tool-badge-btn ${isSimulated ? 'active-sim' : ''}`}
          title={isSimulated ? 'Exit Demo Simulation' : 'Switch to Demo Simulation Mode'}
          type="button"
        >
          {isSimulated ? <StopCircle size={14} /> : <PlayCircle size={14} />}
          <span>{isSimulated ? 'Demo Active' : 'Demo Mode'}</span>
        </button>

        <button
          onClick={onToggleSound}
          className={`tool-badge-btn ${soundEnabled ? 'active' : ''}`}
          title={soundEnabled ? 'Mute Tactile Nature Audio' : 'Enable Tactile Audio'}
          type="button"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        <button
          onClick={onRefresh}
          className={`tool-badge-btn ${isLoading ? 'active' : ''}`}
          title="Force Telemetry Sync"
          type="button"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={onOpenSettings}
          className="tool-badge-btn"
          title="Firebase Hardware Settings"
          type="button"
        >
          <Sliders size={14} />
        </button>

        {/* User Account / Sign In / Sign Out */}
        {user ? (
          <div className="header-auth-cluster">
            <div className="user-badge" title={user.email || 'Rootwise User'}>
              <UserIcon size={14} color="var(--brand-sage)" />
              <span className="user-badge-name">
                {user.displayName || user.email?.split('@')[0] || 'Grower'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="tool-badge-btn logout-btn"
              title="Sign Out of Rootwise"
              type="button"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="tool-badge-btn login-btn"
            title="Sign In to Rootwise"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </Link>
        )}


        {/* Real Hardware Verification Status Badge */}
        <div
          className={`status-badge ${
            isSimulated ? 'simulated' : isConnected ? 'online' : isScanning ? 'scanning' : 'offline'
          }`}
          title={
            isSimulated
              ? 'Virtual Simulated Telemetry'
              : isConnected
              ? 'ESP32 Realtime Database Online'
              : isScanning
              ? 'Rootwise is actively scanning for your ESP32 on Wi-Fi...'
              : 'Please connect your ESP32 to Wi-Fi to continue'
          }
        >
          <span className={isConnected ? 'pulse-dot' : isScanning ? 'radar-scan-dot' : 'pulse-dot'} />
          <span>
            {isSimulated
              ? 'SIMULATED'
              : isConnected
              ? 'ESP32 ONLINE'
              : isScanning
              ? 'SCANNING FOR ESP32...'
              : 'ESP32 OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
};
