import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SupplierList } from '@/components/manager/suppliers/SupplierList';
import { useShop } from '@/hooks/useShop';
import { getManagerShop } from '@/services/managerApi';
import { Shop } from '@/types/shop';
import { Spin } from 'antd';

const SuppliersPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentShop } = useShop();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Если currentShop уже есть, используем его
      if (currentShop) {
        console.log('Используем текущий магазин из контекста:', currentShop);
        setShop(currentShop);
        return;
      }

      // Если нет currentShop, но есть shopId, загружаем информацию о магазине
      if (shopId) {
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
    };

    loadData();
  }, [shopId, currentShop]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!shop && !currentShop && !shopId) {
    return <div>Магазин не выбран</div>;
  }

  const effectiveShopId = shop?.id || currentShop?.id || shopId || '';
  console.log(`Рендеринг списка поставщиков для магазина: ${effectiveShopId}`);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Поставщики</h1>
      <SupplierList shopId={effectiveShopId} />
    </div>
  );
};

export default SuppliersPage;
