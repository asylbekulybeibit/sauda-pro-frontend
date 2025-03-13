import { Product } from '@/types/product';
import { InventoryTransaction } from '@/types/inventory';
import { UserRole } from '@/types/role';
import {
  CubeIcon,
  CashIcon,
  UserGroupIcon,
  TrendingUpIcon,
} from '@heroicons/react/outline';

interface DashboardStatsProps {
  products: Product[];
  inventory: InventoryTransaction[];
  staff: UserRole[];
}

export function DashboardStats({
  products,
  inventory,
  staff,
}: DashboardStatsProps) {
  // Подсчет статистики
  const totalProducts = products.length;
  const totalSales = inventory
    .filter((t) => t.type === 'SALE')
    .reduce((sum, t) => sum + (t.price || 0) * t.quantity, 0);
  const activeStaff = staff.filter((s) => s.isActive).length;
  const averageCheck =
    inventory.filter((t) => t.type === 'SALE').length > 0
      ? totalSales / inventory.filter((t) => t.type === 'SALE').length
      : 0;

  const stats = [
    {
      name: 'Всего товаров',
      value: totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Продажи за сегодня',
      value: `${totalSales.toLocaleString()} ₸`,
      icon: CashIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Активных сотрудников',
      value: activeStaff,
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Средний чек',
      value: `${averageCheck.toLocaleString()} ₸`,
      icon: TrendingUpIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.name}
          className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
        >
          <dt>
            <div className={`absolute rounded-md p-3 ${item.color}`}>
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 truncate">
              {item.name}
            </p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
          </dd>
        </div>
      ))}
    </div>
  );
}
