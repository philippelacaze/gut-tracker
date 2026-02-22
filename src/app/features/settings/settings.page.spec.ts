import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AI_SETTINGS_DEFAULT, AiSettings } from '../../core/services/ai/ai-settings.model';
import { AiSettingsService } from '../../core/services/ai/ai-settings.service';
import { USER_PREFERENCES_DEFAULT, UserPreferences } from '../../core/models/user-preferences.model';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { SettingsPageComponent } from './settings.page';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let component: SettingsPageComponent;
  let mockAiSettings: Partial<AiSettingsService>;
  let mockUserPrefs: Partial<UserPreferencesService>;

  const makeAiSettings = (overrides: Partial<AiSettings> = {}): AiSettings => ({
    ...AI_SETTINGS_DEFAULT,
    ...overrides,
  });

  const makePrefs = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
    ...USER_PREFERENCES_DEFAULT,
    ...overrides,
  });

  beforeEach(async () => {
    mockAiSettings = {
      settings: signal(makeAiSettings()).asReadonly(),
      save: vi.fn(),
      getSelectedProvider: vi.fn().mockReturnValue('openai'),
      getProviderConfig: vi.fn(),
    };
    mockUserPrefs = {
      preferences: signal(makePrefs()).asReadonly(),
      save: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [
        { provide: AiSettingsService, useValue: mockAiSettings },
        { provide: UserPreferencesService, useValue: mockUserPrefs },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait afficher le titre de la page', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1).toBeTruthy();
  });

  it('devrait afficher les 4 providers dans le groupe radio', () => {
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"][name="ai-provider"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios.length).toBe(4);
  });

  it('devrait cocher le provider actuellement sélectionné', () => {
    const openaiRadio = fixture.nativeElement.querySelector(
      'input[value="openai"]',
    ) as HTMLInputElement;
    expect(openaiRadio.checked).toBe(true);
  });

  describe('selectProvider()', () => {
    it('devrait mettre à jour selectedProvider dans le formulaire', () => {
      component.selectProvider('anthropic');
      expect(component.aiForm().selectedProvider).toBe('anthropic');
    });
  });

  describe('toggleKey()', () => {
    it('devrait basculer la visibilité de la clé OpenAI', () => {
      expect(component.showKeys().openai).toBe(false);
      component.toggleKey('openai');
      expect(component.showKeys().openai).toBe(true);
      component.toggleKey('openai');
      expect(component.showKeys().openai).toBe(false);
    });

    it('devrait basculer la visibilité de la clé Anthropic indépendamment', () => {
      component.toggleKey('anthropic');
      expect(component.showKeys().anthropic).toBe(true);
      expect(component.showKeys().openai).toBe(false);
    });
  });

  describe('mise à jour des clés API', () => {
    it('onOpenAiKeyChange() devrait mettre à jour la clé OpenAI', () => {
      const event = { target: { value: 'sk-new-key' } } as unknown as Event;
      component.onOpenAiKeyChange(event);
      expect(component.aiForm().providers.openai.apiKey).toBe('sk-new-key');
    });

    it('onAnthropicKeyChange() devrait mettre à jour la clé Anthropic', () => {
      const event = { target: { value: 'sk-ant-new' } } as unknown as Event;
      component.onAnthropicKeyChange(event);
      expect(component.aiForm().providers.anthropic.apiKey).toBe('sk-ant-new');
    });

    it('onGeminiKeyChange() devrait mettre à jour la clé Gemini', () => {
      const event = { target: { value: 'AIza-new' } } as unknown as Event;
      component.onGeminiKeyChange(event);
      expect(component.aiForm().providers.gemini.apiKey).toBe('AIza-new');
    });

    it('onOllamaUrlChange() devrait mettre à jour l\'URL Ollama', () => {
      const event = { target: { value: 'http://192.168.1.1:11434' } } as unknown as Event;
      component.onOllamaUrlChange(event);
      expect(component.aiForm().providers.ollama.baseUrl).toBe('http://192.168.1.1:11434');
    });
  });

  describe('mise à jour des modèles', () => {
    it('onOpenAiModelChange() devrait mettre à jour le modèle OpenAI', () => {
      const event = { target: { value: 'gpt-4o-mini' } } as unknown as Event;
      component.onOpenAiModelChange(event);
      expect(component.aiForm().providers.openai.model).toBe('gpt-4o-mini');
    });

    it('onAnthropicModelChange() devrait mettre à jour le modèle Anthropic', () => {
      const event = { target: { value: 'claude-sonnet-4-6' } } as unknown as Event;
      component.onAnthropicModelChange(event);
      expect(component.aiForm().providers.anthropic.model).toBe('claude-sonnet-4-6');
    });

    it('onGeminiModelChange() devrait mettre à jour le modèle Gemini', () => {
      const event = { target: { value: 'gemini-1.5-flash' } } as unknown as Event;
      component.onGeminiModelChange(event);
      expect(component.aiForm().providers.gemini.model).toBe('gemini-1.5-flash');
    });

    it('onOllamaModelChange() devrait mettre à jour le modèle Ollama', () => {
      const event = { target: { value: 'llama3.2' } } as unknown as Event;
      component.onOllamaModelChange(event);
      expect(component.aiForm().providers.ollama.model).toBe('llama3.2');
    });
  });

  describe('saveAiSettings()', () => {
    it('devrait appeler aiSettingsService.save() avec le formulaire courant', () => {
      component.selectProvider('gemini');

      component.saveAiSettings();

      expect(mockAiSettings.save).toHaveBeenCalledWith(
        expect.objectContaining({ selectedProvider: 'gemini' }),
      );
    });

    it('devrait afficher le message de confirmation puis le masquer', async () => {
      vi.useFakeTimers();

      component.saveAiSettings();
      expect(component.aiSaved()).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(component.aiSaved()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('préférences utilisateur', () => {
    it('selectGender() devrait mettre à jour le genre anatomique', () => {
      component.selectGender('female');
      expect(component.prefsForm().bodyMapGender).toBe('female');
    });

    it('onLanguageChange() devrait mettre à jour la langue', () => {
      const event = { target: { value: 'en' } } as unknown as Event;
      component.onLanguageChange(event);
      expect(component.prefsForm().language).toBe('en');
    });
  });

  describe('savePreferences()', () => {
    it('devrait appeler userPrefsService.save() avec les préférences courantes', () => {
      component.selectGender('female');

      component.savePreferences();

      expect(mockUserPrefs.save).toHaveBeenCalledWith(
        expect.objectContaining({ bodyMapGender: 'female' }),
      );
    });

    it('devrait afficher le message de confirmation puis le masquer', async () => {
      vi.useFakeTimers();

      component.savePreferences();
      expect(component.prefsSaved()).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(component.prefsSaved()).toBe(false);

      vi.useRealTimers();
    });
  });
});
