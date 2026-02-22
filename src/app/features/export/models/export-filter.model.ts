export type ExportDataType = 'food' | 'medication' | 'symptom';

export interface ExportFilter {
  from: Date;
  to: Date;
  dataTypes: ExportDataType[];
}
