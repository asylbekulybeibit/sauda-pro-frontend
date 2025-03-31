import { FC, useState } from 'react';
import { message } from 'antd';
import { useRoleStore } from '@/store/roleStore';
import { DebtsList } from '@/components/manager/debts/DebtsList';
import { DebtPaymentModal } from '@/components/manager/debts/DebtPaymentModal';
import { useGetPaymentMethods } from '@/hooks/usePaymentMethods';
import { Debt } from '@/types/debt';
import { UserRoleDetails } from '@/types/role';
import { cancelDebt } from '@/services/managerApi';

const DebtsPage: FC = () => {
  const { currentRole } = useRoleStore();
  const warehouseId = (currentRole as UserRoleDetails)?.warehouseId;
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } =
    useGetPaymentMethods(warehouseId || '');

  const handlePaymentClick = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentModalVisible(true);
  };

  const handleCancelClick = async (debt: Debt) => {
    try {
      await cancelDebt(debt.id);
      message.success('Долг успешно отменен');
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Ошибка при отмене долга'
      );
    }
  };

  if (!warehouseId) {
    return <div>Нет доступа к складу</div>;
  }

  if (isLoadingPaymentMethods) {
    return <div>Загрузка методов оплаты...</div>;
  }

  return (
    <div>
      <h1>Долги</h1>
      <DebtsList
        warehouseId={warehouseId}
        onPaymentClick={handlePaymentClick}
        onCancelClick={handleCancelClick}
      />
      {selectedDebt && (
        <DebtPaymentModal
          debt={selectedDebt}
          visible={paymentModalVisible}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedDebt(null);
          }}
          onSuccess={() => {
            setPaymentModalVisible(false);
            setSelectedDebt(null);
          }}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

export default DebtsPage;
