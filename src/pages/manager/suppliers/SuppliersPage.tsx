import React from 'react';
import { useParams } from 'react-router-dom';
import { SupplierList } from '@/components/manager/suppliers/SupplierList';
import { Card, Spin } from 'antd';

const SuppliersPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return <div>Магазин не выбран</div>;
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
