import React from 'react';
import { SupplierList } from '@/components/manager/suppliers/SupplierList';
import { useShop } from '@/hooks/useShop';

export const SuppliersPage: React.FC = () => {
  const { currentShop } = useShop();

  if (!currentShop) {
    return <div>Магазин не выбран</div>;
  }

  return (
    <div>
      <SupplierList shopId={currentShop.id} />
    </div>
  );
};
