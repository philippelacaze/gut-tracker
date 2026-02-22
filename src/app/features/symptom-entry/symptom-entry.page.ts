import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  BodyLocation,
  Symptom,
  SymptomEntry,
  SymptomType,
  SeverityLevel,
} from '../../core/models/symptom-entry.model';
import { VoiceParseResult, VoiceSymptomResult } from '../../core/models/voice-entry.model';
import { VoiceInputComponent } from '../../shared/components/voice-input/voice-input.component';
import { BodyMapComponent } from './components/body-map/body-map.component';
import { SeveritySliderComponent } from './components/severity-slider/severity-slider.component';
import { SymptomEntryCardComponent } from './components/symptom-entry-card/symptom-entry-card.component';
import { SymptomTypePickerComponent } from './components/symptom-type-picker/symptom-type-picker.component';
import { SymptomEntryStore } from './services/symptom-entry.store';

@Component({
  selector: 'gt-symptom-entry-page',
  standalone: true,
  imports: [
    BodyMapComponent,
    SeveritySliderComponent,
    SymptomTypePickerComponent,
    SymptomEntryCardComponent,
    VoiceInputComponent,
  ],
  templateUrl: './symptom-entry.page.html',
  styleUrl: './symptom-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomEntryPageComponent {
  // 3. Injections
  private readonly _store = inject(SymptomEntryStore);

  // 4. Signals — état du formulaire courant (1 symptôme en cours de saisie)
  private readonly _currentType = signal<SymptomType>('pain');
  private readonly _currentSeverity = signal<SeverityLevel>(5);
  private readonly _currentLocation = signal<BodyLocation | null>(null);
  private readonly _currentNote = signal('');

  // Signals — liste des symptômes accumulés avant sauvegarde
  private readonly _pendingSymptoms = signal<Symptom[]>([]);
  private readonly _saving = signal(false);

  readonly currentType = this._currentType.asReadonly();
  readonly currentSeverity = this._currentSeverity.asReadonly();
  readonly currentLocation = this._currentLocation.asReadonly();
  readonly currentNote = this._currentNote.asReadonly();
  readonly pendingSymptoms = this._pendingSymptoms.asReadonly();
  readonly saving = this._saving.asReadonly();

  // Signals depuis le store
  readonly loading = this._store.loading;
  readonly todayEntries = this._store.todayEntries;

  // 5. Computed
  readonly canSave = computed(() => this._pendingSymptoms().length > 0);

  // 7. Méthodes publiques
  onTypeChange(type: SymptomType): void {
    this._currentType.set(type);
    // Réinitialise la localisation si elle n'est plus pertinente
    if (type !== 'pain') {
      this._currentLocation.set(null);
    }
  }

  onSeverityChange(level: SeverityLevel): void {
    this._currentSeverity.set(level);
  }

  onLocationSelected(location: BodyLocation): void {
    this._currentLocation.set(location);
  }

  onNoteInput(event: Event): void {
    this._currentNote.set((event.target as HTMLInputElement).value);
  }

  addSymptom(): void {
    const symptom: Symptom = {
      type: this._currentType(),
      severity: this._currentSeverity(),
      location: this._currentLocation() ?? undefined,
      note: this._currentNote().trim() || undefined,
    };

    this._pendingSymptoms.update(list => [...list, symptom]);

    // Réinitialise le formulaire
    this._currentType.set('pain');
    this._currentSeverity.set(5);
    this._currentLocation.set(null);
    this._currentNote.set('');
  }

  removePendingSymptom(index: number): void {
    this._pendingSymptoms.update(list => list.filter((_, i) => i !== index));
  }

  /** Pré-remplit la liste de symptômes depuis le résultat de la saisie vocale */
  onVoiceResult(result: VoiceParseResult): void {
    const data = result.data as VoiceSymptomResult;
    data.symptoms.forEach(s => {
      const note =
        [s.note, s.locationHint ? `Zone : ${s.locationHint}` : null]
          .filter(Boolean)
          .join(' — ') || undefined;
      this._pendingSymptoms.update(list => [
        ...list,
        { type: s.type, severity: s.severity, note },
      ]);
    });
  }

  async saveEntry(): Promise<void> {
    if (!this.canSave()) return;

    this._saving.set(true);
    try {
      const entry: SymptomEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        symptoms: this._pendingSymptoms(),
      };
      await this._store.add(entry);
      this._pendingSymptoms.set([]);
    } catch (err: unknown) {
      console.error('[SymptomEntryPage] Erreur lors de la sauvegarde', err);
    } finally {
      this._saving.set(false);
    }
  }
}
