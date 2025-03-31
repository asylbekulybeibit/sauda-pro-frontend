import { FC, useState } from 'react';
import { message, Spin } from 'antd';
import { useRoleStore } from '@/store/roleStore';
import { DebtsList } from '@/components/manager/debts/DebtsList';
import { DebtPaymentModal } from '@/components/manager/debts/DebtPaymentModal';
import { useGetPaymentMethods } from '@/hooks/usePaymentMethods';
import { Debt } from '@/types/debt';
import { UserRoleDetails } from '@/types/role';
import { cancelDebt } from '@/services/managerApi';
import { useDebts } from '@/hooks/useDebts';

const DebtsPage: FC = () => {
  const { currentRole } = useRoleStore();
  console.log('[DebtsPage] Current role:', currentRole);

  // Получаем warehouseId из warehouse объекта или из warehouseId поля
  const warehouseId =
    (currentRole as UserRoleDetails)?.warehouse?.id ||
    (currentRole as UserRoleDetails)?.warehouseId;
  console.log('[DebtsPage] Warehouse ID:', warehouseId);

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } =
    useGetPaymentMethods(warehouseId || '');

  const {
    debts = [],
    statistics,
    isLoadingDebts,
    refetchDebts,
    refetchStatistics,
  } = useDebts(warehouseId || '');

  console.log('[DebtsPage] Payment methods loading:', isLoadingPaymentMethods);
  console.log('[DebtsPage] Payment methods:', paymentMethods);

  const handlePaymentClick = async (debt: Debt) => {
    console.log('[DebtsPage] Payment clicked for debt:', debt);
    setSelectedDebt(debt);
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = async () => {
    // Обновляем данные после успешной оплаты
    await Promise.all([refetchDebts(), refetchStatistics()]);
  };

  if (!currentRole) {
    console.log('[DebtsPage] No current role, showing loading message');
    return <div>Загрузка данных пользователя...</div>;
  }

  if (!warehouseId) {
    console.log('[DebtsPage] No warehouse ID, showing access denied message');
    return <div>Нет доступа к складу</div>;
  }

  if (isLoadingPaymentMethods) {
    console.log('[DebtsPage] Loading payment methods, showing spinner');
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  console.log('[DebtsPage] Rendering page with warehouse ID:', warehouseId);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Долги</h1>
      <DebtsList
        warehouseId={warehouseId}
        onPaymentClick={handlePaymentClick}
        onCancelClick={() => {}} // Пустая функция, так как функционал отмены убран
      />
      {selectedDebt && (
        <DebtPaymentModal
          debt={selectedDebt}
          visible={paymentModalVisible}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedDebt(null);
          }}
          onSuccess={handlePaymentSuccess}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

export default DebtsPage;
