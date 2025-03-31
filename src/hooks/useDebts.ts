import { useQuery } from '@tanstack/react-query';
import {
  getDebts,
  getActiveDebts,
  getDebtsStatistics,
  getDebtsBySupplier,
} from '@/services/managerApi';

export const useDebts = (warehouseId: string) => {
  const {
    data: debts = [],
    isLoading: isLoadingDebts,
    error: debtsError,
    refetch: refetchDebts,
  } = useQuery({
    queryKey: ['debts', warehouseId],
    queryFn: () => getDebts(warehouseId),
    enabled: !!warehouseId,
  });

  const {
    data: activeDebts = [],
    isLoading: isLoadingActiveDebts,
    error: activeDebtsError,
  } = useQuery({
    queryKey: ['active-debts', warehouseId],
    queryFn: () => getActiveDebts(warehouseId),
    enabled: !!warehouseId,
  });

  const {
    data: statistics,
    isLoading: isLoadingStatistics,
    error: statisticsError,
  } = useQuery({
    queryKey: ['debts-statistics', warehouseId],
    queryFn: () => getDebtsStatistics(warehouseId),
    enabled: !!warehouseId,
  });

  return {
    debts,
    isLoadingDebts,
    debtsError,
    refetchDebts,
    activeDebts,
    isLoadingActiveDebts,
    activeDebtsError,
    statistics,
    isLoadingStatistics,
    statisticsError,
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
