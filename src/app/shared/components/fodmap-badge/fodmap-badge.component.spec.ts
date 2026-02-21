import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FodmapBadgeComponent } from './fodmap-badge.component';

describe('FodmapBadgeComponent', () => {
  let fixture: ComponentFixture<FodmapBadgeComponent>;
  let component: FodmapBadgeComponent;

  async function setup(level: 'low' | 'medium' | 'high' | null, score?: number | null) {
    await TestBed.configureTestingModule({
      imports: [FodmapBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FodmapBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('level', level);
    if (score !== undefined) fixture.componentRef.setInput('score', score);
    fixture.detectChanges();
  }

  it('ne rend rien quand level est null', async () => {
    await setup(null);
    expect(fixture.nativeElement.querySelector('.fodmap-badge')).toBeNull();
  });

  it('affiche "Faible" et applique la classe --low pour level=low', async () => {
    await setup('low');
    const badge = fixture.nativeElement.querySelector('.fodmap-badge') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.classList).toContain('fodmap-badge--low');
    expect(badge.textContent).toContain('Faible');
  });

  it('affiche "Modéré" et applique la classe --medium pour level=medium', async () => {
    await setup('medium');
    const badge = fixture.nativeElement.querySelector('.fodmap-badge') as HTMLElement;
    expect(badge.classList).toContain('fodmap-badge--medium');
    expect(badge.textContent).toContain('Modéré');
  });

  it('affiche "Élevé" et applique la classe --high pour level=high', async () => {
    await setup('high');
    const badge = fixture.nativeElement.querySelector('.fodmap-badge') as HTMLElement;
    expect(badge.classList).toContain('fodmap-badge--high');
    expect(badge.textContent).toContain('Élevé');
  });

  it('affiche le score au format X/10 si fourni', async () => {
    await setup('low', 3);
    const score = fixture.nativeElement.querySelector('.fodmap-badge__score') as HTMLElement;
    expect(score).toBeTruthy();
    expect(score.textContent?.trim()).toBe('3/10');
  });

  it('n\'affiche pas de score si score est null', async () => {
    await setup('high', null);
    expect(fixture.nativeElement.querySelector('.fodmap-badge__score')).toBeNull();
  });

  it('label() retourne null quand level est null', async () => {
    await setup(null);
    expect(component.label()).toBeNull();
  });
});
