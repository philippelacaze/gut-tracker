export type MedicationType =
  | 'enzyme'
  | 'probiotic'
  | 'antibiotic'
  | 'antispasmodic'
  | 'other';

export interface Medication {
  name: string;
  type: MedicationType;
  dose?: string;
}

export interface MedicationEntry {
  id: string;
  timestamp: string; // ISO date
  medications: Medication[];
}
