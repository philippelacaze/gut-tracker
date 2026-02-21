import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AI_SETTINGS_DEFAULT } from '../ai-settings.model';
import { AiSettingsService } from '../ai-settings.service';
import { AiError } from '../ai.error';
import { OpenAiProvider } from './openai.provider';

const makeResponse = (status: number, body?: unknown): Response =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

describe('OpenAiProvider', () => {
  let provider: OpenAiProvider;
  let mockSettings: Partial<AiSettingsService>;

  beforeEach(() => {
    mockSettings = {
      settings: signal(AI_SETTINGS_DEFAULT).asReadonly(),
      getSelectedProvider: vi.fn().mockReturnValue('openai'),
      getProviderConfig: vi.fn().mockReturnValue({ apiKey: 'test-key', model: 'gpt-4o' }),
      save: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        OpenAiProvider,
        { provide: AiSettingsService, useValue: mockSettings },
      ],
    });
    provider = TestBed.inject(OpenAiProvider);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lève AiError si la clé API est vide', async () => {
    (mockSettings.getProviderConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      apiKey: '',
      model: 'gpt-4o',
    });
    await expect(provider.analyzeImage('base64', 'prompt')).rejects.toThrow(AiError);
  });

  it('lève AiError avec isQuotaError=true sur HTTP 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(429)));
    await expect(provider.analyzeImage('base64', 'prompt')).rejects.toMatchObject({
      isQuotaError: true,
    });
  });

  it('lève AiError sur HTTP 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401)));
    await expect(provider.analyzeImage('base64', 'prompt')).rejects.toThrow(AiError);
  });

  it('retourne le contenu texte sur réponse 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeResponse(200, { choices: [{ message: { content: '{"foods":[]}' } }] }),
      ),
    );
    const result = await provider.complete('mon prompt');
    expect(result).toBe('{"foods":[]}');
  });

  it('retente une fois sur erreur réseau et réussit au 2e appel', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValueOnce(
        makeResponse(200, { choices: [{ message: { content: 'ok' } }] }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const result = await provider.complete('prompt');
    expect(result).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('lève AiError réseau si les deux appels échouent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network')),
    );
    await expect(provider.complete('prompt')).rejects.toThrow(AiError);
  });
});
