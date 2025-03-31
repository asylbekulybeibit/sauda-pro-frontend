import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { Debt, DebtStatistics } from '@/types/debt';
import {
  getDebts,
  getActiveDebts,
  getDebtsStatistics,
  getDebtsBySupplier,
} from '@/services/managerApi';

export const useDebts = (warehouseId: string) => {
  console.log('[useDebts] Hook called with warehouse ID:', warehouseId);

  const {
    data: debts = [],
    isLoading: isLoadingDebts,
    error: debtsError,
    refetch: refetchDebts,
  } = useQuery<Debt[]>({
    queryKey: ['debts', warehouseId],
    queryFn: () => {
      console.log('[useDebts] Fetching debts for warehouse:', warehouseId);
      return getDebts(warehouseId);
    },
    enabled: !!warehouseId,
  });

  const {
    data: activeDebts = [],
    isLoading: isLoadingActiveDebts,
    error: activeDebtsError,
  } = useQuery<Debt[]>({
    queryKey: ['active-debts', warehouseId],
    queryFn: () => {
      console.log(
        '[useDebts] Fetching active debts for warehouse:',
        warehouseId
      );
      return getActiveDebts(warehouseId);
    },
    enabled: !!warehouseId,
  });

  const {
    data: statistics,
    isLoading: isLoadingStatistics,
    error: statisticsError,
    refetch: refetchStatistics,
  } = useQuery<DebtStatistics>({
    queryKey: ['debtsStatistics', warehouseId],
    queryFn: () => {
      console.log('[useDebts] Fetching statistics for warehouse:', warehouseId);
      return getDebtsStatistics(warehouseId);
    },
    enabled: !!warehouseId,
  });

  console.log('[useDebts] Current state:', {
    debtsLoading: isLoadingDebts,
    statisticsLoading: isLoadingStatistics,
    debtsError,
    statisticsError,
    debtsCount: debts?.length,
    hasStatistics: !!statistics,
  });

  return {
    debts,
    statistics,
    isLoadingDebts,
    isLoadingStatistics,
    debtsError,
    statisticsError,
    refetchDebts,
    refetchStatistics,
    activeDebts,
    isLoadingActiveDebts,
    activeDebtsError,
  };
};

export const useSupplierDebts = (supplierId: string) => {
  const {
    data: debts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['supplier-debts', supplierId],
    queryFn: () => getDebtsBySupplier(supplierId),
    enabled: !!supplierId,
  });

  return {
    debts,
    isLoading,
    error,
    refetch,
  };
};
