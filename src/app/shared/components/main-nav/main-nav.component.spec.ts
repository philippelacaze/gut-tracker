import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainNavComponent } from './main-nav.component';

describe('MainNavComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [MainNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainNavComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  describe('création', () => {
    it('devrait créer le composant', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });
  });

  describe('sidebar (desktop)', () => {
    it('devrait afficher 5 liens dans la sidebar (food + symptoms + medication + analysis + export)', async () => {
      const { fixture } = await setup();
      const links = fixture.nativeElement.querySelectorAll('.main-nav__link');
      // 5 liens principaux + 1 lien paramètres en footer = 6
      expect(links).toHaveLength(6);
    });

    it('devrait afficher le lien Paramètres dans le footer de la sidebar', async () => {
      const { fixture } = await setup();
      const footer = fixture.nativeElement.querySelector('.main-nav__list--footer');
      expect(footer).toBeTruthy();
      const link = footer.querySelector('.main-nav__link');
      expect(link).toBeTruthy();
    });

    it('devrait rendre le branding avec le nom de l\'app', async () => {
      const { fixture } = await setup();
      const brand = fixture.nativeElement.querySelector('.main-nav__brand-name');
      expect(brand?.textContent?.trim()).toBe('GutTracker');
    });
  });

  describe('bottom navigation (mobile)', () => {
    it('devrait afficher 5 onglets dans la barre mobile', async () => {
      const { fixture } = await setup();
      const tabs = fixture.nativeElement.querySelectorAll('.main-nav__tab');
      expect(tabs).toHaveLength(5);
    });

    it('devrait avoir des attributs aria-label sur chaque onglet', async () => {
      const { fixture } = await setup();
      const tabs = fixture.nativeElement.querySelectorAll('.main-nav__tab');
      tabs.forEach((tab: Element) => {
        expect(tab.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('accessibilité', () => {
    it('devrait avoir deux éléments <nav> distincts', async () => {
      const { fixture } = await setup();
      const navs = fixture.nativeElement.querySelectorAll('nav');
      expect(navs).toHaveLength(2);
    });

    it('devrait avoir des icônes SVG avec aria-hidden="true"', async () => {
      const { fixture } = await setup();
      const icons = fixture.nativeElement.querySelectorAll('.main-nav__icon');
      icons.forEach((icon: Element) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('devrait avoir des attributs aria-label sur les liens de la sidebar', async () => {
      const { fixture } = await setup();
      const links = fixture.nativeElement.querySelectorAll('.main-nav__link');
      links.forEach((link: Element) => {
        expect(link.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('données de navigation', () => {
    it('devrait avoir 5 éléments primaires (sans settings)', async () => {
      const { component } = await setup();
      // Accès via cast pour tester les données internes
      const comp = component as unknown as { primaryNavItems: readonly unknown[] };
      expect(comp.primaryNavItems).toHaveLength(5);
    });

    it('devrait avoir 5 éléments mobiles (sans export)', async () => {
      const { component } = await setup();
      const comp = component as unknown as { mobileNavItems: readonly unknown[] };
      expect(comp.mobileNavItems).toHaveLength(5);
    });
  });
});
