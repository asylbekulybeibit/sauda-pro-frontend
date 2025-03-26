import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SupplierList } from '@/components/manager/suppliers/SupplierList';
import { useShop } from '@/hooks/useShop';
import { getManagerShop, getWarehouses } from '@/services/managerApi';
import { Shop } from '@/types/shop';
import { Spin } from 'antd';
import { Warehouse } from '@/types/warehouse';

const SuppliersPage: React.FC = () => {
  const { shopId, warehouseId } = useParams<{
    shopId: string;
    warehouseId: string;
  }>();
  const { currentShop } = useShop();
  const [shop, setShop] = useState<Shop | null>(null);
  const [warehouseName, setWarehouseName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Добавляем логи при монтировании компонента и при изменении параметров URL
  useEffect(() => {
    console.log('=== ИНФОРМАЦИЯ О СТРАНИЦЕ ПОСТАВЩИКОВ ===');
    console.log('Параметры URL:', { shopId, warehouseId });
    console.log('Текущий магазин:', currentShop);
    console.log('Текущий склад магазина:', currentShop?.warehouse);
    console.log('==========================================');
  }, [shopId, warehouseId, currentShop]);

  useEffect(() => {
    const loadData = async () => {
      console.log('Загрузка данных на странице поставщиков...');

      // Если currentShop уже есть, используем его
      if (currentShop) {
        console.log('Используем текущий магазин из контекста:', currentShop);
        setShop(currentShop);
      } else if (shopId) {
        // Иначе загружаем информацию о магазине по ID из URL
        console.log(`Загрузка информации о магазине по ID: ${shopId}`);
        setLoading(true);
        try {
          const shopData = await getManagerShop(shopId);
          console.log('Получены данные магазина:', shopData);
          setShop(shopData);
        } catch (error) {
          console.error('Ошибка при загрузке информации о магазине:', error);
        } finally {
          setLoading(false);
        }
      }

      // Получаем информацию о складе, если есть warehouseId
      if (warehouseId && shopId) {
        console.log(`Загрузка информации о складе: ${warehouseId}`);
        try {
          const warehouses = await getWarehouses(shopId);
          console.log('Получен список складов:', warehouses);

          const warehouse = warehouses.find(
            (w: Warehouse) => w.id === warehouseId
          );
          if (warehouse) {
            console.log('Найден склад:', warehouse);
            setWarehouseName(warehouse.name);
          } else {
            console.warn(
              `Склад с ID ${warehouseId} не найден в списке складов`
            );
          }
        } catch (error) {
          console.error('Ошибка при загрузке информации о складе:', error);
        }
      } else {
        console.log(
          'warehouseId не указан в URL, информация о складе не загружена'
        );
      }
    };

    loadData();
  }, [shopId, warehouseId, currentShop]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!shop && !currentShop) {
    return <div>Магазин не выбран</div>;
  }

  const effectiveShopId = shop?.id || currentShop?.id || shopId || '';
  console.log(`Рендеринг списка поставщиков для магазина: ${effectiveShopId}`);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Поставщики
        {warehouseName ? ` - Склад: ${warehouseName} (ID: ${warehouseId})` : ''}
      </h1>
      <SupplierList shopId={effectiveShopId} />
    </div>
  );
};

export default SuppliersPage;
