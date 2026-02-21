import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SymptomEntryPageComponent } from './symptom-entry.page';

describe('SymptomEntryPageComponent', () => {
  let fixture: ComponentFixture<SymptomEntryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymptomEntryPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SymptomEntryPageComponent);
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
