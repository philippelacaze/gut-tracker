import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CorrelationPoint } from '../../models/analysis.model';
import { CorrelationChartComponent } from './correlation-chart.component';

// Mock chart.js/auto pour éviter les erreurs Canvas en JSDOM
vi.mock('chart.js/auto', () => ({
  Chart: class MockChart {
    destroy(): void {}
    update(): void {}
    data = { datasets: [] };
  },
}));

function makeCorrelation(overrides: Partial<CorrelationPoint> = {}): CorrelationPoint {
  return {
    foodName: 'Pomme',
    foodTime: new Date().toISOString(),
    symptomType: 'bloating',
    symptomTime: new Date().toISOString(),
    severity: 5,
    delayHours: 2,
    ...overrides,
  };
}

async function setup(correlations: CorrelationPoint[] = []) {
  await TestBed.configureTestingModule({
    imports: [CorrelationChartComponent],
  }).compileComponents();

  const fixture: ComponentFixture<CorrelationChartComponent> =
    TestBed.createComponent(CorrelationChartComponent);
  fixture.componentRef.setInput('correlations', correlations);
  fixture.detectChanges();
  return fixture;
}

describe('CorrelationChartComponent', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('état vide', () => {
    it('devrait créer le composant', async () => {
      const fixture = await setup([]);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher le message "aucune corrélation" quand la liste est vide', async () => {
      const fixture = await setup([]);
      const el = fixture.nativeElement.querySelector('.correlation-chart__empty') as HTMLElement;

      expect(el).toBeTruthy();
      expect(el.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('ne devrait pas afficher le canvas quand la liste est vide', async () => {
      const fixture = await setup([]);
      const canvas = fixture.nativeElement.querySelector('canvas');

      expect(canvas).toBeFalsy();
    });
  });

  describe('avec données', () => {
    it('devrait afficher le canvas quand des corrélations existent', async () => {
      const fixture = await setup([makeCorrelation()]);
      const canvas = fixture.nativeElement.querySelector('canvas');

      expect(canvas).toBeTruthy();
    });

    it('ne devrait pas afficher le message vide quand des corrélations existent', async () => {
      const fixture = await setup([makeCorrelation()]);
      const empty = fixture.nativeElement.querySelector('.correlation-chart__empty');

      expect(empty).toBeFalsy();
    });

    it('devrait mettre hasData à true avec des corrélations', async () => {
      const fixture = await setup([makeCorrelation()]);

      expect(fixture.componentInstance.hasData()).toBe(true);
    });
  });

  describe('hasData (computed)', () => {
    it('devrait retourner false pour un tableau vide', async () => {
      const fixture = await setup([]);
      expect(fixture.componentInstance.hasData()).toBe(false);
    });

    it('devrait retourner true pour un tableau non vide', async () => {
      const fixture = await setup([makeCorrelation()]);
      expect(fixture.componentInstance.hasData()).toBe(true);
    });
  });
});
