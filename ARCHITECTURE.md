# ARCHITECTURE.md – Patterns et décisions techniques

## Repository Pattern (persistance découplée)

### Interface générique

```typescript
// core/repositories/repository.interface.ts
export interface Repository<T extends { id: string }> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### Implémentation LocalStorage

```typescript
// core/repositories/local-storage.repository.ts
export class LocalStorageRepository<T extends { id: string }> implements Repository<T> {
  constructor(private readonly storageKey: string) {}

  async findAll(): Promise<T[]> {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  async save(entity: T): Promise<T> {
    const all = await this.findAll();
    const idx = all.findIndex(e => e.id === entity.id);
    idx >= 0 ? (all[idx] = entity) : all.push(entity);
    localStorage.setItem(this.storageKey, JSON.stringify(all));
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const all = await this.findAll();
    return all.find(e => e.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    const all = await this.findAll();
    localStorage.setItem(this.storageKey, JSON.stringify(all.filter(e => e.id !== id)));
  }
}
```

### Injection via token (DI Angular)

```typescript
// core/repositories/food-entry.repository.token.ts
export const FOOD_ENTRY_REPOSITORY = new InjectionToken<Repository<FoodEntry>>('FoodEntryRepository');

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FOOD_ENTRY_REPOSITORY,
      useFactory: () => new LocalStorageRepository<FoodEntry>('food_entries')
    }
    // Demain : remplacer useFactory par l'implémentation API REST
  ]
};
```

---

## State Management avec Signals

```typescript
// features/food-entry/services/food-entry.store.ts
@Injectable({ providedIn: 'root' })
export class FoodEntryStore {
  private readonly _entries = signal<FoodEntry[]>([]);
  private readonly _loading = signal(false);

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly todayEntries = computed(() =>
    this._entries().filter(e => isToday(new Date(e.timestamp)))
  );

  constructor(@Inject(FOOD_ENTRY_REPOSITORY) private repo: Repository<FoodEntry>) {
    this.loadAll();
  }

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._entries.set(await this.repo.findAll());
    this._loading.set(false);
  }

  async add(entry: FoodEntry): Promise<void> {
    const saved = await this.repo.save(entry);
    this._entries.update(entries => [...entries, saved]);
  }
}
```

---

## Modèles métier principaux

```typescript
// core/models/food-entry.model.ts
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

export interface Food {
  id: string;
  name: string;
  fodmapScore: FodmapScore | null;  // null si pas encore analysé
  quantity?: string;
}

export interface FodmapScore {
  level: 'low' | 'medium' | 'high';
  score: number;           // 0–10
  details: string;
  analyzedAt: string;      // ISO date
}

export interface FoodEntry {
  id: string;
  timestamp: string;        // ISO date
  mealType: MealType;
  foods: Food[];
  photoUrl?: string;        // base64 ou object URL
  globalFodmapScore?: FodmapScore;
  notes?: string;
}

// core/models/symptom-entry.model.ts
export interface BodyLocation {
  x: number;               // % relatif au SVG
  y: number;
  region: string;          // ex: "lower-left-abdomen"
}

export interface SymptomEntry {
  id: string;
  timestamp: string;
  symptoms: Symptom[];
}

export interface Symptom {
  type: 'pain' | 'bloating' | 'gas' | 'belching' | 'constipation' | 'diarrhea' | 'headache' | 'other';
  severity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  location?: BodyLocation;
  note?: string;
}

// core/models/medication-entry.model.ts
export interface MedicationEntry {
  id: string;
  timestamp: string;
  medications: Medication[];
}

export interface Medication {
  name: string;
  type: 'enzyme' | 'probiotic' | 'antibiotic' | 'antispasmodic' | 'other';
  dose?: string;
}
```

---

## Routing

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'food', pathMatch: 'full' },
  { path: 'food',       loadComponent: () => import('./features/food-entry/food-entry.page') },
  { path: 'medication', loadComponent: () => import('./features/medication-entry/medication-entry.page') },
  { path: 'symptoms',   loadComponent: () => import('./features/symptom-entry/symptom-entry.page') },
  { path: 'export',     loadComponent: () => import('./features/export/export.page') },
  { path: 'analysis',   loadComponent: () => import('./features/analysis/analysis.page') },
  { path: 'settings',   loadComponent: () => import('./features/settings/settings.page') },
];
```

---

## Migration vers API REST (futur)

Pour migrer la persistance, il suffira de :
1. Créer `ApiRepository<T>` implémentant `Repository<T>` (appels HTTP)
2. Dans `app.config.ts`, remplacer `useFactory` par la nouvelle implémentation
3. Ajouter un `HttpClient` et les intercepteurs (auth token, etc.)

**Aucun composant ni service métier ne doit changer.**
