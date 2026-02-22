import { ChangeDetectionStrategy, Component, computed, model } from '@angular/core';

import { ExportDataType, ExportFilter } from '../../models/export-filter.model';

/** Composant de sélection de la période et des types de données pour l'export. */
@Component({
  selector: 'gt-export-range-picker',
  standalone: true,
  templateUrl: './export-range-picker.component.html',
  styleUrl: './export-range-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportRangePickerComponent {
  // 1. Inputs / Outputs
  readonly filter = model.required<ExportFilter>();

  // 5. Computed
  /** Valeur au format YYYY-MM-DD pour l'input[type=date] "du" */
  readonly fromValue = computed(() => this.toDateInputString(this.filter().from));

  /** Valeur au format YYYY-MM-DD pour l'input[type=date] "au" */
  readonly toValue = computed(() => this.toDateInputString(this.filter().to));

  // 7. Méthodes publiques

  onFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const date = this.parseDateInput(value);
    if (date) {
      this.filter.update(f => ({ ...f, from: date }));
    }
  }

  onToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const date = this.parseDateInput(value);
    if (date) {
      this.filter.update(f => ({ ...f, to: date }));
    }
  }

  isTypeSelected(type: ExportDataType): boolean {
    return this.filter().dataTypes.includes(type);
  }

  onTypeToggle(type: ExportDataType): void {
    const current = this.filter().dataTypes;
    const isSelected = current.includes(type);
    /* Empêche de désélectionner le dernier type */
    if (isSelected && current.length === 1) return;
    const next = isSelected ? current.filter(t => t !== type) : [...current, type];
    this.filter.update(f => ({ ...f, dataTypes: next }));
  }

  // 8. Méthodes privées

  /** Convertit une Date en chaîne YYYY-MM-DD (heure locale) pour input[type=date]. */
  private toDateInputString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Parse une chaîne YYYY-MM-DD en Date locale (minuit). Retourne null si invalide. */
  private parseDateInput(value: string): Date | null {
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }
}
