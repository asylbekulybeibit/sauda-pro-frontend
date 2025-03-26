import { api } from './api';
import {
  CashRegister,
  CreateCashRegisterDto,
  CashRegisterStatus,
  PaymentMethodDto,
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
};
