import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';

import { FoodEntry } from '../../../core/models/food-entry.model';
import { MedicationEntry } from '../../../core/models/medication-entry.model';
import { SymptomEntry } from '../../../core/models/symptom-entry.model';
import { FoodEntryStore } from '../../food-entry/services/food-entry.store';
import { MedicationEntryStore } from '../../medication-entry/services/medication-entry.store';
import { SymptomEntryStore } from '../../symptom-entry/services/symptom-entry.store';
import { ExportDataType, ExportFilter } from '../models/export-filter.model';

/** Structure de l'export JSON */
interface ExportData {
  exportedAt: string;
  period: { from: string; to: string };
  food?: FoodEntry[];
  medication?: MedicationEntry[];
  symptom?: SymptomEntry[];
}

/** Service responsable de la génération et du téléchargement des exports (JSON, CSV, PDF). */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly _foodStore = inject(FoodEntryStore);
  private readonly _medicationStore = inject(MedicationEntryStore);
  private readonly _symptomStore = inject(SymptomEntryStore);
  private readonly _document = inject(DOCUMENT);

  /** Exporte toutes les données filtrées au format JSON. */
  toJson(filter: ExportFilter): void {
    const data = this.collectData(filter);
    const content = JSON.stringify(data, null, 2);
    this.triggerDownload(content, 'application/json', `gut-tracker-${this.fileDate()}.json`);
  }

  /** Exporte les données filtrées au format CSV (une ligne par entrée). */
  toCsv(filter: ExportFilter): void {
    const rows = this.buildCsvRows(filter);
    const content = rows.join('\r\n');
    this.triggerDownload(content, 'text/csv;charset=utf-8', `gut-tracker-${this.fileDate()}.csv`);
  }

  /** Exporte un rapport PDF lisible, chronologique, pour usage médical. */
  async toPdf(filter: ExportFilter): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.buildPdf(doc, filter);
    doc.save(`gut-tracker-${this.fileDate()}.pdf`);
  }

  // ─── Collecte de données ──────────────────────────────────────────────────

  private collectData(filter: ExportFilter): ExportData {
    const data: ExportData = {
      exportedAt: new Date().toISOString(),
      period: { from: filter.from.toISOString(), to: filter.to.toISOString() },
    };
    if (filter.dataTypes.includes('food')) {
      data.food = this.filterByDate(this._foodStore.entries(), filter);
    }
    if (filter.dataTypes.includes('medication')) {
      data.medication = this.filterByDate(this._medicationStore.entries(), filter);
    }
    if (filter.dataTypes.includes('symptom')) {
      data.symptom = this.filterByDate(this._symptomStore.entries(), filter);
    }
    return data;
  }

  // ─── Construction CSV ─────────────────────────────────────────────────────

  private buildCsvRows(filter: ExportFilter): string[] {
    const header = ['type', 'date', 'heure', 'categorie', 'details', 'fodmap', 'severite'];
    const rows: string[] = [header.join(',')];

    if (filter.dataTypes.includes('food')) {
      for (const entry of this.filterByDate(this._foodStore.entries(), filter)) {
        const d = new Date(entry.timestamp);
        const details = entry.foods
          .map(f => f.name + (f.quantity ? ` (${f.quantity})` : ''))
          .join('; ');
        rows.push(
          this.csvRow([
            'food',
            this.fmtDate(d),
            this.fmtTime(d),
            entry.mealType,
            details,
            entry.globalFodmapScore?.level ?? '',
            '',
          ]),
        );
      }
    }

    if (filter.dataTypes.includes('medication')) {
      for (const entry of this.filterByDate(this._medicationStore.entries(), filter)) {
        const d = new Date(entry.timestamp);
        const details = entry.medications
          .map(m => m.name + (m.dose ? ` ${m.dose}` : ''))
          .join('; ');
        const categories = [...new Set(entry.medications.map(m => m.type))].join('; ');
        rows.push(
          this.csvRow(['medication', this.fmtDate(d), this.fmtTime(d), categories, details, '', '']),
        );
      }
    }

    if (filter.dataTypes.includes('symptom')) {
      for (const entry of this.filterByDate(this._symptomStore.entries(), filter)) {
        const d = new Date(entry.timestamp);
        const details = entry.symptoms
          .map(s => s.type + (s.location ? ` (${s.location.region})` : ''))
          .join('; ');
        const types = [...new Set(entry.symptoms.map(s => s.type))].join('; ');
        const maxSeverity = Math.max(...entry.symptoms.map(s => s.severity));
        rows.push(
          this.csvRow([
            'symptom',
            this.fmtDate(d),
            this.fmtTime(d),
            types,
            details,
            '',
            isFinite(maxSeverity) ? String(maxSeverity) : '',
          ]),
        );
      }
    }

    return rows;
  }

  // ─── Construction PDF ─────────────────────────────────────────────────────

  private buildPdf(doc: jsPDF, filter: ExportFilter): void {
    const margin = 15;
    const pageW = doc.internal.pageSize.getWidth();
    const usableW = pageW - 2 * margin;
    const lh = 6;
    let y = margin;

    doc.setFontSize(18);
    doc.text('GutTracker – Rapport de données', margin, y);
    y += lh * 1.5;

    doc.setFontSize(10);
    doc.text(`Exporté le : ${this.fmtDate(new Date())}`, margin, y);
    y += lh;
    doc.text(`Période : ${this.fmtDate(filter.from)} – ${this.fmtDate(filter.to)}`, margin, y);
    y += lh * 2;

    if (filter.dataTypes.includes('food')) {
      const entries = this.filterByDate(this._foodStore.entries(), filter);
      y = this.pdfSection(doc, 'Alimentation', y, margin, lh);
      if (entries.length === 0) {
        y = this.pdfText(doc, '  Aucune entrée sur la période.', y, margin, lh, usableW);
      }
      for (const entry of entries) {
        const d = new Date(entry.timestamp);
        const foods = entry.foods.map(f => f.name).join(', ') || '—';
        const fodmap = entry.globalFodmapScore ? ` [FODMAP: ${entry.globalFodmapScore.level}]` : '';
        y = this.pdfText(
          doc,
          `${this.fmtDate(d)} ${this.fmtTime(d)} – [${entry.mealType}] ${foods}${fodmap}`,
          y,
          margin,
          lh,
          usableW,
        );
      }
      y += lh / 2;
    }

    if (filter.dataTypes.includes('medication')) {
      const entries = this.filterByDate(this._medicationStore.entries(), filter);
      y = this.pdfSection(doc, 'Médicaments', y, margin, lh);
      if (entries.length === 0) {
        y = this.pdfText(doc, '  Aucune entrée sur la période.', y, margin, lh, usableW);
      }
      for (const entry of entries) {
        const d = new Date(entry.timestamp);
        const meds = entry.medications
          .map(m => m.name + (m.dose ? ` ${m.dose}` : ''))
          .join(', ');
        y = this.pdfText(
          doc,
          `${this.fmtDate(d)} ${this.fmtTime(d)} – ${meds}`,
          y,
          margin,
          lh,
          usableW,
        );
      }
      y += lh / 2;
    }

    if (filter.dataTypes.includes('symptom')) {
      const entries = this.filterByDate(this._symptomStore.entries(), filter);
      y = this.pdfSection(doc, 'Symptômes', y, margin, lh);
      if (entries.length === 0) {
        y = this.pdfText(doc, '  Aucune entrée sur la période.', y, margin, lh, usableW);
      }
      for (const entry of entries) {
        const d = new Date(entry.timestamp);
        const symptoms = entry.symptoms.map(s => `${s.type} (${s.severity}/10)`).join(', ');
        y = this.pdfText(
          doc,
          `${this.fmtDate(d)} ${this.fmtTime(d)} – ${symptoms}`,
          y,
          margin,
          lh,
          usableW,
        );
      }
    }
  }

  /** Écrit un titre de section et retourne la nouvelle position y. */
  private pdfSection(doc: jsPDF, title: string, y: number, margin: number, lh: number): number {
    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 30) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(13);
    doc.text(title, margin, y);
    doc.setFontSize(10);
    return y + lh;
  }

  /** Écrit une ligne de texte (avec retour à la ligne automatique) et retourne la nouvelle position y. */
  private pdfText(
    doc: jsPDF,
    text: string,
    y: number,
    margin: number,
    lh: number,
    maxW: number,
  ): number {
    const pageH = doc.internal.pageSize.getHeight();
    const lines = doc.splitTextToSize(text, maxW) as string[];
    for (const line of lines) {
      if (y > pageH - 15) {
        doc.addPage();
        y = margin;
        doc.setFontSize(10);
      }
      doc.text(line, margin, y);
      y += lh;
    }
    return y;
  }

  // ─── Filtrage et utilitaires ──────────────────────────────────────────────

  /** Filtre les entrées dont le timestamp est compris dans la plage de dates du filtre. */
  filterByDate<T extends { timestamp: string }>(entries: T[], filter: ExportFilter): T[] {
    const from = new Date(filter.from);
    from.setHours(0, 0, 0, 0);
    const to = new Date(filter.to);
    to.setHours(23, 59, 59, 999);
    return entries.filter(e => {
      const d = new Date(e.timestamp);
      return d >= from && d <= to;
    });
  }

  /** Déclenche le téléchargement d'un fichier texte via un lien temporaire. */
  private triggerDownload(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = this._document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private csvRow(fields: string[]): string {
    return fields.map(f => this.csvEscape(f)).join(',');
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private fmtDate(date: Date): string {
    return date.toLocaleDateString('fr-FR');
  }

  private fmtTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private fileDate(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Retourne les types de données sélectionnés pour l'affichage. */
  getSelectedDataTypes(filter: ExportFilter): ExportDataType[] {
    return filter.dataTypes;
  }
}
