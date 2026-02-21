import { Injectable, signal } from '@angular/core';

import { AI_SETTINGS_DEFAULT, AiProviderId, AiSettings } from './ai-settings.model';

const STORAGE_KEY = 'gt_ai_settings';

@Injectable({ providedIn: 'root' })
export class AiSettingsService {
  private readonly _settings = signal<AiSettings>(this._load());
  readonly settings = this._settings.asReadonly();

  private _load(): AiSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(AI_SETTINGS_DEFAULT);
      return JSON.parse(atob(raw)) as AiSettings;
    } catch {
      return structuredClone(AI_SETTINGS_DEFAULT);
    }
  }

  save(settings: AiSettings): void {
    localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(settings)));
    this._settings.set(settings);
  }

  getProviderConfig<K extends keyof AiSettings['providers']>(
    provider: K,
  ): AiSettings['providers'][K] {
    return this._settings().providers[provider];
  }

  getSelectedProvider(): AiProviderId {
    return this._settings().selectedProvider;
  }
}
