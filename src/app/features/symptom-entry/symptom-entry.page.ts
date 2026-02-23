import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  BodyLocation,
  BristolScale,
  Symptom,
  SymptomEntry,
  SymptomType,
  SeverityLevel,
} from '../../core/models/symptom-entry.model';
import { VoiceParseResult, VoiceSymptomResult } from '../../core/models/voice-entry.model';
import { VoiceInputComponent } from '../../shared/components/voice-input/voice-input.component';
import { BodyMapComponent } from './components/body-map/body-map.component';
import { SeveritySliderComponent } from './components/severity-slider/severity-slider.component';
import { BristolScalePickerComponent } from './components/bristol-scale-picker/bristol-scale-picker.component';
import { SymptomEntryCardComponent } from './components/symptom-entry-card/symptom-entry-card.component';
import { SymptomTypePickerComponent } from './components/symptom-type-picker/symptom-type-picker.component';
import { SymptomEntryStore } from './services/symptom-entry.store';

/** Symptôme enrichi d'un timestamp d'ajout pour la liste en attente */
interface PendingSymptom extends Symptom {
  addedAt: string;
}

const SYMPTOM_TYPE_LABELS: Record<SymptomType, string> = {
  pain: $localize`:@@symptomType.pain:Douleur`,
  bloating: $localize`:@@symptomType.bloating:Ballonnements`,
  gas: $localize`:@@symptomType.gas:Gaz`,
  belching: $localize`:@@symptomType.belching:Éructations`,
  stool: $localize`:@@symptomType.stool:Selles`,
  headache: $localize`:@@symptomType.headache:Maux de tête`,
  other: $localize`:@@symptomType.other:Autre`,
};

const SYMPTOM_TYPE_ICONS: Record<SymptomType, string> = {
  pain: '🤕', bloating: '🫃', gas: '💨', belching: '😮‍💨',
  stool: '🚽', headache: '🤯', other: '❓',
};

const BRISTOL_LABELS: Record<BristolScale, string> = {
  1: $localize`:@@bristolScale.1:Très dur`,
  2: $localize`:@@bristolScale.2:Grumeleuse`,
  3: $localize`:@@bristolScale.3:Craquelée`,
  4: $localize`:@@bristolScale.4:Lisse`,
  5: $localize`:@@bristolScale.5:Morceaux mous`,
  6: $localize`:@@bristolScale.6:Pâteuse`,
  7: $localize`:@@bristolScale.7:Liquide`,
};

const REGION_LABELS: Record<string, string> = {
  head: $localize`:@@bodyMap.region.head:Tête`,
  thorax: $localize`:@@bodyMap.region.thorax:Thorax`,
  'abdomen-upper': $localize`:@@bodyMap.region.abdomenUpper:Abdomen haut`,
  'abdomen-left': $localize`:@@bodyMap.region.abdomenLeft:Abdomen gauche`,
  'abdomen-right': $localize`:@@bodyMap.region.abdomenRight:Abdomen droit`,
  'abdomen-lower': $localize`:@@bodyMap.region.abdomenLower:Abdomen bas`,
  pelvis: $localize`:@@bodyMap.region.pelvis:Pelvis`,
  'left-arm': $localize`:@@bodyMap.region.leftArm:Bras gauche`,
  'right-arm': $localize`:@@bodyMap.region.rightArm:Bras droit`,
  'left-leg': $localize`:@@bodyMap.region.leftLeg:Jambe gauche`,
  'right-leg': $localize`:@@bodyMap.region.rightLeg:Jambe droite`,
};

@Component({
  selector: 'gt-symptom-entry-page',
  standalone: true,
  imports: [
    BodyMapComponent,
    BristolScalePickerComponent,
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
  private readonly _currentBristolScale = signal<BristolScale | null>(null);

  // Signals — liste des symptômes accumulés avant sauvegarde
  private readonly _pendingSymptoms = signal<PendingSymptom[]>([]);
  private readonly _saving = signal(false);

  readonly currentType = this._currentType.asReadonly();
  readonly currentSeverity = this._currentSeverity.asReadonly();
  readonly currentLocation = this._currentLocation.asReadonly();
  readonly currentNote = this._currentNote.asReadonly();
  readonly currentBristolScale = this._currentBristolScale.asReadonly();
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
    // Réinitialise l'échelle de Bristol si le type n'est pas "selles"
    if (type !== 'stool') {
      this._currentBristolScale.set(null);
    }
  }

  onBristolScaleChange(scale: BristolScale | null): void {
    this._currentBristolScale.set(scale);
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

  typeLabel(type: SymptomType): string {
    return SYMPTOM_TYPE_LABELS[type];
  }

  typeIcon(type: SymptomType): string {
    return SYMPTOM_TYPE_ICONS[type];
  }

  bristolLabel(scale: BristolScale): string {
    return `Bristol ${scale} – ${BRISTOL_LABELS[scale]}`;
  }

  regionLabel(region: string): string {
    return REGION_LABELS[region] ?? region;
  }

  pendingTimeLabel(addedAt: string): string {
    return new Date(addedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  addSymptom(): void {
    const type = this._currentType();
    const symptom: PendingSymptom = {
      type,
      severity: this._currentSeverity(),
      // La localisation n'est pertinente que pour les douleurs
      location: type === 'pain' ? (this._currentLocation() ?? undefined) : undefined,
      note: this._currentNote().trim() || undefined,
      bristolScale: type === 'stool' ? (this._currentBristolScale() ?? undefined) : undefined,
      addedAt: new Date().toISOString(),
    };

    this._pendingSymptoms.update(list => [...list, symptom]);

    // Réinitialise le formulaire
    this._currentType.set('pain');
    this._currentSeverity.set(5);
    this._currentLocation.set(null);
    this._currentNote.set('');
    this._currentBristolScale.set(null);
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
        { type: s.type, severity: s.severity, note, addedAt: new Date().toISOString() },
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
        // Supprime addedAt avant la persistance (pas partie du modèle Symptom)
        symptoms: this._pendingSymptoms().map(({ addedAt: _addedAt, ...s }) => s),
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
