import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { SupplierForm } from '@/components/manager/suppliers/SupplierForm';
import {
  getSupplierById,
  getManagerShop,
  getWarehouses,
} from '@/services/managerApi';
import { Supplier } from '@/types/supplier';
import { useShop } from '@/hooks/useShop';
import { ApiErrorHandler } from '@/utils/error-handler';
import { Shop } from '@/types/shop';
import { useRoleStore } from '@/store/roleStore';
import { Warehouse } from '@/services/managerApi';

const SupplierFormPage: React.FC = () => {
  const {
    id,
    shopId,
    warehouseId: urlWarehouseId,
  } = useParams<{ id: string; shopId: string; warehouseId: string }>();
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const { currentRole } = useRoleStore();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [shopLoading, setShopLoading] = useState(false);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // Получаем ID склада текущего менеджера или из URL
  const warehouseId =
    urlWarehouseId ||
    (currentRole?.type === 'shop' ? currentRole.warehouse?.id : undefined);
  const warehouseName =
    warehouse?.name ||
    (currentRole?.type === 'shop' ? currentRole.warehouse?.name : '');

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

  // Загружаем информацию о складе, если ID склада доступен
  useEffect(() => {
    if (!shopId || !warehouseId) return;

    setWarehousesLoading(true);
    getWarehouses(shopId)
      .then((warehouses) => {
        const foundWarehouse = warehouses.find((w) => w.id === warehouseId);
        if (foundWarehouse) {
          setWarehouse(foundWarehouse);
        }
      })
      .catch((error) => {
        console.error('Ошибка при загрузке информации о складе:', error);
      })
      .finally(() => {
        setWarehousesLoading(false);
      });
  }, [shopId, warehouseId]);

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

  if (shopLoading || loading || warehousesLoading) {
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
