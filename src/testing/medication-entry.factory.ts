import { MedicationEntry } from '../app/core/models/medication-entry.model';

let _id = 0;

/** Réinitialise le compteur d'id (utile dans beforeEach pour isoler les tests) */
export function resetMedicationEntryId(): void {
  _id = 0;
}

export function makeMedicationEntry(overrides: Partial<MedicationEntry> = {}): MedicationEntry {
  return {
    id: String(++_id),
    timestamp: new Date().toISOString(),
    medications: [],
    ...overrides,
  };
}
