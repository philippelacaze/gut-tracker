import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyLocation } from '../../../../core/models/symptom-entry.model';
import { BodyMapComponent } from './body-map.component';

const MOCK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500">
  <ellipse class="body-zone" data-region="head" cx="100" cy="45" rx="36" ry="40"/>
  <rect class="body-zone" data-region="thorax" x="57" y="102" width="86" height="108"/>
  <rect class="body-zone" data-region="abdomen-upper" x="57" y="210" width="86" height="60"/>
</svg>`;

describe('BodyMapComponent', () => {
  let fixture: ComponentFixture<BodyMapComponent>;
  let component: BodyMapComponent;
  let httpMock: HttpTestingController;

  async function setup(selectedRegion: string | null = null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [BodyMapComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BodyMapComponent);
    component = fixture.componentInstance;

    if (selectedRegion !== null) {
      fixture.componentRef.setInput('selectedRegion', selectedRegion);
    }

    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('body-map/body-map.svg').flush(MOCK_SVG);
    fixture.detectChanges();
  }

  afterEach(() => httpMock?.verify());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('devrait afficher le SVG après chargement', async () => {
      await setup();
      const container = fixture.nativeElement.querySelector('.body-map__svg-container');
      expect(container).toBeTruthy();
      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('devrait afficher les zones cliquables du SVG', async () => {
      await setup();
      const zones = fixture.nativeElement.querySelectorAll('[data-region]');
      expect(zones.length).toBeGreaterThan(0);
    });

    it("devrait afficher le label de la région sélectionnée si un input est fourni", async () => {
      await setup('head');
      const label = fixture.nativeElement.querySelector('.body-map__selected-label');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Tête');
    });

    it("ne devrait pas afficher de label si aucune région n'est sélectionnée", async () => {
      await setup(null);
      expect(fixture.nativeElement.querySelector('.body-map__selected-label')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('onContainerClick()', () => {
    it("devrait émettre locationSelected avec la région cliquée", async () => {
      await setup();

      const emitted: BodyLocation[] = [];
      const sub = component.locationSelected.subscribe((loc: BodyLocation) =>
        emitted.push(loc),
      );

      const zone = fixture.nativeElement.querySelector('[data-region="head"]') as HTMLElement;

      // Simule un clic positionné dans le container
      const container = fixture.nativeElement.querySelector(
        '.body-map__svg-container',
      ) as HTMLElement;

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        clientX: 100,
        clientY: 45,
      });

      // Remplace getBoundingClientRect pour un environnement JSDOM
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        left: 0, top: 0, width: 200, height: 500,
        right: 200, bottom: 500, x: 0, y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      zone.dispatchEvent(clickEvent);

      expect(emitted).toHaveLength(1);
      expect(emitted[0].region).toBe('head');
      expect(emitted[0].x).toBeGreaterThanOrEqual(0);
      expect(emitted[0].y).toBeGreaterThanOrEqual(0);

      sub.unsubscribe();
    });

    it("ne devrait pas émettre si le clic n'est pas sur une zone", async () => {
      await setup();

      const emitted: BodyLocation[] = [];
      const sub = component.locationSelected.subscribe((loc: BodyLocation) =>
        emitted.push(loc),
      );

      const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
      svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(emitted).toHaveLength(0);

      sub.unsubscribe();
    });
  });
});
