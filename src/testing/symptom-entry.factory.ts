import { SymptomEntry } from '../app/core/models/symptom-entry.model';

let _id = 0;

/** Réinitialise le compteur d'id (utile dans beforeEach pour isoler les tests) */
export function resetSymptomEntryId(): void {
  _id = 0;
}

export function makeSymptomEntry(overrides: Partial<SymptomEntry> = {}): SymptomEntry {
  return {
    id: String(++_id),
    timestamp: new Date().toISOString(),
    symptoms: [],
    ...overrides,
  };
}
