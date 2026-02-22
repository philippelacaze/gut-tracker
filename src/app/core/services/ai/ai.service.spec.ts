import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { AI_SETTINGS_DEFAULT } from './ai-settings.model';
import { AiSettingsService } from './ai-settings.service';
import { AiService } from './ai.service';
import { AiError } from './ai.error';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';

const TEST_FILE_TYPE = 'image/jpeg';

describe('AiService', () => {
  let service: AiService;
  let mockOpenAi: Partial<OpenAiProvider>;
  let mockSettings: Partial<AiSettingsService>;

  beforeEach(() => {
    mockOpenAi = {
      id: 'openai',
      name: 'OpenAI',
      supportsVision: true,
      isFree: false,
      analyzeImage: vi
        .fn()
        .mockResolvedValue('{"foods":[{"name":"Pomme","confidence":0.9,"quantity":null}],"uncertain":[]}'),
      complete: vi
        .fn()
        .mockResolvedValue(
          '{"foods":[],"globalScore":0,"globalLevel":"low","advice":"Aucun conseil"}',
        ),
    };
    mockSettings = {
      settings: signal(AI_SETTINGS_DEFAULT).asReadonly(),
      getSelectedProvider: vi.fn().mockReturnValue('openai'),
      getProviderConfig: vi.fn(),
      save: vi.fn(),
    };

    const stubProvider = {
      id: 'stub',
      name: 'Stub',
      supportsVision: false,
      isFree: false,
      analyzeImage: vi.fn(),
      complete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AiService,
        { provide: OpenAiProvider,    useValue: mockOpenAi },
        { provide: AnthropicProvider, useValue: stubProvider },
        { provide: GeminiProvider,    useValue: stubProvider },
        { provide: OllamaProvider,    useValue: stubProvider },
        { provide: AiSettingsService, useValue: mockSettings },
      ],
    });
    service = TestBed.inject(AiService);
  });

  it('recognizeFood appelle analyzeImage du provider actif et parse le JSON', async () => {
    const result = await service.recognizeFood('base64data', TEST_FILE_TYPE);
    expect(mockOpenAi.analyzeImage).toHaveBeenCalledWith(
      'base64data',
      expect.stringContaining('reconnaissance alimentaire'),
      TEST_FILE_TYPE,
    );
    expect(result.foods[0].name).toBe('Pomme');
  });

  it('analyzing est true pendant l\'analyse, false après', async () => {
    const states: boolean[] = [];
    (mockOpenAi.analyzeImage as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      states.push(service.analyzing());
      return '{"foods":[],"uncertain":[]}';
    });
    await service.recognizeFood('base64', TEST_FILE_TYPE);
    expect(states).toContain(true);
    expect(service.analyzing()).toBe(false);
  });

  it('analyzing repasse à false même si le provider lève une erreur', async () => {
    (mockOpenAi.analyzeImage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('KO'));
    await expect(service.recognizeFood('base64', TEST_FILE_TYPE)).rejects.toThrow();
    expect(service.analyzing()).toBe(false);
  });

  it('lève AiError si le provider sélectionné n\'est pas disponible', async () => {
    (mockSettings.getSelectedProvider as ReturnType<typeof vi.fn>).mockReturnValue('provider-inexistant');
    await expect(service.recognizeFood('base64', TEST_FILE_TYPE)).rejects.toThrow(AiError);
  });

  it('analyzeFodmap transmet les noms des aliments et parse la réponse', async () => {
    const result = await service.analyzeFodmap(['tomate', 'riz']);
    expect(mockOpenAi.complete).toHaveBeenCalledWith(
      expect.stringContaining('tomate'),
      expect.stringContaining('FODMAP'),
    );
    expect(result.globalLevel).toBe('low');
  });

  describe('analyzeCorrelations()', () => {
    it('devrait appeler complete() avec le JSON fourni et le prompt système', async () => {
      (mockOpenAi.complete as ReturnType<typeof vi.fn>).mockResolvedValue('Rapport narratif IA');
      const json = '{"food":[],"medication":[],"symptom":[]}';

      const result = await service.analyzeCorrelations(json);

      expect(mockOpenAi.complete).toHaveBeenCalledWith(
        expect.stringContaining(json),
        expect.stringContaining('SII/SIBO'),
      );
      expect(result).toBe('Rapport narratif IA');
    });

    it('devrait mettre analyzing à false après la réponse', async () => {
      (mockOpenAi.complete as ReturnType<typeof vi.fn>).mockResolvedValue('ok');

      await service.analyzeCorrelations('{}');

      expect(service.analyzing()).toBe(false);
    });

    it('devrait mettre analyzing à false même en cas d\'erreur', async () => {
      (mockOpenAi.complete as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('KO'));

      await expect(service.analyzeCorrelations('{}')).rejects.toThrow();
      expect(service.analyzing()).toBe(false);
    });
  });
});
