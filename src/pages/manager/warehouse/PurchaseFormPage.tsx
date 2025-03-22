import React, { useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Alert, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import PurchaseForm from '../../../components/manager/warehouse/PurchaseForm';
import { ShopContext } from '@/contexts/ShopContext';
import { getPurchaseById } from '@/services/managerApi';

const PurchaseFormPage: React.FC = () => {
  // Получаем параметры из URL, включая shopId из пути
  const { id, shopId: shopIdFromPath } = useParams<{
    id: string;
    shopId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const shopContext = useContext(ShopContext);

  // Для обратной совместимости также получаем shopId из URL query параметра
  const searchParams = new URLSearchParams(location.search);
  const shopIdFromQuery = searchParams.get('shopId');

  console.log('PurchaseFormPage rendered with ID param:', id);
  console.log('PurchaseFormPage shopId sources:', {
    fromPath: shopIdFromPath,
    fromQuery: shopIdFromQuery,
    fromContext: shopContext?.currentShop?.id,
  });

  // Приоритет: 1) shopId из пути URL, 2) shopId из query параметра, 3) shopId из контекста
  const shopId =
    shopIdFromPath || shopIdFromQuery || shopContext?.currentShop?.id || '';

  // Проверка статуса прихода, если это режим редактирования
  const {
    data: purchase,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchase', id, shopId],
    queryFn: () => getPurchaseById(id!, shopId),
    enabled: !!id && !!shopId,
  });

  // Если загружаем существующий приход
  if (id) {
    // Показываем индикатор загрузки
    if (isLoading) {
      return (
        <Card className="max-w-6xl mx-auto p-6">
          <div className="text-center py-8">
            <Spin tip="Загрузка данных прихода..." />
          </div>
        </Card>
      );
    }

    // Обрабатываем ошибку
    if (error) {
      return (
        <Card className="max-w-6xl mx-auto p-6">
          <Alert
            message="Ошибка загрузки"
            description="Не удалось загрузить данные прихода. Пожалуйста, попробуйте позже."
            type="error"
            showIcon
          />
        </Card>
      );
    }

    // Проверяем статус прихода
    if (purchase && purchase.status === 'completed') {
      return (
        <Card className="max-w-6xl mx-auto p-6">
          <Alert
            message="Редактирование невозможно"
            description="Этот приход уже завершен и не может быть отредактирован."
            type="warning"
            showIcon
            action={
              <a
                onClick={() => {
                  if (shopId) {
                    navigate(`/manager/${shopId}/warehouse/purchases/${id}`);
                  } else {
                    navigate(`/manager/warehouse/purchases/${id}`);
                  }
                }}
              >
                Вернуться к деталям прихода
              </a>
            }
          />
        </Card>
      );
    }
  }

  return <PurchaseForm id={id} shopId={shopId} />;
};

export default PurchaseFormPage;
