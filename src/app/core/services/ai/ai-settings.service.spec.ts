import { TestBed } from '@angular/core/testing';

import { AI_SETTINGS_DEFAULT, AiSettings } from './ai-settings.model';
import { AiSettingsService } from './ai-settings.service';

describe('AiSettingsService', () => {
  let service: AiSettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiSettingsService);
  });

  it('retourne les paramètres par défaut si aucun stocké', () => {
    expect(service.getSelectedProvider()).toBe('openai');
    expect(service.getProviderConfig('openai').model).toBe('gpt-4o');
  });

  it('sauvegarde et expose les nouveaux paramètres via le signal', () => {
    const updated: AiSettings = {
      ...AI_SETTINGS_DEFAULT,
      selectedProvider: 'gemini',
      providers: {
        ...AI_SETTINGS_DEFAULT.providers,
        gemini: { apiKey: 'ma-cle-gemini', model: 'gemini-1.5-pro' },
      },
    };
    service.save(updated);
    expect(service.getSelectedProvider()).toBe('gemini');
    expect(service.getProviderConfig('gemini').apiKey).toBe('ma-cle-gemini');
  });

  it('persiste en localStorage sous forme obfusquée (base64, pas du JSON brut)', () => {
    service.save({ ...AI_SETTINGS_DEFAULT, selectedProvider: 'anthropic' });
    const raw = localStorage.getItem('gt_ai_settings')!;
    expect(() => JSON.parse(raw)).toThrow();
    expect(JSON.parse(atob(raw)).selectedProvider).toBe('anthropic');
  });

  it('retourne les valeurs par défaut si le localStorage contient des données corrompues', () => {
    localStorage.setItem('gt_ai_settings', 'données-invalides');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(AiSettingsService);
    expect(fresh.getSelectedProvider()).toBe('openai');
  });
});
