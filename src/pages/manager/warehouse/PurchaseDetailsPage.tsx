import React, { useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import PurchaseDetails from '../../../components/manager/warehouse/PurchaseDetails';
import { ShopContext } from '@/contexts/ShopContext';
import { Card, Alert } from 'antd';

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
  // Получаем параметры из URL, включая shopId и id прихода
  const { id, shopId: shopIdFromParams } = useParams<{
    id: string;
    shopId: string;
  }>();
  const location = useLocation();
  const shopContext = useContext(ShopContext);

  // Пробуем получить shopId разными способами в порядке приоритета
  const shopIdFromPath = extractShopIdFromPath(location.pathname);
  const shopId =
    shopIdFromParams || shopIdFromPath || shopContext?.currentShop?.id;

  console.log('PurchaseDetailsPage rendered with ID param:', id);
  console.log('PurchaseDetailsPage shopId sources:', {
    fromParams: shopIdFromParams,
    fromPath: shopIdFromPath,
    fromContext: shopContext?.currentShop?.id,
    used: shopId,
  });

  if (!shopId) {
    return (
      <Card>
        <Alert
          message="Ошибка доступа"
          description="Не удалось определить ID магазина. Пожалуйста, вернитесь на страницу списка приходов и попробуйте снова."
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

  // Передаем компоненту все возможные параметры через URL
  return <PurchaseDetails />;
};

export default PurchaseDetailsPage;
