import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';

import { AnalysisReportComponent } from './analysis-report.component';

async function setup(report: string) {
  await TestBed.configureTestingModule({
    imports: [AnalysisReportComponent],
  }).compileComponents();

  const fixture: ComponentFixture<AnalysisReportComponent> =
    TestBed.createComponent(AnalysisReportComponent);
  fixture.componentRef.setInput('report', report);
  fixture.detectChanges();
  return fixture;
}

describe('AnalysisReportComponent', () => {
  describe('disclaimer', () => {
    it('devrait toujours afficher le disclaimer médical', async () => {
      const fixture = await setup('Rapport test');
      const disclaimer = fixture.nativeElement.querySelector(
        '.analysis-report__disclaimer',
      ) as HTMLElement;

      expect(disclaimer).toBeTruthy();
      expect(disclaimer.textContent).toBeTruthy();
    });

    it('devrait afficher le disclaimer avant le contenu du rapport', async () => {
      const fixture = await setup('Contenu rapport');
      const children = Array.from(
        (fixture.nativeElement.querySelector('.analysis-report') as HTMLElement).children,
      );
      const disclaimerIndex = children.findIndex(el =>
        el.classList.contains('analysis-report__disclaimer'),
      );
      const contentIndex = children.findIndex(el =>
        el.classList.contains('analysis-report__content'),
      );

      expect(disclaimerIndex).toBeLessThan(contentIndex);
    });

    it('devrait avoir le role="note" sur le disclaimer', async () => {
      const fixture = await setup('test');
      const disclaimer = fixture.nativeElement.querySelector(
        '[role="note"]',
      ) as HTMLElement;

      expect(disclaimer).toBeTruthy();
    });
  });

  describe('rapport', () => {
    it('devrait afficher le contenu du rapport', async () => {
      const fixture = await setup('1. Patterns identifiés\nAucun pattern notable');
      const text = fixture.nativeElement.querySelector('.analysis-report__text') as HTMLElement;

      expect(text.textContent).toContain('Patterns identifiés');
    });

    it('devrait préserver les sauts de ligne du rapport', async () => {
      const fixture = await setup('Ligne 1\nLigne 2');
      const pre = fixture.nativeElement.querySelector('pre') as HTMLPreElement;

      expect(pre).toBeTruthy();
    });
  });
});
