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
    // Если currentShop уже есть, используем его
    if (currentShop) {
      setShop(currentShop);
      return;
    }

    // Иначе загружаем информацию о магазине по ID из URL
    if (shopId) {
      setLoading(true);
      getManagerShop(shopId)
        .then((data) => {
          setShop(data);
        })
        .catch((error) => {
          console.error('Ошибка при загрузке информации о магазине:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [shopId, currentShop]);

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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Поставщики</h1>
      <SupplierList shopId={shop?.id || currentShop?.id || shopId || ''} />
    </div>
  );
};

export default SuppliersPage;
