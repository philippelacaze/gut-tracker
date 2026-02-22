import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, inject, signal } from '@angular/core';

import { AppLanguage, BodyMapGender, UserPreferences } from '../../core/models/user-preferences.model';
import { AiProviderId, AiSettings } from '../../core/services/ai/ai-settings.model';
import { AiSettingsService } from '../../core/services/ai/ai-settings.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';

interface ProviderInfo {
  id: AiProviderId;
  name: string;
  isFree: boolean;
}

@Component({
  selector: 'gt-settings-page',
  standalone: true,
  imports: [],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private readonly _aiSettingsService = inject(AiSettingsService);
  private readonly _userPrefsService = inject(UserPreferencesService);
  private readonly _document = inject(DOCUMENT);
  private readonly _localeId = inject(LOCALE_ID);

  // Copie locale modifiable du formulaire IA
  private readonly _aiForm = signal<AiSettings>(
    structuredClone(this._aiSettingsService.settings()),
  );
  readonly aiForm = this._aiForm.asReadonly();

  // Copie locale modifiable des préférences utilisateur
  private readonly _prefsForm = signal<UserPreferences>(
    structuredClone(this._userPrefsService.preferences()),
  );
  readonly prefsForm = this._prefsForm.asReadonly();

  // Visibilité des clés API par provider
  private readonly _showKeys = signal({ openai: false, anthropic: false, gemini: false });
  readonly showKeys = this._showKeys.asReadonly();

  // Confirmations de sauvegarde
  private readonly _aiSaved = signal(false);
  readonly aiSaved = this._aiSaved.asReadonly();

  private readonly _prefsSaved = signal(false);
  readonly prefsSaved = this._prefsSaved.asReadonly();

  protected readonly PROVIDERS: ReadonlyArray<ProviderInfo> = [
    { id: 'openai', name: 'OpenAI', isFree: false },
    { id: 'anthropic', name: 'Anthropic (Claude)', isFree: false },
    { id: 'gemini', name: 'Google Gemini', isFree: false },
    { id: 'ollama', name: 'Ollama (local)', isFree: true },
  ];

  protected readonly OPENAI_MODELS: ReadonlyArray<string> = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ];

  protected readonly ANTHROPIC_MODELS: ReadonlyArray<string> = [
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
  ];

  protected readonly GEMINI_MODELS: ReadonlyArray<string> = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
  ];

  // --- Méthodes IA ---

  selectProvider(id: AiProviderId): void {
    this._aiForm.update(s => ({ ...s, selectedProvider: id }));
  }

  toggleKey(provider: 'openai' | 'anthropic' | 'gemini'): void {
    this._showKeys.update(s => ({ ...s, [provider]: !s[provider] }));
  }

  onOpenAiKeyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, openai: { ...s.providers.openai, apiKey: value } },
    }));
  }

  onOpenAiModelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, openai: { ...s.providers.openai, model: value } },
    }));
  }

  onAnthropicKeyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, anthropic: { ...s.providers.anthropic, apiKey: value } },
    }));
  }

  onAnthropicModelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, anthropic: { ...s.providers.anthropic, model: value } },
    }));
  }

  onGeminiKeyChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, gemini: { ...s.providers.gemini, apiKey: value } },
    }));
  }

  onGeminiModelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, gemini: { ...s.providers.gemini, model: value } },
    }));
  }

  onOllamaUrlChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, ollama: { ...s.providers.ollama, baseUrl: value } },
    }));
  }

  onOllamaModelChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._aiForm.update(s => ({
      ...s,
      providers: { ...s.providers, ollama: { ...s.providers.ollama, model: value } },
    }));
  }

  saveAiSettings(): void {
    this._aiSettingsService.save(this._aiForm());
    this._aiSaved.set(true);
    setTimeout(() => this._aiSaved.set(false), 3000);
  }

  // --- Méthodes préférences ---

  selectGender(gender: BodyMapGender): void {
    this._prefsForm.update(s => ({ ...s, bodyMapGender: gender }));
  }

  onLanguageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AppLanguage;
    this._prefsForm.update(s => ({ ...s, language: value }));
  }

  savePreferences(): void {
    const prefs = this._prefsForm();
    const previousLang = this._userPrefsService.preferences().language;
    this._userPrefsService.save(prefs);
    this._prefsSaved.set(true);

    if (prefs.language !== previousLang) {
      // Rediriger vers le build de la nouvelle locale après un court délai
      setTimeout(() => this._redirectToLocale(prefs.language), 1500);
    } else {
      setTimeout(() => this._prefsSaved.set(false), 3000);
    }
  }

  /** Redirige vers le build correspondant à la locale choisie */
  private _redirectToLocale(lang: AppLanguage): void {
    const location = this._document.location;
    const href = location.href;
    // Remplace le segment de locale existant (ex: /fr/ → /en/)
    const localePattern = /\/(fr|en)(\/|$)/;
    if (localePattern.test(href)) {
      location.href = href.replace(localePattern, `/${lang}$2`);
    } else {
      // Mode dev sans préfixe de locale — rechargement simple
      location.reload();
    }
  }
}
