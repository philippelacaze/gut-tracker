import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { FoodEntry } from '../../../core/models/food-entry.model';
import { MedicationEntry } from '../../../core/models/medication-entry.model';
import { SymptomEntry } from '../../../core/models/symptom-entry.model';
import { AiError } from '../../../core/services/ai/ai.error';
import { AiService } from '../../../core/services/ai/ai.service';
import { FoodEntryStore } from '../../food-entry/services/food-entry.store';
import { MedicationEntryStore } from '../../medication-entry/services/medication-entry.store';
import { SymptomEntryStore } from '../../symptom-entry/services/symptom-entry.store';
import { AnalysisService } from './analysis.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isoAt(date: Date, offsetHours = 0): string {
  return new Date(date.getTime() + offsetHours * 3_600_000).toISOString();
}

function makeDay(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function makeFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: String(Math.random()),
    timestamp: new Date().toISOString(),
    mealType: 'lunch',
    foods: [{ id: 'f1', name: 'Pomme', fodmapScore: null }],
    ...overrides,
  };
}

function makeSymptomEntry(overrides: Partial<SymptomEntry> = {}): SymptomEntry {
  return {
    id: String(Math.random()),
    timestamp: new Date().toISOString(),
    symptoms: [{ type: 'bloating', severity: 5 }],
    ...overrides,
  };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function setup(opts: {
  foodEntries?: FoodEntry[];
  medicationEntries?: MedicationEntry[];
  symptomEntries?: SymptomEntry[];
  aiReport?: string;
} = {}) {
  const {
    foodEntries = [],
    medicationEntries = [],
    symptomEntries = [],
    aiReport = 'Rapport IA',
  } = opts;

  const mockFoodStore = { entries: signal<FoodEntry[]>(foodEntries).asReadonly() };
  const mockMedStore = { entries: signal<MedicationEntry[]>(medicationEntries).asReadonly() };
  const mockSymptomStore = { entries: signal<SymptomEntry[]>(symptomEntries).asReadonly() };
  const mockAiService = {
    analyzeCorrelations: vi.fn().mockResolvedValue(aiReport),
  };

  TestBed.configureTestingModule({
    providers: [
      AnalysisService,
      { provide: FoodEntryStore, useValue: mockFoodStore },
      { provide: MedicationEntryStore, useValue: mockMedStore },
      { provide: SymptomEntryStore, useValue: mockSymptomStore },
      { provide: AiService, useValue: mockAiService },
    ],
  });

  return { service: TestBed.inject(AnalysisService), mockAiService };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AnalysisService', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('canAnalyze (computed)', () => {
    it('devrait retourner false avec 0 données', () => {
      const { service } = setup();
      expect(service.canAnalyze()).toBe(false);
    });

    it('devrait retourner false avec 6 jours de données', () => {
      const foods = Array.from({ length: 6 }, (_, i) =>
        makeFoodEntry({ timestamp: makeDay(i) }),
      );
      const { service } = setup({ foodEntries: foods });
      expect(service.canAnalyze()).toBe(false);
    });

    it('devrait retourner true avec exactement 7 jours distincts', () => {
      const foods = Array.from({ length: 7 }, (_, i) =>
        makeFoodEntry({ timestamp: makeDay(i) }),
      );
      const { service } = setup({ foodEntries: foods });
      expect(service.canAnalyze()).toBe(true);
    });

    it('devrait agréger les jours de toutes les sources de données', () => {
      // 4 jours food + 3 jours symptômes = 7 jours (distincts)
      const foods = Array.from({ length: 4 }, (_, i) => makeFoodEntry({ timestamp: makeDay(i) }));
      const symptoms = Array.from({ length: 3 }, (_, i) =>
        makeSymptomEntry({ timestamp: makeDay(i + 4) }),
      );
      const { service } = setup({ foodEntries: foods, symptomEntries: symptoms });
      expect(service.canAnalyze()).toBe(true);
    });
  });

  describe('daysAvailable (computed)', () => {
    it('devrait retourner le nombre de jours distincts', () => {
      const foods = [
        makeFoodEntry({ timestamp: makeDay(0) }),
        makeFoodEntry({ timestamp: makeDay(0) }), // même jour → compte 1
        makeFoodEntry({ timestamp: makeDay(1) }),
      ];
      const { service } = setup({ foodEntries: foods });
      expect(service.daysAvailable()).toBe(2);
    });
  });

  describe('computeCorrelations()', () => {
    it('devrait détecter un aliment suivi d\'un symptôme dans les 6h', () => {
      const base = new Date();
      const food = makeFoodEntry({
        timestamp: isoAt(base, 0),
        foods: [{ id: 'f1', name: 'Poireau', fodmapScore: null }],
      });
      const symptom = makeSymptomEntry({
        timestamp: isoAt(base, 3),
        symptoms: [{ type: 'bloating', severity: 7 }],
      });

      const { service } = setup({ foodEntries: [food], symptomEntries: [symptom] });
      const correlations = service.computeCorrelations();

      expect(correlations).toHaveLength(1);
      expect(correlations[0].foodName).toBe('Poireau');
      expect(correlations[0].symptomType).toBe('bloating');
      expect(correlations[0].severity).toBe(7);
      expect(correlations[0].delayHours).toBe(3);
    });

    it('devrait ignorer un symptôme apparu plus de 6h après', () => {
      const base = new Date();
      const food = makeFoodEntry({ timestamp: isoAt(base, 0) });
      const symptom = makeSymptomEntry({ timestamp: isoAt(base, 7) });

      const { service } = setup({ foodEntries: [food], symptomEntries: [symptom] });

      expect(service.computeCorrelations()).toHaveLength(0);
    });

    it('devrait ignorer un symptôme apparu avant le repas', () => {
      const base = new Date();
      const food = makeFoodEntry({ timestamp: isoAt(base, 0) });
      const symptom = makeSymptomEntry({ timestamp: isoAt(base, -1) });

      const { service } = setup({ foodEntries: [food], symptomEntries: [symptom] });

      expect(service.computeCorrelations()).toHaveLength(0);
    });

    it('devrait créer un point par aliment dans l\'entrée', () => {
      const base = new Date();
      const food = makeFoodEntry({
        timestamp: isoAt(base, 0),
        foods: [
          { id: 'f1', name: 'Poireau', fodmapScore: null },
          { id: 'f2', name: 'Oignon', fodmapScore: null },
        ],
      });
      const symptom = makeSymptomEntry({ timestamp: isoAt(base, 2) });

      const { service } = setup({ foodEntries: [food], symptomEntries: [symptom] });

      expect(service.computeCorrelations()).toHaveLength(2);
    });

    it('devrait retourner un tableau vide si aucune donnée', () => {
      const { service } = setup();
      expect(service.computeCorrelations()).toEqual([]);
    });
  });

  describe('analyze()', () => {
    it('devrait appeler aiService.analyzeCorrelations avec le JSON des données', async () => {
      const food = makeFoodEntry({ timestamp: new Date().toISOString() });
      const { service, mockAiService } = setup({ foodEntries: [food] });

      await service.analyze();

      expect(mockAiService.analyzeCorrelations).toHaveBeenCalledWith(
        expect.stringContaining('"food"'),
      );
    });

    it('devrait retourner un AnalysisResult avec le rapport et la date de génération', async () => {
      const { service } = setup({ aiReport: 'Rapport détaillé' });

      const result = await service.analyze();

      expect(result.report).toBe('Rapport détaillé');
      expect(result.generatedAt).toBeTruthy();
    });

    it('devrait mettre analyzing à true pendant l\'analyse puis false après', async () => {
      let analyzingDuring = false;
      const { service, mockAiService } = setup();
      mockAiService.analyzeCorrelations.mockImplementation(async () => {
        analyzingDuring = service.analyzing();
        return 'ok';
      });

      await service.analyze();

      expect(analyzingDuring).toBe(true);
      expect(service.analyzing()).toBe(false);
    });

    it('devrait renseigner le signal error et relancer si l\'IA échoue', async () => {
      const { service, mockAiService } = setup();
      mockAiService.analyzeCorrelations.mockRejectedValue(new Error('Timeout'));

      await expect(service.analyze()).rejects.toThrow();
      expect(service.error()).toBeTruthy();
    });

    it('devrait mentionner le provider dans le message d\'erreur pour AiError', async () => {
      const { service, mockAiService } = setup();
      mockAiService.analyzeCorrelations.mockRejectedValue(
        new AiError('Quota dépassé', 'openai', true),
      );

      await expect(service.analyze()).rejects.toThrow();
      expect(service.error()).toContain('openai');
    });
  });
});
