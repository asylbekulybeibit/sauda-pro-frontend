import { api } from './api';
import {
  SalesHistoryFilters,
  SalesHistoryResponse,
  SalesReceiptDetails,
} from '@/types/sales';

export const getSalesHistory = async (
  warehouseId: string,
  filters?: SalesHistoryFilters
): Promise<SalesHistoryResponse[]> => {
  try {
    console.log('🚀 [salesApi.getSalesHistory] Starting request');
    console.log('📝 Parameters:', {
      warehouseId,
      filters,
      token: localStorage.getItem('accessToken')?.slice(0, 10) + '...',
    });

    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.receiptType) params.append('receiptType', filters.receiptType);
    if (filters?.cashierId) params.append('cashierId', filters.cashierId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.paymentMethod) {
      params.append('paymentMethod', filters.paymentMethod);
      console.log('💳 Adding payment method filter:', filters.paymentMethod);
    }

    const url = `/manager/${warehouseId}/sales/history?${params}`;
    console.log('🔗 Request URL:', url);

    const { data } = await api.get(url);

    console.log('✅ Response received:', {
      status: 'success',
      count: data?.length || 0,
      sample: data?.[0]
        ? {
            id: data[0].id,
            number: data[0].number,
            totalAmount: data[0].totalAmount,
          }
        : 'No data',
    });

    return data;
  } catch (error: any) {
    console.error('❌ [salesApi.getSalesHistory] Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });
    throw error;
  }
};

export const getSalesReceiptDetails = async (
  warehouseId: string,
  receiptId: string
): Promise<SalesReceiptDetails> => {
  try {
    console.log('🚀 [salesApi.getSalesReceiptDetails] Starting request');
    console.log('📝 Parameters:', { warehouseId, receiptId });

    const { data } = await api.get(
      `/manager/${warehouseId}/sales/receipts/${receiptId}`
    );

    console.log('✅ Receipt details received:', {
      id: data.id,
      number: data.number,
      items: data.items?.length || 0,
    });

    return data;
  } catch (error: any) {
    console.error('❌ [salesApi.getSalesReceiptDetails] Error:', error);
    throw error;
  }
};

export const printReceipt = async (
  warehouseId: string,
  receiptId: string
): Promise<void> => {
  try {
    console.log('🚀 [salesApi.printReceipt] Starting request');
    console.log('📝 Parameters:', { warehouseId, receiptId });

    await api.post(`/manager/${warehouseId}/sales/receipts/${receiptId}/print`);

    console.log('✅ Print request sent successfully');
  } catch (error: any) {
    console.error('❌ [salesApi.printReceipt] Error:', error);
    throw error;
  }
};

export const getCashiers = async (
  warehouseId: string
): Promise<Array<{ id: string; name: string }>> => {
  try {
    console.log('🚀 [salesApi.getCashiers] Starting request');
    console.log('📝 Parameters:', { warehouseId });

    const { data } = await api.get(`/manager/${warehouseId}/sales/cashiers`);

    console.log('✅ Cashiers received:', {
      count: data?.length || 0,
    });

    return data.map((cashier: any) => ({
      id: cashier.id,
      name: `${cashier.firstName} ${cashier.lastName}`.trim(),
    }));
  } catch (error: any) {
    console.error('❌ [salesApi.getCashiers] Error:', error);
    throw error;
  }
};

export const getClients = async (
  warehouseId: string
): Promise<Array<{ id: string; firstName: string; lastName: string }>> => {
  try {
    console.log('🚀 [salesApi.getClients] Starting request');
    console.log('📝 Parameters:', { warehouseId });

    const { data } = await api.get(`/manager/${warehouseId}/sales/clients`);

    console.log('✅ Clients received:', {
      count: data?.length || 0,
    });

    return data.map((client: any) => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName || '',
    }));
  } catch (error: any) {
    console.error('❌ [salesApi.getClients] Error:', error);
    throw error;
  }
};

export const getVehicles = async (
  warehouseId: string
): Promise<Array<{ id: string; name: string }>> => {
  try {
    console.log('🚀 [salesApi.getVehicles] Starting request');
    console.log('📝 Parameters:', { warehouseId });

    const { data } = await api.get(`/manager/${warehouseId}/sales/vehicles`);

    console.log('✅ Vehicles received:', {
      count: data?.length || 0,
    });

    return data.map((vehicle: any) => ({
      id: vehicle.id,
      name: vehicle.name || 'Н/Д',
    }));
  } catch (error: any) {
    console.error('❌ [salesApi.getVehicles] Error:', error);
    throw error;
  }
};

export const getActivePaymentMethods = async (warehouseId: string) => {
  try {
    console.log(
      '🚀 [salesApi.getActivePaymentMethods] Starting request for warehouse:',
      warehouseId
    );
    console.log('📌 URL:', `/manager/${warehouseId}/sales/payment-methods`);

    const { data } = await api.get(
      `/manager/${warehouseId}/sales/payment-methods`
    );

    console.log('✅ Payment methods received:', {
      count: data?.length || 0,
      methods: data,
    });

    // Проверим, есть ли методы и какого они типа
    if (data && data.length > 0) {
      console.log('📊 Payment methods by source:', {
        system: data.filter((m: any) => m.source === 'system').length,
        custom: data.filter((m: any) => m.source === 'custom').length,
        unknown: data.filter((m: any) => !m.source).length,
      });

      // Добавим логирование кассовых аппаратов
      const withCashRegister = data.filter((m: any) => m.cashRegister).length;
      console.log(
        `💳 Methods with cash register: ${withCashRegister} of ${data.length}`
      );

      console.log('💡 First payment method example:', data[0]);
    } else {
      console.warn('⚠️ No payment methods received from API!');
    }

    return data;
  } catch (error: any) {
    console.error('❌ [salesApi.getActivePaymentMethods] Error:', error);
    throw error;
  }
};
