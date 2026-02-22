import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { VoiceSttProvider } from '../../../core/models/voice-entry.model';
import { AiError } from '../ai/ai.error';
import { OpenAiProvider } from '../ai/providers/openai.provider';

/** Interfaces internes pour Web Speech API (non incluses dans tous les environnements TypeScript) */
interface ISpeechRecognitionAlternative {
  readonly transcript: string;
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent {
  readonly results: ISpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

type WindowWithSpeech = Window & {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
};

/** Durée de silence avant arrêt automatique (ms) */
const SILENCE_TIMEOUT_MS = 5_000;
/** Durée maximale d'enregistrement (ms) */
const MAX_RECORDING_MS = 30_000;

export interface RecordingSession {
  /** Résout avec le transcript final une fois l'enregistrement terminé */
  result: Promise<string>;
  /** Arrête manuellement l'enregistrement */
  stop(): void;
}

@Injectable({ providedIn: 'root' })
export class VoiceRecognitionService {
  private readonly _document = inject(DOCUMENT);
  // OpenAiProvider n'est pas fourni en root — injection optionnelle (Whisper non disponible sans lui)
  private readonly _openAi = inject(OpenAiProvider, { optional: true });

  /** Vrai si Web Speech API est disponible dans le navigateur courant */
  readonly isWebSpeechSupported: boolean;

  constructor() {
    const win = this._document.defaultView as WindowWithSpeech | null;
    this.isWebSpeechSupported = !!(win?.SpeechRecognition ?? win?.webkitSpeechRecognition);
  }

  startRecording(lang: string, provider: VoiceSttProvider): RecordingSession {
    if (provider === 'whisper') {
      return this._startWhisper(lang);
    }
    return this._startWebSpeech(lang);
  }

  private _startWebSpeech(lang: string): RecordingSession {
    const win = this._document.defaultView as WindowWithSpeech | null;
    const SpeechRecognitionClass = win?.SpeechRecognition ?? win?.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      throw new AiError('Web Speech API non supportée par ce navigateur', 'voice');
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    let silenceTimer: ReturnType<typeof setTimeout> | undefined;
    let finalTranscript = '';
    // Évite de retraiter des résultats déjà finalisés (bug Android : resultIndex remis à 0)
    let lastFinalIndex = 0;

    const result = new Promise<string>((resolve, reject) => {
      const maxTimer = setTimeout(() => recognition.stop(), MAX_RECORDING_MS);

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        clearTimeout(silenceTimer);
        for (let i = lastFinalIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            lastFinalIndex = i + 1;
          }
        }
        // Réinitialise le timer de silence à chaque résultat
        silenceTimer = setTimeout(() => recognition.stop(), SILENCE_TIMEOUT_MS);
      };

      recognition.onend = () => {
        clearTimeout(maxTimer);
        clearTimeout(silenceTimer);
        resolve(finalTranscript.trim());
      };

      recognition.onerror = (event: { error: string }) => {
        clearTimeout(maxTimer);
        clearTimeout(silenceTimer);
        reject(new AiError(`Erreur reconnaissance vocale : ${event.error}`, 'voice'));
      };

      recognition.start();
    });

    return { result, stop: () => recognition.stop() };
  }

  private _startWhisper(lang: string): RecordingSession {
    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;

    const result = new Promise<string>(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          try {
            if (!this._openAi?.transcribeAudio) {
              throw new AiError('Transcription Whisper non disponible — configurez OpenAI', 'voice');
            }
            const transcript = await this._openAi.transcribeAudio(blob, lang);
            resolve(transcript);
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorder.start();
      } catch (err) {
        reject(
          err instanceof Error
            ? new AiError(`Microphone inaccessible : ${err.message}`, 'voice')
            : new AiError('Microphone inaccessible', 'voice'),
        );
      }
    });

    return {
      result,
      stop: () => {
        if (mediaRecorder?.state === 'recording') {
          mediaRecorder.stop();
        }
      },
    };
  }
}
