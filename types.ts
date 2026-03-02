export interface SensorData {
  shakeIntensity: number;
  scrollIrregularity: number;
  tapFrequency: number;
  usageTimeMinutes: number;
}

export interface StressReport {
  score: number; // 0 to 10
  analysis: string;
  suggestions: string[];
  timestamp: number;
}

export enum StressLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  CRITICAL = 'Critical'
}
