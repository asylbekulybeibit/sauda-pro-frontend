import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { SupplierForm } from '@/components/manager/suppliers/SupplierForm';
import { getSupplierById, getManagerShop } from '@/services/managerApi';
import { Supplier } from '@/types/supplier';
import { useShop } from '@/hooks/useShop';
import { ApiErrorHandler } from '@/utils/error-handler';
import { Shop } from '@/types/shop';

const SupplierFormPage: React.FC = () => {
  const { id, shopId } = useParams<{ id: string; shopId: string }>();
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);

  // Загружаем информацию о магазине, если currentShop не доступен
  useEffect(() => {
    if (currentShop) {
      setShop(currentShop);
      return;
    }

    if (shopId) {
      setShopLoading(true);
      getManagerShop(shopId)
        .then((data) => {
          setShop(data);
        })
        .catch((error) => {
          console.error('Ошибка при загрузке информации о магазине:', error);
          message.error('Не удалось загрузить информацию о магазине');
        })
        .finally(() => {
          setShopLoading(false);
        });
    }
  }, [shopId, currentShop]);

  // Загружаем информацию о поставщике, если есть id
  const fetchSupplier = useCallback(async () => {
    if (!id || !shopId) return;

    try {
      setLoading(true);
      const data = await getSupplierById(id, shopId);
      setSupplier(data);
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      if (ApiErrorHandler.isNotFoundError(apiError)) {
        message.error('Поставщик не найден');
        // Редирект на список поставщиков
        navigate(`/manager/${shopId}/suppliers`);
      } else {
        message.error(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, shopId, navigate]);

  useEffect(() => {
    if (id && shopId) {
      fetchSupplier();
    }
  }, [id, shopId, fetchSupplier]);

  if (shopLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!shop && !currentShop) {
    return <div>Магазин не выбран</div>;
  }

  const actualShopId = shop?.id || currentShop?.id || shopId || '';

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        {id ? 'Редактирование поставщика' : 'Новый поставщик'}
      </h1>
      <SupplierForm
        shopId={actualShopId}
        initialData={supplier || undefined}
        onSuccess={() => {
          navigate(`/manager/${actualShopId}/suppliers`);
          message.success(
            id ? 'Поставщик успешно обновлен' : 'Поставщик успешно создан'
          );
        }}
      />
    </div>
  );
};

export default SupplierFormPage;
