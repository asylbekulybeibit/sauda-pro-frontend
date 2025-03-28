import React from 'react';
import { useParams } from 'react-router-dom';
import { SupplierList } from '@/components/manager/suppliers/SupplierList';
import { useQuery } from '@tanstack/react-query';
import { getManagerShop } from '@/services/managerApi';
import { Spin, Card } from 'antd';

const SuppliersPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getManagerShop(shopId!),
    enabled: !!shopId,
  });

  if (!shopId) {
    return <div>Магазин не выбран</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Поставщики</h1>
      </div>

      <Card className="shadow-sm">
        <SupplierList shopId={shopId} />
      </Card>
    </div>
  );
};

export default SuppliersPage;
