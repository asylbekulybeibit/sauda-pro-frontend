export type ReportType =
  | 'SALES'
  | 'INVENTORY'
  | 'STAFF'
  | 'FINANCIAL'
  | 'CATEGORIES'
  | 'PROMOTIONS';
export type ReportFormat = 'pdf' | 'excel';
export type ReportPeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'custom';

export interface Report {
  id: number;
  name: string;
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
  filters?: {
    categories?: string[];
    products?: string[];
    staff?: string[];
    promotions?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  data?: {
    summary?: Record<string, any>;
    details?: Array<Record<string, any>>;
    charts?: Record<string, any>;
    [key: string]: any;
  };
}
