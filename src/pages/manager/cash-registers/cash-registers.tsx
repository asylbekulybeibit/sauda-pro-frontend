import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Spin, message } from 'antd';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import CashRegisterList from '@/components/manager/cash-registers/CashRegisterList';
import CreateCashRegisterModal from '@/components/manager/cash-registers/CreateCashRegisterModal';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { PaymentMethodSource } from '@/types/cash-register';
import { CashRegisterType, PaymentMethodType } from '@/types/cash-register';
import { useRoleStore } from '@/store/roleStore';

interface CustomPaymentMethod {
  name: string;
  code: string;
  description?: string;
}

interface FormValues {
  name: string;
  type: CashRegisterType;
  location?: string;
  systemPaymentMethods: PaymentMethodType[];
  customPaymentMethods?: CustomPaymentMethod[];
}

export default function CashRegistersPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  // Получаем ID склада из текущей роли менеджера
  useEffect(() => {
    if (currentRole && currentRole.type === 'shop' && currentRole.warehouse) {
      setWarehouseId(currentRole.warehouse.id);
      console.log(
        '[CashRegistersPage] Установлен ID склада:',
        currentRole.warehouse.id
      );
    }
  }, [currentRole]);

  const {
    data: registers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['cash-registers', warehouseId],
    queryFn: () =>
      warehouseId ? cashRegistersApi.getAll(warehouseId) : Promise.resolve([]),
    enabled: !!warehouseId,
  });

  const handleCreateSuccess = async (values: FormValues) => {
    try {
      setIsCreateModalOpen(false);
      refetch();
      message.success('Касса успешно создана');
    } catch (error) {
      message.error('Не удалось создать кассу');
    }
  };

  if (!warehouseId) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" tip="Загрузка данных о складе..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Управление кассами</h1>
        <Button
          type="primary"
          icon={<BanknotesIcon className="h-5 w-5" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500"
        >
          Добавить кассу
        </Button>
      </div>

      {registers && (
        <CashRegisterList
          registers={registers}
          isLoading={isLoading}
          onStatusChange={refetch}
          onDelete={refetch}
          warehouseId={warehouseId}
        />
      )}

      <CreateCashRegisterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        warehouseId={warehouseId}
      />
    </div>
  );
}
