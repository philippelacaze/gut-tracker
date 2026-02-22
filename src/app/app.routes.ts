import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'food', pathMatch: 'full' },
  {
    path: 'food',
    data: { animation: 'food' },
    loadComponent: () =>
      import('./features/food-entry/food-entry.page').then(m => m.FoodEntryPageComponent),
  },
  {
    path: 'symptoms',
    data: { animation: 'symptoms' },
    loadComponent: () =>
      import('./features/symptom-entry/symptom-entry.page').then(m => m.SymptomEntryPageComponent),
  },
  {
    path: 'medication',
    data: { animation: 'medication' },
    loadComponent: () =>
      import('./features/medication-entry/medication-entry.page').then(
        m => m.MedicationEntryPageComponent,
      ),
  },
  {
    path: 'export',
    data: { animation: 'export' },
    loadComponent: () =>
      import('./features/export/export.page').then(m => m.ExportPageComponent),
  },
  {
    path: 'analysis',
    data: { animation: 'analysis' },
    loadComponent: () =>
      import('./features/analysis/analysis.page').then(m => m.AnalysisPageComponent),
  },
  {
    path: 'settings',
    data: { animation: 'settings' },
    loadComponent: () =>
      import('./features/settings/settings.page').then(m => m.SettingsPageComponent),
  },
  { path: '**', redirectTo: 'food' },
];
