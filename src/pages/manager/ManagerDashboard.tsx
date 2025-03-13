import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  getProducts,
  getLowStockProducts,
  getInventory,
  getStaff,
  getPromotions,
} from '@/services/managerApi';
import { DashboardStats } from '@/components/manager/dashboard/DashboardStats';
import { SalesChart } from '@/components/manager/dashboard/SalesChart';
import { LowStockList } from '@/components/manager/dashboard/LowStockList';
import { ActivePromotions } from '@/components/manager/dashboard/ActivePromotions';

export default function ManagerDashboard() {
  const { shopId } = useParams();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['low-stock', shopId],
    queryFn: () => getLowStockProducts(shopId!),
    enabled: !!shopId,
  });

  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory', shopId],
    queryFn: () => getInventory(shopId!),
    enabled: !!shopId,
  });

  const { data: staff, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff', shopId],
    queryFn: () => getStaff(shopId!),
    enabled: !!shopId,
  });

  const { data: promotions, isLoading: isLoadingPromotions } = useQuery({
    queryKey: ['promotions', shopId],
    queryFn: () => getPromotions(shopId!),
    enabled: !!shopId,
  });

  if (
    isLoadingProducts ||
    isLoadingLowStock ||
    isLoadingInventory ||
    isLoadingStaff ||
    isLoadingPromotions
  ) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
      </div>

      {/* Статистика */}
      <DashboardStats
        products={products || []}
        inventory={inventory || []}
        staff={staff || []}
      />

      {/* Графики и списки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График продаж */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Статистика продаж
          </h2>
          <SalesChart transactions={inventory || []} />
        </div>

        {/* Товары с низким остатком */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Товары с низким остатком
          </h2>
          <LowStockList products={lowStockProducts || []} />
        </div>

        {/* Активные акции */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Активные акции
          </h2>
          <ActivePromotions promotions={promotions || []} />
        </div>
      </div>
    </div>
  );
}
