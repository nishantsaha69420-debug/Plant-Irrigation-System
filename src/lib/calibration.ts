// ESP32 Soil Sensor Inverted 12-bit ADC Calibration
// In ESP32, 4095 is dry air = 0% moisture.
// Submerged / water saturated is typically ~1200 (or 0).
export const DEFAULT_DRY_ADC = 4095; // 0% moisture
export const DEFAULT_WET_ADC = 1200; // 100% moisture

export interface CalibratedReading {
  percentage: number;
  rawAdc?: number;
}

export function parseAndCalibrateMoisture(
  rawVal: number | string | null | undefined,
  dryAdc = DEFAULT_DRY_ADC,
  wetAdc = DEFAULT_WET_ADC
): CalibratedReading | null {
  if (rawVal === null || rawVal === undefined) return null;
  const num = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
  if (isNaN(num)) return null;

  // If the reading is an ADC value (> 100), invert and map:
  // 4095 -> 0%
  // wetAdc (1200) -> 100%
  if (num > 100) {
    const span = dryAdc - wetAdc;
    const calculated = span !== 0 ? ((dryAdc - num) / span) * 100 : 0;
    const clamped = Math.max(0, Math.min(100, Math.round(calculated)));
    return {
      percentage: clamped,
      rawAdc: Math.round(num),
    };
  }

  // If it's already a 0-100 percentage
  return {
    percentage: Math.max(0, Math.min(100, Math.round(num))),
    rawAdc: undefined,
  };
}
