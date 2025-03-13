import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/analyticsApi';
import {
  InventoryAnalyticsData,
  SalesAnalyticsData,
  StaffPerformanceData,
  FinancialMetricsData,
} from '@/types/analytics';

export const useAnalyticsKeys = {
  sales: (shopId: string, startDate: string, endDate: string) => [
    'analytics',
    'sales',
    shopId,
    startDate,
    endDate,
  ],
  inventory: (shopId: string) => ['analytics', 'inventory', shopId],
  staff: (shopId: string, startDate: string, endDate: string) => [
    'analytics',
    'staff',
    shopId,
    startDate,
    endDate,
  ],
  financial: (shopId: string, startDate: string, endDate: string) => [
    'analytics',
    'financial',
    shopId,
    startDate,
    endDate,
  ],
};

export const useSalesAnalytics = (
  shopId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery<SalesAnalyticsData>({
    queryKey: useAnalyticsKeys.sales(shopId, startDate, endDate),
    queryFn: () => analyticsApi.getSalesAnalytics(shopId, startDate, endDate),
    staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
    gcTime: 30 * 60 * 1000, // Кэш хранится 30 минут
  });
};

export const useInventoryAnalytics = (shopId: string) => {
  return useQuery<InventoryAnalyticsData>({
    queryKey: useAnalyticsKeys.inventory(shopId),
    queryFn: () => analyticsApi.getInventoryAnalytics(shopId),
    staleTime: 10 * 60 * 1000, // Данные считаются свежими 10 минут
    gcTime: 30 * 60 * 1000, // Кэш хранится 30 минут
  });
};

export const useStaffAnalytics = (
  shopId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery<StaffPerformanceData, Error>({
    queryKey: useAnalyticsKeys.staff(shopId, startDate, endDate),
    queryFn: () => analyticsApi.getStaffPerformance(shopId, startDate, endDate),
    staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
    gcTime: 30 * 60 * 1000, // Кэш хранится 30 минут
  });
};

export const useFinancialAnalytics = (
  shopId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery<FinancialMetricsData>({
    queryKey: useAnalyticsKeys.financial(shopId, startDate, endDate),
    queryFn: () => analyticsApi.getFinancialMetrics(shopId, startDate, endDate),
    staleTime: 15 * 60 * 1000, // Данные считаются свежими 15 минут
    gcTime: 30 * 60 * 1000, // Кэш хранится 30 минут
  });
};
