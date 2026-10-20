'use client';

import React from 'react';
import { X, Sprout } from 'lucide-react';

export interface PlantPreset {
  id: string;
  name: string;
  species: string;
  location: string;
  minMoisture: number;
  maxMoisture: number;
  description: string;
}

export const PLANT_PRESETS: PlantPreset[] = [
  {
    id: 'monstera',
    name: 'Monstera Deliciosa',
    species: 'Swiss Cheese Plant',
    location: 'Living Room Shelf',
    minMoisture: 45,
    maxMoisture: 70,
    description: 'Thrives in medium to bright indirect sunlight. Prefers soil to stay consistently aerated and moderately damp.',
  },
  {
    id: 'fiddle',
    name: 'Fiddle Leaf Fig',
    species: 'Ficus lyrata',
    location: 'Sunroom Bay Window',
    minMoisture: 35,
    maxMoisture: 60,
    description: 'Requires bright filtered light. Sensitive to overwatering; let top 2 inches dry between waterings.',
  },
  {
    id: 'snake',
    name: 'Laurentii Snake Plant',
    species: 'Dracaena trifasciata',
    location: 'Home Office Desk',
    minMoisture: 20,
    maxMoisture: 45,
    description: 'Drought-tolerant succulent. Needs minimal watering and handles lower light conditions effortlessly.',
  },
  {
    id: 'basil',
    name: 'Sweet Genovese Basil',
    species: 'Ocimum basilicum',
    location: 'Kitchen Herb Garden',
    minMoisture: 50,
    maxMoisture: 75,
    description: 'Heavy drinker that loves morning sun and warm temperatures. Soil should never dry out completely.',
  },
];

interface PlantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlant: PlantPreset;
  onSelectPlant: (plant: PlantPreset) => void;
}

export const PlantProfileModal: React.FC<PlantProfileModalProps> = ({
  isOpen,
  onClose,
  selectedPlant,
  onSelectPlant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="plant-avatar-badge" style={{ width: 38, height: 38 }}>
              <Sprout size={20} color="#52b788" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Plant Profile & Species</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select or tune your plant care requirements</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tool-badge-btn"
            style={{ padding: 6, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {PLANT_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPlant.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPlant(preset);
                  onClose();
                }}
                className={`plant-preset-card ${isSelected ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{preset.name}</h4>
                    <span style={{ fontSize: 12, color: 'var(--brand-sage)', fontStyle: 'italic' }}>
                      {preset.species} • {preset.location}
                    </span>
                  </div>
                  <span className="preset-target-pill">
                    Target: {preset.minMoisture}% – {preset.maxMoisture}%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                  {preset.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
