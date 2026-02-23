export type SymptomType =
  | 'pain'
  | 'bloating'
  | 'gas'
  | 'belching'
  | 'stool'
  | 'headache'
  | 'other';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type BristolScale = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BodyLocation {
  /** Position X en % relatif au SVG du corps humain */
  x: number;
  /** Position Y en % relatif au SVG du corps humain */
  y: number;
  region: string; // ex: "lower-left-abdomen"
}

export interface Symptom {
  type: SymptomType;
  severity: SeverityLevel;
  location?: BodyLocation;
  note?: string;
  bristolScale?: BristolScale;
}

export interface SymptomEntry {
  id: string;
  timestamp: string; // ISO date
  symptoms: Symptom[];
}
