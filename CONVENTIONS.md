# CONVENTIONS.md – Conventions de code

## Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composant | PascalCase + suffixe | `FoodEntryCardComponent` |
| Service | PascalCase + suffixe | `FoodEntryStore` |
| Interface | PascalCase, sans `I` | `FoodEntry`, `Repository<T>` |
| Type union | PascalCase | `MealType` |
| Signal | camelCase, privé avec `_` | `private readonly _entries = signal([])` |
| Signal exposé | sans `_` | `readonly entries = this._entries.asReadonly()` |
| Fichier composant | kebab-case | `food-entry-card.component.ts` |
| Fichier service | kebab-case | `food-entry.store.ts` |
| Token injection | SCREAMING_SNAKE_CASE | `FOOD_ENTRY_REPOSITORY` |

---

## Structure d'un composant (ordre des membres)

```typescript
@Component({
  selector: 'gt-food-entry-card',   // préfixe 'gt' pour GutTracker
  standalone: true,
  imports: [...],
  templateUrl: './food-entry-card.component.html',
  styleUrl: './food-entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FoodEntryCardComponent {
  // 1. Inputs
  readonly entry = input.required<FoodEntry>();

  // 2. Outputs
  readonly deleted = output<string>();

  // 3. Injections
  private readonly store = inject(FoodEntryStore);

  // 4. Signals locaux
  private readonly _expanded = signal(false);
  readonly expanded = this._expanded.asReadonly();

  // 5. Computed
  readonly fodmapColor = computed(() => ...);

  // 6. Effects
  constructor() {
    effect(() => { ... });
  }

  // 7. Méthodes publiques (actions)
  onDelete(): void { ... }

  // 8. Méthodes privées
  private formatTimestamp(): string { ... }
}
```

---

## SCSS – Conventions

- **BEM** pour les classes CSS : `.food-card__header--expanded`
- Variables dans `_variables.scss` (design tokens : couleurs FODMAP, breakpoints)
- Mixins dans `_mixins.scss` (responsive, truncate, etc.)
- Pas de styles globaux sauf dans `styles.scss` (reset, typo)
- Couleurs FODMAP :
  - Low : `$fodmap-low: #4caf50`
  - Medium : `$fodmap-medium: #ff9800`
  - High : `$fodmap-high: #f44336`

---

## Breakpoints (mobile-first)

```scss
// _variables.scss
$bp-sm: 480px;
$bp-md: 768px;
$bp-lg: 1024px;
$bp-xl: 1280px;

// Usage dans composant
@use '../../../shared/styles/mixins' as m;

.food-card {
  padding: 12px;

  @include m.respond-to('md') {
    padding: 24px;
  }
}
```

---

## Templates HTML

- Toujours `@if`, `@for`, `@switch` (nouvelle syntaxe Angular 17+)
- Toujours `@for (item of items; track item.id)` avec `track`
- Attributs `i18n` sur tous les textes visibles
- Accessibilité : `aria-label`, `role`, `tabindex` obligatoires sur éléments interactifs
- Pas de logique dans le template (déléguer au composant ou computed)

```html
<!-- ✅ Bon -->
@if (loading()) {
  <gt-spinner />
} @else {
  @for (entry of entries(); track entry.id) {
    <gt-food-entry-card [entry]="entry" />
  }
}

<!-- ❌ Mauvais -->
<div *ngIf="entries.length > 0 && !isLoading">
```

---

## Gestion des erreurs

```typescript
// Toujours typer les erreurs
try {
  await this.store.add(entry);
} catch (error: unknown) {
  if (error instanceof AiError && error.isQuotaError) {
    this.notificationService.warn('Quota IA dépassé. Vérifiez vos paramètres.');
  } else {
    this.notificationService.error('Erreur inattendue.');
    console.error('[FoodEntry]', error);
  }
}
```

---

## Tests – Règles de génération automatique

**Règle absolue : chaque fichier `.ts` généré (composant, service, store, repository, pipe, directive) doit être accompagné de son fichier `.spec.ts` dans la même session.**

Claude Code ne termine pas une tâche sans avoir produit les tests correspondants.

---

### Ce qui doit être testé dans chaque fichier spec

| Type | Ce qu'on teste |
|---|---|
| **Store** (service avec Signals) | État initial, chaque méthode publique, computed, cas d'erreur |
| **Repository** | `findAll`, `save`, `findById`, `delete`, isolation entre clés |
| **Composant** | Rendu conditionnel (`@if`), inputs/outputs, interactions utilisateur (click, input) |
| **Service IA** | Appel HTTP correct, parsing JSON, gestion d'erreur réseau/quota |
| **Pipe / Directive** | Transformation des valeurs, cas limites |

---

### Conventions de test

- **Framework** : Vitest 4 + `@angular/core/testing` (TestBed) — runner `@angular/build:unit-test`
- **Un `describe` principal** par fichier spec, nommé comme la classe
- **`describe` imbriqués** pour regrouper par méthode ou scénario
- **Nommage des `it`** : forme affirmative *"devrait [comportement attendu] quand [condition]"*
- **AAA** : Arrange / Act / Assert, séparés par une ligne vide
- **Pas de logique conditionnelle** dans les tests
- **Pas de `any`** dans les specs non plus

```typescript
import { vi, type Mocked } from 'vitest';

describe('FoodEntryStore', () => {
  let store: FoodEntryStore;
  let mockRepo: Mocked<Repository<FoodEntry>>;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn().mockResolvedValue([]),
      save:    vi.fn().mockImplementation(e => Promise.resolve(e)),
      findById: vi.fn().mockResolvedValue(null),
      delete:  vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        FoodEntryStore,
        { provide: FOOD_ENTRY_REPOSITORY, useValue: mockRepo }
      ]
    });

    store = TestBed.inject(FoodEntryStore);
  });

  describe('état initial', () => {
    it('devrait avoir une liste vide et loading à false', () => {
      expect(store.entries()).toEqual([]);
      expect(store.loading()).toBe(false);
    });
  });

  describe('add()', () => {
    it('devrait ajouter une entrée et mettre à jour le signal', async () => {
      const entry = makeFoodEntry({ id: '1' });
      mockRepo.save.mockResolvedValue(entry);

      await store.add(entry);

      expect(store.entries()).toContainEqual(entry);
      expect(mockRepo.save).toHaveBeenCalledWith(entry);
    });

    it('devrait propager l\'erreur si le repository échoue', async () => {
      mockRepo.save.mockRejectedValue(new Error('Storage full'));

      await expect(store.add(makeFoodEntry())).rejects.toThrow('Storage full');
    });
  });

  describe('todayEntries (computed)', () => {
    it('devrait filtrer les entrées non datées d\'aujourd\'hui', async () => {
      const today = makeFoodEntry({ timestamp: new Date().toISOString() });
      const old   = makeFoodEntry({ timestamp: '2020-01-01T10:00:00.000Z' });
      mockRepo.findAll.mockResolvedValue([today, old]);

      await store.loadAll();

      expect(store.todayEntries()).toEqual([today]);
    });
  });
});
```

---

### Helpers de test (à créer dans `src/testing/`)

```typescript
// src/testing/food-entry.factory.ts
let _id = 0;
export function makeFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: String(++_id),
    timestamp: new Date().toISOString(),
    mealType: 'lunch',
    foods: [],
    ...overrides
  };
}

// src/testing/symptom-entry.factory.ts
export function makeSymptomEntry(overrides: Partial<SymptomEntry> = {}): SymptomEntry {
  return {
    id: String(Date.now()),
    timestamp: new Date().toISOString(),
    symptoms: [],
    ...overrides
  };
}
```

Claude Code doit créer ou compléter ces factories à chaque fois qu'un nouveau modèle est introduit.

---

### Test d'un composant (exemple minimal)

```typescript
describe('FodmapBadgeComponent', () => {
  async function setup(level: 'low' | 'medium' | 'high') {
    await TestBed.configureTestingModule({
      imports: [FodmapBadgeComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(FodmapBadgeComponent);
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
    return fixture;
  }

  it('devrait afficher la classe CSS "low" pour un score faible', async () => {
    const fixture = await setup('low');
    const el = fixture.nativeElement.querySelector('.fodmap-badge');

    expect(el.classList).toContain('fodmap-badge--low');
  });

  it('devrait afficher le label "Faible" pour un score low', async () => {
    const fixture = await setup('low');

    expect(fixture.nativeElement.textContent.trim()).toBe('Faible');
  });
});
```

---

### Coverage cible

| Scope | Seuil minimum |
|---|---|
| Stores / Services métier | 85% |
| Repositories | 90% |
| Composants | 60% |
| Services IA | 75% |
| Global | 70% |

```typescript
// angular.json → projects.<app>.architect.test.options.coverageThreshold
// ou vitest.config.ts si utilisé en standalone
coverage: {
  thresholds: { lines: 70, functions: 70, branches: 65 }
}
```
