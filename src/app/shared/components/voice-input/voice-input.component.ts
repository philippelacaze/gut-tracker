import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  VoiceContext,
  VoiceParseResult,
  VoiceState,
} from '../../../core/models/voice-entry.model';
import { VoiceEntryParserService } from '../../../core/services/voice/voice-entry-parser.service';
import {
  RecordingSession,
  VoiceRecognitionService,
} from '../../../core/services/voice/voice-recognition.service';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';

const ERROR_RESET_DELAY_MS = 3_000;

@Component({
  selector: 'gt-voice-input',
  standalone: true,
  imports: [],
  templateUrl: './voice-input.component.html',
  styleUrl: './voice-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoiceInputComponent implements OnDestroy {
  // Entrées / sorties
  readonly context = input.required<VoiceContext>();
  readonly parseResultReady = output<VoiceParseResult>();
  readonly cancelled = output<void>();

  // Services
  private readonly _userPrefsService = inject(UserPreferencesService);
  private readonly _voiceRecService = inject(VoiceRecognitionService);
  private readonly _parserService = inject(VoiceEntryParserService);

  // État interne
  private readonly _voiceState = signal<VoiceState>('idle');
  private readonly _transcript = signal('');
  private readonly _errorMessage = signal('');
  private _session: RecordingSession | null = null;
  private _errorTimer: ReturnType<typeof setTimeout> | undefined;

  // Exposé au template
  readonly voiceState = this._voiceState.asReadonly();
  readonly transcript = this._transcript.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  /** Vrai si la saisie vocale est activée dans les préférences */
  readonly isVoiceEnabled = computed(() => this._userPrefsService.preferences().voiceInputEnabled);

  /** aria-label dynamique selon l'état */
  readonly fabAriaLabel = computed(() => {
    switch (this._voiceState()) {
      case 'recording':
        return $localize`:@@voiceInput.fab.stop:Arrêter l'enregistrement`;
      case 'transcribing':
        return $localize`:@@voiceInput.fab.transcribing:Transcription en cours…`;
      case 'parsing':
        return $localize`:@@voiceInput.fab.parsing:Analyse en cours…`;
      default:
        return $localize`:@@voiceInput.fab.start:Démarrer la saisie vocale`;
    }
  });

  ngOnDestroy(): void {
    clearTimeout(this._errorTimer);
    this._session?.stop();
  }

  onFabClick(): void {
    const state = this._voiceState();
    if (state === 'idle') {
      this._startRecording();
    } else if (state === 'recording') {
      this._stopRecording();
    }
  }

  onTranscriptChange(event: Event): void {
    this._transcript.set((event.target as HTMLTextAreaElement).value);
  }

  async analyse(): Promise<void> {
    this._voiceState.set('parsing');
    try {
      const result = await this._parserService.parse(this._transcript(), this.context());
      this.parseResultReady.emit(result);
      this._reset();
    } catch {
      this._setError($localize`:@@voiceInput.error.parse:Erreur lors de l'analyse. Réessayez.`);
    }
  }

  cancel(): void {
    this._session?.stop();
    this._session = null;
    this._reset();
    this.cancelled.emit();
  }

  private _startRecording(): void {
    const prefs = this._userPrefsService.preferences();
    const lang = prefs.language === 'fr' ? 'fr-FR' : 'en-US';

    try {
      this._session = this._voiceRecService.startRecording(lang, prefs.voiceSttProvider);
      this._voiceState.set('recording');

      this._session.result
        .then(transcript => {
          this._transcript.set(transcript);
          this._voiceState.set('done');
        })
        .catch(() => {
          this._setError(
            $localize`:@@voiceInput.error.recognition:Erreur de reconnaissance vocale.`,
          );
        });
    } catch {
      this._setError(
        $localize`:@@voiceInput.error.unavailable:Saisie vocale non disponible sur ce navigateur.`,
      );
    }
  }

  private _stopRecording(): void {
    this._voiceState.set('transcribing');
    this._session?.stop();
    this._session = null;
  }

  private _reset(): void {
    this._voiceState.set('idle');
    this._transcript.set('');
    this._errorMessage.set('');
  }

  private _setError(message: string): void {
    this._errorMessage.set(message);
    this._voiceState.set('error');
    this._errorTimer = setTimeout(() => this._reset(), ERROR_RESET_DELAY_MS);
  }
}
