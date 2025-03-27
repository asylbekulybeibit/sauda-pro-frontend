import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SupplierDetails } from '@/components/manager/suppliers/SupplierDetails';
import { useRoleStore } from '@/store/roleStore';
import { getWarehouses, Warehouse } from '@/services/managerApi';

const SupplierDetailsPage: React.FC = () => {
  const {
    id,
    shopId,
    warehouseId: urlWarehouseId,
  } = useParams<{ id: string; shopId: string; warehouseId: string }>();
  const { currentRole } = useRoleStore();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);

  // Получаем ID склада текущего менеджера или из URL
  const warehouseId =
    urlWarehouseId ||
    (currentRole?.type === 'shop' ? currentRole.warehouse?.id : undefined);
  const warehouseName =
    warehouse?.name ||
    (currentRole?.type === 'shop' ? currentRole.warehouse?.name : '');

  useEffect(() => {
    if (shopId && warehouseId) {
      // Загружаем информацию о складе
      getWarehouses(shopId)
        .then((warehouses) => {
          const foundWarehouse = warehouses.find((w) => w.id === warehouseId);
          if (foundWarehouse) {
            setWarehouse(foundWarehouse);
          }
        })
        .catch((error) => {
          console.error('Ошибка при загрузке информации о складе:', error);
        });
    }
  }, [shopId, warehouseId]);

  if (!id) {
    return <div>Поставщик не найден</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Информация о поставщике
      
      </h1>
      <SupplierDetails supplierId={id} />
    </div>
  );
};

export default SupplierDetailsPage;
