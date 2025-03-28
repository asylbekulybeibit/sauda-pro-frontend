import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Divider } from 'antd';
import { ClientsList } from '@/components/manager/clients/ClientsList';
import { useRoleStore } from '@/store/roleStore';

function ClientsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  // Получаем ID склада из текущей роли менеджера
  useEffect(() => {
    if (currentRole && currentRole.type === 'shop' && currentRole.warehouse) {
      setWarehouseId(currentRole.warehouse.id);
    }
  }, [currentRole]);

  if (!shopId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Магазин не выбран</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Клиенты</h1>

        {currentRole?.type === 'shop' && currentRole.warehouse && (
          <div className="text-gray-600">
            Склад: {currentRole.warehouse.name}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ClientsList shopId={shopId} warehouseId={warehouseId} />
      </div>
    </div>
  );
}

export default ClientsPage;
