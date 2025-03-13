import React from 'react';
import { useParams } from 'react-router-dom';
import { SupplierDetails } from '@/components/manager/suppliers/SupplierDetails';

export const SupplierDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Поставщик не найден</div>;
  }

  return (
    <div>
      <SupplierDetails supplierId={id} />
    </div>
  );
};
