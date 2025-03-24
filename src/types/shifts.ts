/**
 * Перечисление статусов смены
 */
export enum ShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PAUSED = 'paused',
}

/**
 * Интерфейс смены
 */
export interface Shift {
  id: string;
  registerName: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  status: ShiftStatus;
  sales: number;
  returns: number;
  totalSales: number;
  cashPayments: number;
  cardPayments: number;
}
