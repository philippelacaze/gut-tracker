import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ExportFilter } from './models/export-filter.model';
import { ExportService } from './services/export.service';
import { ExportRangePickerComponent } from './components/export-range-picker/export-range-picker.component';

/** Page principale de l'export des données (JSON, CSV, PDF). */
@Component({
  selector: 'gt-export-page',
  standalone: true,
  imports: [ExportRangePickerComponent],
  templateUrl: './export.page.html',
  styleUrl: './export.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPageComponent {
  // 3. Injections
  private readonly _exportService = inject(ExportService);

  // 4. Signals locaux
  private readonly _filter = signal<ExportFilter>(this.createDefaultFilter());
  readonly filter = this._filter.asReadonly();

  private readonly _exporting = signal(false);
  readonly exporting = this._exporting.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  // 7. Méthodes publiques

  onFilterChange(filter: ExportFilter): void {
    this._filter.set(filter);
  }

  exportJson(): void {
    this._error.set(null);
    this._exportService.toJson(this._filter());
  }

  exportCsv(): void {
    this._error.set(null);
    this._exportService.toCsv(this._filter());
  }

  async exportPdf(): Promise<void> {
    this._error.set(null);
    this._exporting.set(true);
    try {
      await this._exportService.toPdf(this._filter());
    } catch {
      this._error.set($localize`:@@export.pdfError:Erreur lors de la génération du PDF.`);
    } finally {
      this._exporting.set(false);
    }
  }

  // 8. Méthodes privées

  private createDefaultFilter(): ExportFilter {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return {
      from,
      to,
      dataTypes: ['food', 'medication', 'symptom'],
    };
  }
}
