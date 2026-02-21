import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';

import { Medication, MedicationType } from '../../../../core/models/medication-entry.model';
import { MedicationEntryStore } from '../../services/medication-entry.store';

interface MedicationTypeOption {
  value: MedicationType;
  label: string;
}

@Component({
  selector: 'gt-medication-picker',
  standalone: true,
  templateUrl: './medication-picker.component.html',
  styleUrl: './medication-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationPickerComponent {
  // 2. Outputs
  readonly medicationAdded = output<Medication>();

  // 3. Injections
  private readonly _store = inject(MedicationEntryStore);

  // 4. Signals locaux
  private readonly _name = signal('');
  private readonly _selectedType = signal<MedicationType>('other');
  private readonly _dose = signal('');
  private readonly _showSuggestions = signal(false);

  readonly name = this._name.asReadonly();
  readonly selectedType = this._selectedType.asReadonly();
  readonly dose = this._dose.asReadonly();

  // 5. Computed
  /** Suggestions filtrées depuis l'historique des médicaments */
  readonly suggestions = computed(() => {
    const q = this._name().toLowerCase().trim();
    if (q.length < 2) return [];
    return this._store.recentMedicationNames()
      .filter(n => n.toLowerCase().includes(q))
      .slice(0, 8);
  });

  readonly showSuggestions = computed(
    () => this._showSuggestions() && this.suggestions().length > 0,
  );

  readonly canAdd = computed(() => this._name().trim().length > 0);

  readonly medicationTypes: MedicationTypeOption[] = [
    { value: 'enzyme', label: $localize`:@@medicationType.enzyme:Enzyme digestive` },
    { value: 'probiotic', label: $localize`:@@medicationType.probiotic:Probiotique` },
    { value: 'antibiotic', label: $localize`:@@medicationType.antibiotic:Antibiotique` },
    { value: 'antispasmodic', label: $localize`:@@medicationType.antispasmodic:Antispasmodique` },
    { value: 'other', label: $localize`:@@medicationType.other:Autre` },
  ];

  // 7. Méthodes publiques
  onNameInput(event: Event): void {
    this._name.set((event.target as HTMLInputElement).value);
    this._showSuggestions.set(true);
  }

  onDoseInput(event: Event): void {
    this._dose.set((event.target as HTMLInputElement).value);
  }

  onNameFocus(): void {
    this._showSuggestions.set(true);
  }

  onNameBlur(): void {
    this._showSuggestions.set(false);
  }

  onTypeSelect(type: MedicationType): void {
    this._selectedType.set(type);
  }

  /** mousedown + preventDefault pour éviter le blur avant le click sur une suggestion */
  onSuggestionMousedown(event: MouseEvent, name: string): void {
    event.preventDefault();
    this._name.set(name);
    this._showSuggestions.set(false);
  }

  addMedication(): void {
    const name = this._name().trim();
    if (!name) return;

    const medication: Medication = {
      name,
      type: this._selectedType(),
      dose: this._dose().trim() || undefined,
    };

    this.medicationAdded.emit(medication);
    this._name.set('');
    this._dose.set('');
    this._selectedType.set('other');
    this._showSuggestions.set(false);
  }
}
