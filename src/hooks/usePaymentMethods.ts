import { useQuery } from '@tanstack/react-query';
import { useRoleStore } from '@/store/roleStore';
import { UserRoleDetails } from '@/types/role';
import { RegisterPaymentMethod } from '@/types/cash-register';
import { cashRegistersApi } from '@/services/cashRegistersApi';

export const useGetPaymentMethods = (warehouseId: string) => {
  const { currentRole } = useRoleStore();
  const shopId = (currentRole as UserRoleDetails)?.shopId;

  return useQuery<RegisterPaymentMethod[]>({
    queryKey: ['paymentMethods', warehouseId],
    queryFn: () => cashRegistersApi.getAllPaymentMethods(warehouseId),
    enabled: !!warehouseId,
  });
};
