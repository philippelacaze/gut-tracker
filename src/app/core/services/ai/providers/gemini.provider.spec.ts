import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AI_SETTINGS_DEFAULT } from '../ai-settings.model';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';
import { GeminiProvider } from './gemini.provider';

const makeResponse = (status: number, body?: unknown): Response =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

const makeGeminiOk = (text: string) =>
  makeResponse(200, {
    candidates: [{ content: { parts: [{ text }] } }],
  });

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let mockSettings: Partial<AiSettingsService>;

  beforeEach(() => {
    mockSettings = {
      settings: signal(AI_SETTINGS_DEFAULT).asReadonly(),
      getSelectedProvider: vi.fn().mockReturnValue('gemini'),
      getProviderConfig: vi
        .fn()
        .mockReturnValue({ apiKey: 'gemini-key', model: 'gemini-1.5-pro' }),
      save: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        GeminiProvider,
        { provide: AiSettingsService, useValue: mockSettings },
      ],
    });
    provider = TestBed.inject(GeminiProvider);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('métadonnées', () => {
    it('devrait avoir les propriétés correctes', () => {
      expect(provider.id).toBe('gemini');
      expect(provider.supportsVision).toBe(true);
      expect(provider.isFree).toBe(false);
    });
  });

  describe('analyzeImage()', () => {
    it('lève AiError si la clé API est vide', async () => {
      (mockSettings.getProviderConfig as ReturnType<typeof vi.fn>).mockReturnValue({
        apiKey: '',
        model: 'gemini-1.5-pro',
      });
      await expect(provider.analyzeImage('base64', 'prompt')).rejects.toThrow(AiError);
    });

    it('lève AiError avec isQuotaError=true sur HTTP 429', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(429)));
      await expect(provider.analyzeImage('base64', 'prompt')).rejects.toMatchObject({
        isQuotaError: true,
      });
    });

    it('lève AiError sur HTTP 403', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(403)));
      await expect(provider.analyzeImage('base64', 'prompt')).rejects.toThrow(AiError);
    });

    it('retourne le texte extrait sur réponse 200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeGeminiOk('vision result')));
      const result = await provider.analyzeImage('base64', 'prompt');
      expect(result).toBe('vision result');
    });
  });

  describe('complete()', () => {
    it('retourne le contenu texte sur réponse 200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeGeminiOk('{"foods":[]}')));
      const result = await provider.complete('mon prompt');
      expect(result).toBe('{"foods":[]}');
    });

    it('inclut system_instruction dans le body si systemPrompt fourni', async () => {
      let capturedBody = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, options: RequestInit) => {
          capturedBody = options.body as string;
          return Promise.resolve(makeGeminiOk('ok'));
        }),
      );
      await provider.complete('user prompt', 'system prompt');
      expect(JSON.parse(capturedBody)).toMatchObject({
        system_instruction: { parts: [{ text: 'system prompt' }] },
      });
    });

    it('inclut la clé API dans l\'URL', async () => {
      let capturedUrl = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          capturedUrl = url;
          return Promise.resolve(makeGeminiOk('ok'));
        }),
      );
      await provider.complete('prompt');
      expect(capturedUrl).toContain('key=gemini-key');
    });

    it('retente une fois sur erreur réseau et réussit au 2e appel', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network'))
        .mockResolvedValueOnce(makeGeminiOk('ok'));
      vi.stubGlobal('fetch', fetchMock);
      const result = await provider.complete('prompt');
      expect(result).toBe('ok');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('lève AiError réseau si les deux appels échouent', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')));
      await expect(provider.complete('prompt')).rejects.toThrow(AiError);
    });
  });
});
