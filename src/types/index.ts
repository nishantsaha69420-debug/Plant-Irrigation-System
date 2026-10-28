export interface TelemetryData {
  moisture?: number | string;
  avgMoisture?: number | string;
  moisturePct?: number | string;
  soil1?: number | string;
  soil2?: number | string;
  temp?: number | string;
  humidity?: number | string;
  vpd?: number | string;
  pumpOn?: boolean;
  autoMode?: boolean;
  sensorFault?: boolean;
  thermalLockout?: boolean;
  // Legacy or auxiliary telemetry
  temperature?: number | string;
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
