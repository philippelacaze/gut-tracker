import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { FoodEntry } from './core/models/food-entry.model';
import { MedicationEntry } from './core/models/medication-entry.model';
import { SymptomEntry } from './core/models/symptom-entry.model';
import { FOOD_ENTRY_REPOSITORY } from './core/repositories/food-entry.repository.token';
import { LocalStorageRepository } from './core/repositories/local-storage.repository';
import { MEDICATION_ENTRY_REPOSITORY } from './core/repositories/medication-entry.repository.token';
import { SYMPTOM_ENTRY_REPOSITORY } from './core/repositories/symptom-entry.repository.token';
import { OpenAiProvider } from './core/services/ai/providers/openai.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    OpenAiProvider,
    {
      provide: FOOD_ENTRY_REPOSITORY,
      useFactory: () => new LocalStorageRepository<FoodEntry>('food_entries'),
    },
    {
      provide: SYMPTOM_ENTRY_REPOSITORY,
      useFactory: () => new LocalStorageRepository<SymptomEntry>('symptom_entries'),
    },
    {
      provide: MEDICATION_ENTRY_REPOSITORY,
      useFactory: () => new LocalStorageRepository<MedicationEntry>('medication_entries'),
    },
  ],
};
