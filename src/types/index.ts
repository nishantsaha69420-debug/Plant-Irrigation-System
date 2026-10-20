export interface TelemetryData {
  moisture: number | string;
  temperature?: number | string;
  humidity?: number | string;
  waterLevel?: number | string;
  pump?: 'on' | 'off' | boolean;
  battery?: number | string;
  timestamp?: number | string;
  [key: string]: any;
}

export interface CommandData {
  mode: 'auto' | 'manual';
  pump: 'on' | 'off';
  timestamp?: number;
}

export interface HistoryPoint {
  time: string;
  moisture: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'pump-on' | 'pump-off';
}
