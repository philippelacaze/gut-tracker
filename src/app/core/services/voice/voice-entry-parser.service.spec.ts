import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AiService } from '../ai/ai.service';
import { VoiceEntryParserService } from './voice-entry-parser.service';

describe('VoiceEntryParserService', () => {
  const mockAiService = {
    parseVoiceTranscript: vi.fn(),
  };

  function createService() {
    TestBed.configureTestingModule({
      providers: [
        VoiceEntryParserService,
        { provide: AiService, useValue: mockAiService },
      ],
    });
    return TestBed.inject(VoiceEntryParserService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parse un JSON food valide', async () => {
    const json = JSON.stringify({
      mealType: 'lunch',
      foods: [{ name: 'pomme', quantity: '1' }],
      notes: null,
    });
    mockAiService.parseVoiceTranscript.mockResolvedValue(json);

    const service = createService();
    const result = await service.parse("j'ai mangé une pomme au déjeuner", 'food');

    expect(result.context).toBe('food');
    expect(result.transcript).toBe("j'ai mangé une pomme au déjeuner");
    const data = result.data as { mealType: string; foods: Array<{ name: string }> };
    expect(data.mealType).toBe('lunch');
    expect(data.foods[0].name).toBe('pomme');
  });

  it('parse un JSON symptom valide', async () => {
    const json = JSON.stringify({
      symptoms: [{ type: 'bloating', severity: 7, locationHint: 'abdomen', note: null }],
    });
    mockAiService.parseVoiceTranscript.mockResolvedValue(json);

    const service = createService();
    const result = await service.parse("j'ai des ballonnements importants", 'symptom');

    const data = result.data as { symptoms: Array<{ type: string; severity: number }> };
    expect(data.symptoms[0].type).toBe('bloating');
    expect(data.symptoms[0].severity).toBe(7);
  });

  it('parse un JSON medication valide', async () => {
    const json = JSON.stringify({
      medications: [{ name: 'Creon', type: 'enzyme', dose: '2 gélules' }],
    });
    mockAiService.parseVoiceTranscript.mockResolvedValue(json);

    const service = createService();
    const result = await service.parse("j'ai pris du Creon", 'medication');

    const data = result.data as { medications: Array<{ name: string }> };
    expect(data.medications[0].name).toBe('Creon');
  });

  it('retourne un résultat vide (food) si le JSON est invalide', async () => {
    mockAiService.parseVoiceTranscript.mockResolvedValue('réponse invalide sans JSON');

    const service = createService();
    const result = await service.parse('texte quelconque', 'food');

    const data = result.data as { mealType: unknown; foods: unknown[] };
    expect(data.mealType).toBeNull();
    expect(data.foods).toHaveLength(0);
  });

  it('retourne un résultat vide (symptom) si le JSON est invalide', async () => {
    mockAiService.parseVoiceTranscript.mockResolvedValue('pas de JSON ici');

    const service = createService();
    const result = await service.parse('texte', 'symptom');

    const data = result.data as { symptoms: unknown[] };
    expect(data.symptoms).toHaveLength(0);
  });

  it('retourne un résultat vide (medication) si le JSON est invalide', async () => {
    mockAiService.parseVoiceTranscript.mockResolvedValue('pas de JSON ici');

    const service = createService();
    const result = await service.parse('texte', 'medication');

    const data = result.data as { medications: unknown[] };
    expect(data.medications).toHaveLength(0);
  });

  it('parse du JSON embarqué dans du texte', async () => {
    const json = `Voici le résultat : {"mealType":"breakfast","foods":[{"name":"café","quantity":null}],"notes":null} Bonne journée!`;
    mockAiService.parseVoiceTranscript.mockResolvedValue(json);

    const service = createService();
    const result = await service.parse('café ce matin', 'food');

    const data = result.data as { mealType: string };
    expect(data.mealType).toBe('breakfast');
  });
});
