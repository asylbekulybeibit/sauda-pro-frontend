import React from 'react';
import { useParams } from 'react-router-dom';
import { SupplierDetails } from '@/components/manager/suppliers/SupplierDetails';

const SupplierDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Поставщик не найден</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Информация о поставщике</h1>
      <SupplierDetails supplierId={id} />
    </div>
  );
};

export default SupplierDetailsPage;
