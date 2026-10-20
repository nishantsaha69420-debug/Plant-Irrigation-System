'use client';

import React from 'react';
import { Droplet, Sparkles, Heart, Sun, Info, WifiOff } from 'lucide-react';

interface PlantCompanionProps {
  plantName: string;
  location: string;
  moisture: number | null;
  isPumpOn: boolean;
  mode: 'auto' | 'manual';
  onQuickWater: () => void;
  onOpenPlantProfile: () => void;
  isOnline?: boolean;
}

export const PlantCompanion: React.FC<PlantCompanionProps> = ({
  plantName,
  location,
  moisture,
  isPumpOn,
  mode,
  onQuickWater,
  onOpenPlantProfile,
  isOnline = false,
}) => {
  // Never allow pump animation or drinking status if ESP32 is offline!
  const effectivePumpOn = isOnline && isPumpOn;

  // Determine plant health and expression
  let statusMessage = 'Checking plant vitals...';
  let statusMood = 'Normal';
  let moodIcon = Heart;
  let moodColor = '#34d399';
  let leafDroopDeg = 0;
  let soilHue = '#4a3728'; // Rich moist soil

  if (!isOnline) {
    statusMessage = `Scanning for ESP32 on Wi-Fi... Power on your microcontroller and Rootwise will automatically connect!`;
    statusMood = 'Scanning for Wi-Fi...';
    moodColor = '#38bdf8';
    moodIcon = WifiOff;
    leafDroopDeg = 1;
    soilHue = '#4a3728';
  } else if (effectivePumpOn) {
    statusMessage = `Irrigation valve open! Dispensing fresh water directly to roots...`;
    statusMood = 'Drinking';
    moodColor = '#38bdf8';
    moodIcon = Droplet;
  } else if (moisture !== null) {
    if (moisture < 25) {
      statusMessage = `Your ${plantName} is thirsty! Soil is dry and needs a drink.`;
      statusMood = 'Parched';
      moodColor = '#f87171';
      leafDroopDeg = 8;
      soilHue = '#6e543e'; // Dry dusty soil
    } else if (moisture < 40) {
      statusMessage = `Soil moisture is dipping below target. ${mode === 'auto' ? 'Auto-AI will irrigate soon.' : 'Consider a quick watering.'}`;
      statusMood = 'Drying';
      moodColor = '#fbbf24';
      leafDroopDeg = 3;
      soilHue = '#594432';
    } else if (moisture > 80) {
      statusMessage = `Soil is heavily saturated. Let the roots breathe before watering again.`;
      statusMood = 'Saturated';
      moodColor = '#38bdf8';
      leafDroopDeg = 0;
      soilHue = '#2e241b';
    } else {
      statusMessage = `Soil moisture is in the sweet spot! Roots are healthy, aerated, and thriving.`;
      statusMood = 'Thriving';
      moodColor = '#34d399';
      leafDroopDeg = -3; // perked up
      soilHue = '#3f2e20';
    }
  }

  return (
    <div className="plant-companion-card">
      <div className="plant-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="plant-avatar-badge">
            <span style={{ fontSize: 22 }}>🌿</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="plant-name-heading">{plantName}</h2>
              <button
                type="button"
                onClick={onOpenPlantProfile}
                className="plant-info-btn"
                title="Plant Species & Care Notes"
              >
                <Info size={14} />
              </button>
            </div>
            <p className="plant-location-sub">{location}</p>
          </div>
        </div>

        <div className="plant-mood-pill" style={{ borderColor: `${moodColor}40`, background: `${moodColor}15` }}>
          <span className="mood-dot" style={{ backgroundColor: moodColor }} />
          <span style={{ color: moodColor, fontWeight: 700, fontSize: 12 }}>{statusMood}</span>
        </div>
      </div>

      {/* Visual Organic Plant & Soil Cross-section Scene */}
      <div className="botanical-scene">
        {/* Animated Water Droplets when Pump is ON and ESP32 is Online */}
        {effectivePumpOn && (
          <div className="water-spray-particles" aria-hidden="true">
            <div className="drop drop-1" />
            <div className="drop drop-2" />
            <div className="drop drop-3" />
            <div className="drop drop-4" />
            <div className="drop drop-5" />
          </div>
        )}

        {/* Botanical Plant Illustration */}
        <div className="plant-illustration-wrapper">
          <svg
            className="plant-svg"
            viewBox="0 0 240 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft background glow */}
            <circle cx="120" cy="110" r="85" fill="rgba(45, 106, 79, 0.15)" filter="blur(20px)" />

            {/* Stems & Leaves with sway & droop animation */}
            <g
              className="leaves-group"
              style={{
                transformOrigin: '120px 140px',
                transform: `rotate(${leafDroopDeg}deg)`,
                transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Central Main Stem */}
              <path
                d="M120 145 C120 110, 118 75, 120 50"
                stroke="#2d6a4f"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Left Leaf Stem & Leaf */}
              <path
                d="M120 125 C105 115, 80 110, 65 115"
                stroke="#2d6a4f"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                className="leaf-sway-left"
                d="M65 115 C50 95, 30 100, 25 115 C20 130, 45 135, 65 115 Z"
                fill="url(#leafGrad1)"
              />
              <path d="M65 115 Q45 115 30 115" stroke="#74c69d" strokeWidth="1.2" strokeLinecap="round" />

              {/* Right Leaf Stem & Leaf */}
              <path
                d="M120 110 C135 100, 160 95, 175 102"
                stroke="#2d6a4f"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                className="leaf-sway-right"
                d="M175 102 C195 85, 215 90, 220 105 C222 120, 195 125, 175 102 Z"
                fill="url(#leafGrad2)"
              />
              <path d="M175 102 Q195 102 210 102" stroke="#74c69d" strokeWidth="1.2" strokeLinecap="round" />

              {/* Center Top Lush Leaf */}
              <path
                className="leaf-sway-top"
                d="M120 50 C100 30, 105 5, 120 0 C135 5, 140 30, 120 50 Z"
                fill="url(#leafGradTop)"
              />
              <path d="M120 50 L120 10" stroke="#74c69d" strokeWidth="1.4" strokeLinecap="round" />

              {/* Additional Baby Leaf */}
              <path
                d="M120 85 C110 80, 95 75, 88 78"
                stroke="#2d6a4f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M88 78 C76 68, 64 72, 60 80 C58 90, 75 92, 88 78 Z"
                fill="url(#leafGrad1)"
              />
            </g>

            {/* Terracotta Ceramic Pot */}
            <path
              d="M75 140 L165 140 L155 205 C154 212, 148 216, 140 216 L100 216 C92 216, 86 212, 85 205 L75 140 Z"
              fill="url(#potGrad)"
              stroke="#8c4f39"
              strokeWidth="2.5"
            />
            {/* Pot Rim */}
            <rect
              x="70"
              y="134"
              width="100"
              height="10"
              rx="4"
              fill="#c77a58"
              stroke="#8c4f39"
              strokeWidth="2"
            />

            {/* Soil Cross Section inside pot */}
            <path
              d="M78 144 Q120 148 162 144 L154 200 Q120 203 86 200 Z"
              fill={soilHue}
              style={{ transition: 'fill 1s ease' }}
            />

            {/* Organic Roots System in Soil */}
            <g className="roots-system" stroke="#d5bdaf" strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
              <path d="M120 148 Q118 165 110 180 T105 195" />
              <path d="M110 180 Q98 185 92 192" />
              <path d="M120 152 Q126 168 135 182 T142 196" />
              <path d="M135 182 Q144 186 148 190" />
              <path d="M120 160 Q122 178 123 194" />
            </g>

            {/* ESP32 Soil Sensor Probe illustration inserted in soil */}
            <g className="sensor-probe-graphic" transform="translate(142, 126)">
              <rect x="0" y="0" width="7" height="42" rx="2" fill="#183629" stroke={isOnline ? '#52b788' : '#f87171'} strokeWidth="1" />
              <circle cx="3.5" cy="5" r="1.5" fill={effectivePumpOn ? '#38bdf8' : isOnline ? '#10b981' : '#f87171'} className={effectivePumpOn ? 'pulse-dot' : ''} />
              <path d="M1 20 L6 20 M1 26 L6 26 M1 32 L6 32" stroke={isOnline ? '#52b788' : 'rgba(248, 113, 113, 0.4)'} strokeWidth="0.8" />
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="leafGradTop" x1="120" y1="0" x2="120" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#52b788" />
                <stop offset="1" stopColor="#1b4332" />
              </linearGradient>
              <linearGradient id="leafGrad1" x1="25" y1="95" x2="65" y2="135" gradientUnits="userSpaceOnUse">
                <stop stopColor="#74c69d" />
                <stop offset="1" stopColor="#2d6a4f" />
              </linearGradient>
              <linearGradient id="leafGrad2" x1="220" y1="85" x2="175" y2="125" gradientUnits="userSpaceOnUse">
                <stop stopColor="#52b788" />
                <stop offset="1" stopColor="#1b4332" />
              </linearGradient>
              <linearGradient id="potGrad" x1="120" y1="140" x2="120" y2="216" gradientUnits="userSpaceOnUse">
                <stop stopColor="#c77a58" />
                <stop offset="1" stopColor="#8c4f39" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Conversational Assistant Bubble */}
        <div className="plant-speech-bubble">
          <div className="speech-icon-wrapper" style={{ background: isOnline ? 'rgba(82, 183, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
            {isOnline ? (
              <Sparkles size={16} color="#52b788" />
            ) : (
              <WifiOff size={16} color="#f87171" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p className="speech-text" style={{ color: isOnline ? 'var(--text-main)' : '#fca5a5' }}>
              {statusMessage}
            </p>
          </div>
          {isOnline && !effectivePumpOn && moisture !== null && moisture < 40 && (
            <button
              onClick={onQuickWater}
              className="speech-action-btn"
              type="button"
            >
              <Droplet size={13} />
              <span>Give Water</span>
            </button>
          )}
          {!isOnline && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#7dd3fc',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '4px 10px',
                borderRadius: 99,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="radar-scan-dot" style={{ width: 6, height: 6 }} />
              Scanning for ESP32...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
