import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicationEntryPageComponent } from './medication-entry.page';

describe('MedicationEntryPageComponent', () => {
  let fixture: ComponentFixture<MedicationEntryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationEntryPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationEntryPageComponent);
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
