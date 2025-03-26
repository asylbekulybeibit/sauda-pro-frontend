import { api } from './api';
import {
  CashRegister,
  CreateCashRegisterDto,
  CashRegisterStatus,
  PaymentMethodDto,
  PaymentMethodTransactionType,
} from '../types/cash-register';

export const cashRegistersApi = {
  // Получить все кассы склада
  getAll: async (warehouseId: string): Promise<CashRegister[]> => {
    const { data } = await api.get(`/manager/${warehouseId}/cash-registers`);
    return data;
  },

  // Получить одну кассу
  getOne: async (warehouseId: string, id: string): Promise<CashRegister> => {
    const { data } = await api.get(
      `/manager/${warehouseId}/cash-registers/${id}`
    );
    return data;
  },

  // Создать новую кассу
  create: async (
    warehouseId: string,
    dto: CreateCashRegisterDto
  ): Promise<CashRegister> => {
    const { data } = await api.post(
      `/manager/${warehouseId}/cash-registers`,
      dto
    );
    return data;
  },

  // Обновить статус кассы
  updateStatus: async (
    warehouseId: string,
    id: string,
    status: CashRegisterStatus
  ): Promise<CashRegister> => {
    const { data } = await api.put(
      `/manager/${warehouseId}/cash-registers/${id}/status`,
      {
        status,
      }
    );
    return data;
  },

  // Удалить кассу
  remove: async (warehouseId: string, id: string): Promise<void> => {
    await api.delete(`/manager/${warehouseId}/cash-registers/${id}`);
  },

  // Обновить методы оплаты кассы
  updatePaymentMethods: async (
    warehouseId: string,
    id: string,
    paymentMethods: PaymentMethodDto[]
  ): Promise<CashRegister> => {
    const { data } = await api.put(
      `/manager/${warehouseId}/cash-registers/${id}/payment-methods`,
      {
        paymentMethods,
      }
    );
    return data;
  },

  // Получить все транзакции метода оплаты
  getPaymentMethodTransactions: async (
    warehouseId: string,
    paymentMethodId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      type?: PaymentMethodTransactionType;
      limit?: number;
      offset?: number;
    }
  ) => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const { data } = await api.get(
      `/manager/${warehouseId}/payment-methods/${paymentMethodId}/transactions?${params.toString()}`
    );
    return data;
  },

  // Пополнить баланс метода оплаты
  depositToPaymentMethod: async (
    warehouseId: string,
    paymentMethodId: string,
    amount: number,
    note?: string,
    shiftId?: string
  ) => {
    const { data } = await api.post(
      `/manager/${warehouseId}/payment-methods/${paymentMethodId}/deposit`,
      {
        amount,
        note,
        shiftId,
      }
    );
    return data;
  },

  // Изъять средства из баланса метода оплаты
  withdrawFromPaymentMethod: async (
    warehouseId: string,
    paymentMethodId: string,
    amount: number,
    note?: string,
    shiftId?: string
  ) => {
    const { data } = await api.post(
      `/manager/${warehouseId}/payment-methods/${paymentMethodId}/withdraw`,
      {
        amount,
        note,
        shiftId,
      }
    );
    return data;
  },
};
