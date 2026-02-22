import { Injectable, signal } from '@angular/core';

import {
  USER_PREFERENCES_DEFAULT,
  UserPreferences,
} from '../models/user-preferences.model';

const STORAGE_KEY = 'gt_user_preferences';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly _preferences = signal<UserPreferences>(this._load());
  readonly preferences = this._preferences.asReadonly();

  private _load(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(USER_PREFERENCES_DEFAULT);
      // Merge avec les defaults pour la rétrocompatibilité (nouveaux champs ajoutés après la 1ère install)
      return { ...structuredClone(USER_PREFERENCES_DEFAULT), ...JSON.parse(raw) } as UserPreferences;
    } catch {
      return structuredClone(USER_PREFERENCES_DEFAULT);
    }
  }

  save(preferences: UserPreferences): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    this._preferences.set(preferences);
  }
}
