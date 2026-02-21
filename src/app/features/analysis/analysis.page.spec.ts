import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalysisPageComponent } from './analysis.page';

describe('AnalysisPageComponent', () => {
  let fixture: ComponentFixture<AnalysisPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisPageComponent);
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
