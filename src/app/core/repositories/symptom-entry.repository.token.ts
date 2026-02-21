import { InjectionToken } from '@angular/core';
import { SymptomEntry } from '../models/symptom-entry.model';
import { Repository } from './repository.interface';

export const SYMPTOM_ENTRY_REPOSITORY = new InjectionToken<Repository<SymptomEntry>>(
  'SymptomEntryRepository'
);
