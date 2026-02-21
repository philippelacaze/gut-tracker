import { InjectionToken } from '@angular/core';
import { MedicationEntry } from '../models/medication-entry.model';
import { Repository } from './repository.interface';

export const MEDICATION_ENTRY_REPOSITORY = new InjectionToken<Repository<MedicationEntry>>(
  'MedicationEntryRepository'
);
