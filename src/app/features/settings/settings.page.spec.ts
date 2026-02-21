import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsPageComponent } from './settings.page';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('devrait afficher le titre de la page', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1).toBeTruthy();
  });
});
