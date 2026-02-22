import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { FoodEntryStore } from '../food-entry/services/food-entry.store';
import { MedicationEntryStore } from '../medication-entry/services/medication-entry.store';
import { SymptomEntryStore } from '../symptom-entry/services/symptom-entry.store';
import { CorrelationPoint } from './models/analysis.model';
import { AnalysisService } from './services/analysis.service';
import { AnalysisPageComponent } from './analysis.page';

// Mock chart.js pour éviter les erreurs canvas JSDOM
vi.mock('chart.js/auto', () => ({
  Chart: class MockChart {
    destroy(): void {}
    update(): void {}
  },
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

function buildMockAnalysisService(canAnalyze = false) {
  return {
    canAnalyze: signal(canAnalyze).asReadonly(),
    daysAvailable: signal(canAnalyze ? 7 : 3).asReadonly(),
    analyzing: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    computeCorrelations: vi.fn().mockReturnValue([] as CorrelationPoint[]),
    analyze: vi.fn().mockResolvedValue({ report: 'Rapport test', generatedAt: new Date().toISOString() }),
  };
}

async function setup(canAnalyze = false) {
  const mockAnalysisService = buildMockAnalysisService(canAnalyze);
  const emptyStore = { entries: signal([]).asReadonly(), todayEntries: signal([]).asReadonly() };

  await TestBed.configureTestingModule({
    imports: [AnalysisPageComponent],
    providers: [
      { provide: AnalysisService, useValue: mockAnalysisService },
      { provide: FoodEntryStore, useValue: emptyStore },
      { provide: MedicationEntryStore, useValue: emptyStore },
      { provide: SymptomEntryStore, useValue: emptyStore },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<AnalysisPageComponent> =
    TestBed.createComponent(AnalysisPageComponent);
  fixture.detectChanges();

  return { fixture, mockAnalysisService };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AnalysisPageComponent', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('rendu initial', () => {
    it('devrait créer le composant', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher le titre de la page', async () => {
      const { fixture } = await setup();
      const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;

      expect(h1).toBeTruthy();
      expect(h1.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  describe('données insuffisantes (canAnalyze = false)', () => {
    it('devrait afficher le message "données insuffisantes"', async () => {
      const { fixture } = await setup(false);
      const locked = fixture.nativeElement.querySelector('.analysis-page__locked') as HTMLElement;

      expect(locked).toBeTruthy();
    });

    it('devrait afficher le nombre de jours disponibles', async () => {
      const { fixture } = await setup(false);
      const daysEl = fixture.nativeElement.querySelector('.analysis-page__lock-days') as HTMLElement;

      expect(daysEl.textContent).toContain('3');
    });

    it('ne devrait pas afficher le bouton "Lancer l\'analyse"', async () => {
      const { fixture } = await setup(false);
      const btn = fixture.nativeElement.querySelector('.analysis-page__btn-launch');

      expect(btn).toBeFalsy();
    });
  });

  describe('données suffisantes (canAnalyze = true)', () => {
    it('devrait afficher le bouton "Lancer l\'analyse"', async () => {
      const { fixture } = await setup(true);
      const btn = fixture.nativeElement.querySelector('.analysis-page__btn-launch') as HTMLButtonElement;

      expect(btn).toBeTruthy();
    });

    it('ne devrait pas afficher la section "locked"', async () => {
      const { fixture } = await setup(true);
      const locked = fixture.nativeElement.querySelector('.analysis-page__locked');

      expect(locked).toBeFalsy();
    });
  });

  describe('launchAnalysis()', () => {
    it('devrait appeler analysisService.analyze()', async () => {
      const { fixture, mockAnalysisService } = await setup(true);

      await fixture.componentInstance.launchAnalysis();

      expect(mockAnalysisService.analyze).toHaveBeenCalled();
    });

    it('devrait renseigner result après analyse réussie', async () => {
      const { fixture } = await setup(true);

      await fixture.componentInstance.launchAnalysis();

      expect(fixture.componentInstance.result()).not.toBeNull();
      expect(fixture.componentInstance.result()?.report).toBe('Rapport test');
    });

    it('devrait afficher gt-analysis-report après analyse réussie', async () => {
      const { fixture } = await setup(true);

      await fixture.componentInstance.launchAnalysis();
      fixture.detectChanges();

      const report = fixture.nativeElement.querySelector('gt-analysis-report');
      expect(report).toBeTruthy();
    });

    it('devrait afficher gt-correlation-chart après analyse réussie', async () => {
      const { fixture } = await setup(true);

      await fixture.componentInstance.launchAnalysis();
      fixture.detectChanges();

      const chart = fixture.nativeElement.querySelector('gt-correlation-chart');
      expect(chart).toBeTruthy();
    });

    it('devrait appeler computeCorrelations() pour alimenter le graphique', async () => {
      const { fixture, mockAnalysisService } = await setup(true);

      await fixture.componentInstance.launchAnalysis();
      fixture.detectChanges();

      expect(mockAnalysisService.computeCorrelations).toHaveBeenCalled();
    });
  });
});
