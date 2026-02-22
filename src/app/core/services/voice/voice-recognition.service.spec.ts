import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AiSettingsService } from '../ai/ai-settings.service';
import { OpenAiProvider } from '../ai/providers/openai.provider';
import { RecordingSession, VoiceRecognitionService } from './voice-recognition.service';

// Fake SpeechRecognition simulant l'API Web Speech
class FakeSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';

  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor() {
    // Expose l'instance pour que les tests puissent déclencher des événements manuellement
    FakeSpeechRecognition._lastInstance = this;
  }

  start = vi.fn(() => {
    // Simule un résultat final immédiat si triggerResult a été configuré
    if (FakeSpeechRecognition._nextResults) {
      const results = FakeSpeechRecognition._nextResults;
      FakeSpeechRecognition._nextResults = null;
      this.onresult?.({ results, resultIndex: 0 });
      this.onend?.();
    }
  });

  stop = vi.fn(() => {
    this.onend?.();
  });

  static _nextResults: unknown = null;
  static _lastInstance: FakeSpeechRecognition | null = null;
}

function makeFakeResult(transcript: string, isFinal = true) {
  return {
    length: 1,
    0: { isFinal, 0: { transcript } },
  };
}

function makeDocument(withSpeechRecognition: boolean) {
  return {
    defaultView: withSpeechRecognition
      ? { SpeechRecognition: FakeSpeechRecognition }
      : {},
  };
}

describe('VoiceRecognitionService', () => {
  const mockSettingsService = { getProviderConfig: vi.fn() };
  const mockOpenAiProvider = {
    id: 'openai',
    name: 'OpenAI',
    supportsVision: false,
    isFree: false,
    supportsAudioTranscription: true,
    analyzeImage: vi.fn(),
    complete: vi.fn(),
    transcribeAudio: vi.fn(),
  };

  function createService(withSpeechRecognition: boolean) {
    TestBed.configureTestingModule({
      providers: [
        VoiceRecognitionService,
        { provide: DOCUMENT, useValue: makeDocument(withSpeechRecognition) },
        { provide: AiSettingsService, useValue: mockSettingsService },
        { provide: OpenAiProvider, useValue: mockOpenAiProvider },
      ],
    });
    return TestBed.inject(VoiceRecognitionService);
  }

  describe('isWebSpeechSupported', () => {
    it('est vrai si SpeechRecognition est disponible', () => {
      const service = createService(true);
      expect(service.isWebSpeechSupported).toBe(true);
    });

    it('est faux si SpeechRecognition est absent', () => {
      const service = createService(false);
      expect(service.isWebSpeechSupported).toBe(false);
    });
  });

  describe('startRecording avec Web Speech', () => {
    it('lance la reconnaissance et résout avec le transcript final', async () => {
      FakeSpeechRecognition._nextResults = makeFakeResult('pomme et riz');
      const service = createService(true);

      const session: RecordingSession = service.startRecording('fr-FR', 'webSpeechApi');
      const transcript = await session.result;

      expect(transcript).toBe('pomme et riz');
    });

    it('lève une erreur si Web Speech non supporté', () => {
      const service = createService(false);
      expect(() => service.startRecording('fr-FR', 'webSpeechApi')).toThrow();
    });

    it('assemble correctement un transcript multi-mots (plusieurs onresult cumulatifs)', async () => {
      FakeSpeechRecognition._nextResults = null;
      const service = createService(true);

      const session = service.startRecording('fr-FR', 'webSpeechApi');
      const resultPromise = session.result;
      const recognition = FakeSpeechRecognition._lastInstance!;

      // Simule plusieurs événements onresult successifs avec liste cumulative
      // (comportement normal sur certains navigateurs desktop)

      // Événement 1 : premier mot finalisé
      recognition.onresult?.({
        results: { length: 1, 0: { isFinal: true, 0: { transcript: 'Cracotte' } } },
        resultIndex: 0,
      });

      // Événement 2 : deuxième mot ajouté
      recognition.onresult?.({
        results: {
          length: 2,
          0: { isFinal: true, 0: { transcript: 'Cracotte' } },
          1: { isFinal: true, 0: { transcript: ' de' } },
        },
        resultIndex: 1,
      });

      // Événement 3 : troisième mot ajouté
      recognition.onresult?.({
        results: {
          length: 3,
          0: { isFinal: true, 0: { transcript: 'Cracotte' } },
          1: { isFinal: true, 0: { transcript: ' de' } },
          2: { isFinal: true, 0: { transcript: ' sarrasin' } },
        },
        resultIndex: 2,
      });

      recognition.onend?.();
      const transcript = await resultPromise;

      expect(transcript).toBe('Cracotte de sarrasin');
    });

    it('arrête la reconnaissance sur stop()', async () => {
      const service = createService(true);
      // Ne configure pas de résultat automatique → la session reste ouverte
      FakeSpeechRecognition._nextResults = null;

      const session = service.startRecording('fr-FR', 'webSpeechApi');
      // stop() déclenche onend → la promesse résout avec le transcript vide
      session.stop();
      const transcript = await session.result;
      expect(transcript).toBe('');
    });

    it('applique le timeout de 30s via fake timers', async () => {
      vi.useFakeTimers();
      const service = createService(true);
      FakeSpeechRecognition._nextResults = null;

      const session = service.startRecording('fr-FR', 'webSpeechApi');
      const resultPromise = session.result;

      // Avance de 30 secondes + flush microtasks → déclenche le max timer
      await vi.runAllTimersAsync();
      const transcript = await resultPromise;
      expect(transcript).toBe('');

      vi.useRealTimers();
    });

    it('reset le timer de silence après chaque résultat', async () => {
      vi.useFakeTimers();
      const service = createService(true);
      FakeSpeechRecognition._nextResults = null;

      const session = service.startRecording('fr-FR', 'webSpeechApi');
      const resultPromise = session.result;

      // Avance au-delà du silence timeout → la session se termine
      await vi.runAllTimersAsync();
      const transcript = await resultPromise;
      expect(transcript).toBe('');

      vi.useRealTimers();
    });
  });

  describe('startRecording avec Whisper', () => {
    it('résout avec le transcript retourné par transcribeAudio', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream;

      // Stocke les callbacks pour les déclencher manuellement
      let recorderOnstop: (() => void) | null = null;
      let recorderState = 'inactive';

      // Constructeur MockMediaRecorder (fonction classique, non-arrow)
      function MockMediaRecorder() { /* vide */ }
      MockMediaRecorder.prototype = {
        get onstop() { return recorderOnstop; },
        set onstop(v: (() => void) | null) { recorderOnstop = v; },
        set ondataavailable(_v: unknown) { /* noop */ },
        get state() { return recorderState; },
        start() { recorderState = 'recording'; },
        stop() { recorderState = 'inactive'; recorderOnstop?.(); },
      };

      // Mock uniquement mediaDevices sur le navigator existant (évite de casser l'env jsdom)
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'MediaRecorder', {
        value: MockMediaRecorder,
        configurable: true,
        writable: true,
      });

      mockOpenAiProvider.transcribeAudio.mockResolvedValueOnce('test transcript');

      const service = createService(true);
      const session = service.startRecording('fr-FR', 'whisper');

      // Laisse getUserMedia se résoudre avant d'appeler stop
      await Promise.resolve();
      session.stop();

      const transcript = await session.result;

      expect(mockOpenAiProvider.transcribeAudio).toHaveBeenCalled();
      expect(transcript).toBe('test transcript');
    });
  });
});
