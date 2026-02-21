import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoodEntryPageComponent } from './food-entry.page';

describe('FoodEntryPageComponent', () => {
  let fixture: ComponentFixture<FoodEntryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodEntryPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodEntryPageComponent);
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
