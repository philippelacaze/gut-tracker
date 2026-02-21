import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { FoodEntry } from '../../../../core/models/food-entry.model';
import { makeFoodEntry, resetFoodEntryId } from '../../../../../testing/food-entry.factory';
import { FoodEntryStore } from '../../services/food-entry.store';
import { FoodEntryCardComponent } from './food-entry-card.component';

describe('FoodEntryCardComponent', () => {
  let fixture: ComponentFixture<FoodEntryCardComponent>;
  let component: FoodEntryCardComponent;
  let mockRemove: ReturnType<typeof vi.fn>;

  async function setup(entry: FoodEntry): Promise<void> {
    mockRemove = vi.fn().mockResolvedValue(undefined);

    const mockStore = {
      remove: mockRemove,
      entries: signal<FoodEntry[]>([]).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [FoodEntryCardComponent],
      providers: [{ provide: FoodEntryStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(FoodEntryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entry', entry);
    fixture.detectChanges();
  }

  beforeEach(() => resetFoodEntryId());

  // ──────────────────────────────────────────────────────────────
  describe('rendu', () => {
    it('devrait créer le composant', async () => {
      await setup(makeFoodEntry());
      expect(component).toBeTruthy();
    });

    it('devrait afficher le label du type de repas', async () => {
      await setup(makeFoodEntry({ mealType: 'breakfast' }));
      const mealType = fixture.nativeElement.querySelector('.food-card__meal-type') as HTMLElement;
      expect(mealType.textContent?.trim()).toBeTruthy();
    });

    it('devrait afficher l\'heure formatée', async () => {
      const timestamp = '2024-06-15T12:30:00.000Z';
      await setup(makeFoodEntry({ timestamp }));
      const time = fixture.nativeElement.querySelector('.food-card__time') as HTMLTimeElement;
      expect(time.getAttribute('datetime')).toBe(timestamp);
    });

    it('devrait afficher la liste des aliments', async () => {
      const entry = makeFoodEntry({
        foods: [
          { id: 'f1', name: 'Poulet', fodmapScore: null },
          { id: 'f2', name: 'Riz', fodmapScore: null, quantity: '200 g' },
        ],
      });
      await setup(entry);

      const items = fixture.nativeElement.querySelectorAll('.food-card__food-item');
      expect(items.length).toBe(2);
    });

    it('devrait afficher le message "vide" quand foods est vide', async () => {
      await setup(makeFoodEntry({ foods: [] }));
      const empty = fixture.nativeElement.querySelector('.food-card__empty');
      expect(empty).toBeTruthy();
    });

    it('devrait afficher la quantité d\'un aliment si renseignée', async () => {
      const entry = makeFoodEntry({
        foods: [{ id: 'f1', name: 'Tomate', fodmapScore: null, quantity: '150 g' }],
      });
      await setup(entry);
      const qty = fixture.nativeElement.querySelector('.food-card__food-qty') as HTMLElement;
      expect(qty.textContent?.trim()).toBe('150 g');
    });

    it('devrait afficher le badge FODMAP global si présent', async () => {
      const entry = makeFoodEntry({
        globalFodmapScore: {
          level: 'high',
          score: 8,
          details: 'Élevé',
          analyzedAt: new Date().toISOString(),
        },
      });
      await setup(entry);
      const badge = fixture.nativeElement.querySelector('.food-card__fodmap-badge');
      expect(badge).toBeTruthy();
      expect(badge.classList).toContain('food-card__fodmap-badge--high');
    });

    it('ne devrait pas afficher le badge FODMAP si absent', async () => {
      await setup(makeFoodEntry({ globalFodmapScore: undefined }));
      expect(fixture.nativeElement.querySelector('.food-card__fodmap-badge')).toBeNull();
    });

    it('devrait afficher les notes si présentes', async () => {
      await setup(makeFoodEntry({ notes: 'Repas léger' }));
      const notes = fixture.nativeElement.querySelector('.food-card__notes') as HTMLElement;
      expect(notes.textContent?.trim()).toBe('Repas léger');
    });
  });

  // ──────────────────────────────────────────────────────────────
  describe('suppression', () => {
    it('devrait appeler store.remove avec l\'id de l\'entrée', async () => {
      const entry = makeFoodEntry({ id: 'e-42' });
      await setup(entry);

      const deleteBtn = fixture.nativeElement.querySelector('.food-card__delete-btn') as HTMLButtonElement;
      deleteBtn.click();

      // Attendre la résolution de la Promise async
      await vi.waitFor(() => expect(mockRemove).toHaveBeenCalledWith('e-42'));
    });

    it('devrait émettre l\'output deleted avec l\'id après suppression', async () => {
      const entry = makeFoodEntry({ id: 'e-10' });
      await setup(entry);

      const deletedIds: string[] = [];
      const sub = component.deleted.subscribe((id: string) => deletedIds.push(id));

      fixture.nativeElement.querySelector('.food-card__delete-btn').click();
      await vi.waitFor(() => expect(deletedIds).toContain('e-10'));

      sub.unsubscribe();
    });
  });
});
