export type ReportType = 'SALES' | 'INVENTORY' | 'STAFF' | 'FINANCIAL';
export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV';

export interface Report {
  id: number;
  name: string;
  type: ReportType;
  format: ReportFormat;
  startDate: string;
  endDate: string;
  shopId: number;
  createdAt: string;
  updatedAt: string;
}
