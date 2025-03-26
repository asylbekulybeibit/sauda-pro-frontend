import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'react-router-dom';
import {
  getStaff,
  getStaffByWarehouse,
  getEmployeesByWarehouse,
} from '@/services/managerApi';
import { StaffList } from '@/components/manager/staff/StaffList';
import { EmployeesList } from '@/components/manager/staff/EmployeesList';
import { CreateInviteForm as InviteForm } from '@/components/manager/staff/InviteForm';
import { Spin, Divider } from 'antd';
import { useRoleStore } from '@/store/roleStore';

function StaffPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  // Получаем ID склада из текущей роли менеджера
  useEffect(() => {
    if (currentRole && currentRole.type === 'shop' && currentRole.warehouse) {
      setWarehouseId(currentRole.warehouse.id);
      console.log('Установлен ID склада:', currentRole.warehouse.id);
    }
  }, [currentRole]);

  // Загружаем системных пользователей
  const {
    data: staffRoles,
    isLoading: isLoadingStaff,
    error,
  } = useQuery({
    queryKey: ['staff', shopId, warehouseId],
    queryFn: () =>
      warehouseId && shopId
        ? getStaffByWarehouse(shopId, warehouseId)
        : getStaff(shopId!),
    enabled: !!shopId && !!warehouseId,
  });

  // Для отладки
  useEffect(() => {
    console.log(`[StaffPage] warehouseId:`, warehouseId);
    console.log(`[StaffPage] shopId:`, shopId);
    console.log(`[StaffPage] currentRole:`, currentRole);
  }, [warehouseId, shopId, currentRole]);

  if (!warehouseId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Загрузка данных о складе...</p>
        </div>
      </div>
    );
  }

  if (isLoadingStaff) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Произошла ошибка при загрузке данных
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Управление персоналом
        </h1>

        {currentRole?.type === 'shop' && currentRole.warehouse && (
          <div className="text-gray-600">
            Склад: {currentRole.warehouse.name}
          </div>
        )}
      </div>

      {/* Секция системных пользователей */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Системные пользователи</h2>
        <StaffList
          roles={staffRoles || []}
          shopId={shopId!}
          warehouseId={warehouseId}
        />
      </div>

      <Divider />

      {/* Секция сотрудников-мастеров */}
      <div className="mt-8">
        <EmployeesList shopId={shopId!} warehouseId={warehouseId} />
      </div>

      {isInviteModalOpen && (
        <InviteForm
          onClose={() => setIsInviteModalOpen(false)}
          predefinedShopId={shopId!}
          warehouseId={warehouseId}
        />
      )}
    </div>
  );
}

export default StaffPage;
