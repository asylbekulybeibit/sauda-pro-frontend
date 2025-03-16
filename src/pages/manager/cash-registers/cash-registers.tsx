import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Spin, message } from 'antd';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import CashRegisterList from '@/components/manager/cash-registers/CashRegisterList';
import CreateCashRegisterModal from '@/components/manager/cash-registers/CreateCashRegisterModal';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { PaymentMethodSource } from '@/types/cash-register';
import { CashRegisterType, PaymentMethodType } from '@/types/cash-register';

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

  const {
    data: registers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['cash-registers', shopId],
    queryFn: () => cashRegistersApi.getAll(shopId!),
    enabled: !!shopId,
  });

  const handleCreateSuccess = async (values: FormValues) => {
    try {
      // Преобразуем значения формы в формат DTO
      const paymentMethods = [
        // Системные методы оплаты
        ...values.systemPaymentMethods.map((type) => ({
          source: PaymentMethodSource.SYSTEM,
          systemType: type,
          isActive: true,
        })),
        // Кастомные методы оплаты
        ...(values.customPaymentMethods || []).map((method) => ({
          source: PaymentMethodSource.CUSTOM,
          name: method.name,
          code: method.code,
          description: method.description,
          isActive: true,
        })),
      ];

      await cashRegistersApi.create(shopId!, {
        name: values.name,
        type: values.type,
        location: values.location,
        paymentMethods,
      });
      setIsCreateModalOpen(false);
      refetch();
      message.success('Касса успешно создана');
    } catch (error) {
      message.error('Не удалось создать кассу');
    }
  };

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
          shopId={shopId!}
        />
      )}

      <CreateCashRegisterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        shopId={shopId!}
      />
    </div>
  );
}
