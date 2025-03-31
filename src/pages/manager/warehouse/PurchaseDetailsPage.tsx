import React, { useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PurchaseDetails from '../../../components/manager/warehouse/PurchaseDetails';
import { ShopContext } from '@/contexts/ShopContext';
import { Card, Alert, Spin } from 'antd';
import { getPurchaseById } from '@/services/managerApi';
import { useGetPaymentMethods } from '@/hooks/usePaymentMethods';
import { useRoleStore } from '@/store/roleStore';
import { UserRoleDetails } from '@/types/role';

// Хелпер-функция для извлечения shopId из URL
const extractShopIdFromPath = (path: string): string | null => {
  // Формат: /manager/{shopId}/warehouse/purchases/{id}
  const match = path.match(/\/manager\/([^\/]+)\/warehouse\/purchases/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

const PurchaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentRole } = useRoleStore();

  // Получаем warehouseId из текущей роли
  const warehouseId =
    (currentRole as UserRoleDetails)?.warehouse?.id ||
    (currentRole as UserRoleDetails)?.warehouseId;

  console.log('PurchaseDetailsPage rendered with:', {
    id,
    warehouseId,
    currentRole,
  });

  // Получаем данные о приходе
  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    error: purchaseError,
    refetch: refetchPurchase,
  } = useQuery({
    queryKey: ['purchase', id, warehouseId],
    queryFn: () => getPurchaseById(id!, warehouseId!),
    enabled: !!id && !!warehouseId,
  });

  // Получаем методы оплаты
  const {
    data: paymentMethods = [],
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError,
  } = useGetPaymentMethods(warehouseId || '');

  if (!warehouseId) {
    return (
      <Card>
        <Alert
          message="Ошибка доступа"
          description="Не удалось определить ID склада. Пожалуйста, проверьте ваши права доступа."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!id) {
    return (
      <Card>
        <Alert
          message="Ошибка доступа"
          description="Не указан ID прихода. Пожалуйста, вернитесь на страницу списка приходов и выберите приход."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (isLoadingPurchase || isLoadingPaymentMethods) {
    return (
      <Card>
        <div className="flex justify-center items-center p-8">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (purchaseError) {
    return (
      <Card>
        <Alert
          message="Ошибка загрузки"
          description="Не удалось загрузить данные о приходе. Пожалуйста, попробуйте позже."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (paymentMethodsError) {
    return (
      <Card>
        <Alert
          message="Ошибка загрузки"
          description="Не удалось загрузить методы оплаты. Пожалуйста, попробуйте позже."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <PurchaseDetails
      purchase={purchase}
      paymentMethods={paymentMethods}
      onClose={() => window.history.back()}
      onUpdate={refetchPurchase}
    />
  );
};

export default PurchaseDetailsPage;
