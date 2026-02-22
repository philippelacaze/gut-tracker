import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AI_SETTINGS_DEFAULT } from '../ai-settings.model';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';
import { OllamaProvider } from './ollama.provider';

const makeResponse = (status: number, body?: unknown): Response =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

const makeOllamaOk = (content: string) =>
  makeResponse(200, { message: { content } });

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let mockSettings: Partial<AiSettingsService>;

  beforeEach(() => {
    mockSettings = {
      settings: signal(AI_SETTINGS_DEFAULT).asReadonly(),
      getSelectedProvider: vi.fn().mockReturnValue('ollama'),
      getProviderConfig: vi
        .fn()
        .mockReturnValue({ baseUrl: 'http://localhost:11434', model: 'llava' }),
      save: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        OllamaProvider,
        { provide: AiSettingsService, useValue: mockSettings },
      ],
    });
    provider = TestBed.inject(OllamaProvider);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('métadonnées', () => {
    it('devrait avoir les propriétés correctes', () => {
      expect(provider.id).toBe('ollama');
      expect(provider.isFree).toBe(true);
      expect(provider.supportsVision).toBe(true);
    });
  });

  describe('analyzeImage()', () => {
    it('inclut l\'image en base64 dans le message', async () => {
      let capturedBody = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, options: RequestInit) => {
          capturedBody = options.body as string;
          return Promise.resolve(makeOllamaOk('vision result'));
        }),
      );
      await provider.analyzeImage('abc123', 'prompt', fileType);
      const parsed = JSON.parse(capturedBody) as { messages: Array<{ images?: string[] }> };
      expect(parsed.messages[0].images).toContain('abc123');
    });

    it('retourne le contenu du message sur réponse 200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeOllamaOk('vision result')));
      const result = await provider.analyzeImage('base64', 'prompt', fileType);
      expect(result).toBe('vision result');
    });
  });

  describe('complete()', () => {
    it('retourne le contenu du message sur réponse 200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeOllamaOk('{"foods":[]}')));
      const result = await provider.complete('mon prompt');
      expect(result).toBe('{"foods":[]}');
    });

    it('inclut le system prompt comme message system', async () => {
      let capturedBody = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, options: RequestInit) => {
          capturedBody = options.body as string;
          return Promise.resolve(makeOllamaOk('ok'));
        }),
      );
      await provider.complete('user msg', 'system msg');
      const parsed = JSON.parse(capturedBody) as {
        messages: Array<{ role: string; content: string }>;
      };
      expect(parsed.messages[0]).toMatchObject({ role: 'system', content: 'system msg' });
    });

    it('utilise la bonne URL baseUrl depuis la config', async () => {
      let capturedUrl = '';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          capturedUrl = url;
          return Promise.resolve(makeOllamaOk('ok'));
        }),
      );
      await provider.complete('prompt');
      expect(capturedUrl).toBe('http://localhost:11434/api/chat');
    });

    it('lève AiError si le serveur Ollama est inaccessible', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
      await expect(provider.complete('prompt')).rejects.toThrow(AiError);
    });

    it('lève AiError sur réponse HTTP non-2xx', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(500)));
      await expect(provider.complete('prompt')).rejects.toThrow(AiError);
    });
  });
});
