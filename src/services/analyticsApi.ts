import {api} from './api';

import { ApiErrorHandler } from '@/utils/error-handler';

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDay: Array<{
    date: string;
    amount: number;
    type: string;
  }>;
  salesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface InventoryAnalytics {
  totalItems: number;
  totalValue: number;
  stockByCategory: Array<{
    category: string;
    quantity: number;
    value: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
    price: number;
  }>;
}

export interface StaffAnalytics {
  totalStaff: number;
  totalSales: number;
  averageSalesPerEmployee: number;
  bestPerformer: {
    name: string;
    sales: number;
    transactions: number;
  };
  staffStats: Array<{
    id: string;
    name: string;
    position: string;
    sales: number;
    transactions: number;
    averageCheck: number;
    returns: number;
    workingHours: number;
    efficiency: number;
  }>;
  salesByHour: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  revenueGrowth: number;
  profitGrowth: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  dailyMetrics: Array<{
    date: string;
    revenue: number;
    profit: number;
    expenses: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    profit: number;
    margin: number;
    quantity: number;
  }>;
}

export const analyticsApi = {
  getSalesAnalytics: async (
    shopId: string,
    startDate: string,
    endDate: string
  ): Promise<SalesAnalytics> => {
    try {
      const response = await api.get('/analytics/sales', {
        params: { shopId, startDate, endDate },
      });
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },

  getInventoryAnalytics: async (
    shopId: string
  ): Promise<InventoryAnalytics> => {
    try {
      const response = await api.get('/analytics/inventory', {
        params: { shopId },
      });
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },

  getStaffPerformance: async (
    shopId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffAnalytics> => {
    try {
      const response = await api.get('/analytics/staff', {
        params: { shopId, startDate, endDate },
      });
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },

  getFinancialMetrics: async (
    shopId: string,
    startDate: string,
    endDate: string
  ): Promise<FinancialAnalytics> => {
    try {
      const response = await api.get('/analytics/financial', {
        params: { shopId, startDate, endDate },
      });
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },
};
