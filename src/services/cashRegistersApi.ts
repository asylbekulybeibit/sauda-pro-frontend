import { api } from './api';
import {
  CashRegister,
  CreateCashRegisterDto,
  CashRegisterStatus,
  PaymentMethodDto,
} from '../types/cash-register';

export const cashRegistersApi = {
  // Получить все кассы магазина
  getAll: async (shopId: string): Promise<CashRegister[]> => {
    const { data } = await api.get(`/manager/${shopId}/cash-registers`);
    return data;
  },

  // Получить одну кассу
  getOne: async (shopId: string, id: string): Promise<CashRegister> => {
    const { data } = await api.get(`/manager/${shopId}/cash-registers/${id}`);
    return data;
  },

  // Создать новую кассу
  create: async (
    shopId: string,
    dto: CreateCashRegisterDto
  ): Promise<CashRegister> => {
    const { data } = await api.post(`/manager/${shopId}/cash-registers`, dto);
    return data;
  },

  // Обновить статус кассы
  updateStatus: async (
    shopId: string,
    id: string,
    status: CashRegisterStatus
  ): Promise<CashRegister> => {
    const { data } = await api.put(
      `/manager/${shopId}/cash-registers/${id}/status`,
      {
        status,
      }
    );
    return data;
  },

  // Удалить кассу
  remove: async (shopId: string, id: string): Promise<void> => {
    await api.delete(`/manager/${shopId}/cash-registers/${id}`);
  },

  // Обновить методы оплаты кассы
  updatePaymentMethods: async (
    shopId: string,
    id: string,
    paymentMethods: PaymentMethodDto[]
  ): Promise<CashRegister> => {
    const { data } = await api.put(
      `/manager/${shopId}/cash-registers/${id}/payment-methods`,
      {
        paymentMethods,
      }
    );
    return data;
  },
};
