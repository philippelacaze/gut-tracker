import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeverityLevel } from '../../../../core/models/symptom-entry.model';
import { SeveritySliderComponent } from './severity-slider.component';

describe('SeveritySliderComponent', () => {
  async function setup(severity: SeverityLevel): Promise<ComponentFixture<SeveritySliderComponent>> {
    await TestBed.configureTestingModule({
      imports: [SeveritySliderComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SeveritySliderComponent);
    fixture.componentRef.setInput('severity', severity);
    fixture.detectChanges();
    return fixture;
  }

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      const fixture = await setup(5);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('devrait afficher le niveau courant sous forme X/10', async () => {
      const fixture = await setup(7);
      const number = fixture.nativeElement.querySelector('.severity-slider__number') as HTMLElement;
      expect(number.textContent?.trim()).toBe('7/10');
    });

    it("devrait définir la valeur initiale de l'input range", async () => {
      const fixture = await setup(3);
      const input = fixture.nativeElement.querySelector('#severity-input') as HTMLInputElement;
      expect(input.value).toBe('3');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('thème visuel', () => {
    const cases: { level: SeverityLevel; emoji: string }[] = [
      { level: 1, emoji: '😌' },
      { level: 3, emoji: '😌' },
      { level: 4, emoji: '😐' },
      { level: 6, emoji: '😣' },
      { level: 7, emoji: '😰' },
      { level: 9, emoji: '😱' },
      { level: 10, emoji: '😱' },
    ];

    cases.forEach(({ level, emoji }) => {
      it(`devrait afficher l'emoji "${emoji}" pour le niveau ${level}`, async () => {
        const fixture = await setup(level);
        const emojiEl = fixture.nativeElement.querySelector('.severity-slider__emoji') as HTMLElement;
        expect(emojiEl.textContent?.trim()).toBe(emoji);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('interaction', () => {
    it('devrait mettre à jour le signal model lors du changement du slider', async () => {
      const fixture = await setup(5);
      const input = fixture.nativeElement.querySelector('#severity-input') as HTMLInputElement;

      input.value = '8';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(fixture.componentInstance.severity()).toBe(8);
    });

    it("devrait mettre à jour l'affichage après changement", async () => {
      const fixture = await setup(2);
      const input = fixture.nativeElement.querySelector('#severity-input') as HTMLInputElement;

      input.value = '9';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const number = fixture.nativeElement.querySelector('.severity-slider__number') as HTMLElement;
      expect(number.textContent?.trim()).toBe('9/10');
    });
  });
});
