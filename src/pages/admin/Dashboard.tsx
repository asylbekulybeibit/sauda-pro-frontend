import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/api';
import { DashboardStats } from '@/types/dashboard';
import { RoleType } from '@/types/role';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Панель управления
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-sm animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Проекты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Проекты</h3>
            <span className="text-2xl">🏪</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-2">
            {stats.shops.total}
          </p>
          <p className="text-sm text-green-600">
            +{stats.shops.growth}% за месяц
          </p>
        </motion.div>

        {/* Пользователи */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Пользователи</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-2">
            {stats.users.total}
          </p>
          <p className="text-sm text-green-600">
            +{stats.users.growth}% за месяц
          </p>
        </motion.div>

        {/* Инвайты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Инвайты</h3>
            <span className="text-2xl">📨</span>
          </div>
          <div className="text-3xl font-bold mb-4">{stats.invites.total}</div>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
              <span className="text-gray-600">Активные:</span>
              <span className="ml-auto font-medium">
                {stats.invites.pending}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
              <span className="text-gray-600">Принято:</span>
              <span className="ml-auto font-medium">
                {stats.invites.accepted}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>
              <span className="text-gray-600">Отклонено:</span>
              <span className="ml-auto font-medium">
                {stats.invites.rejected}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
              <span className="text-gray-600">Отменено:</span>
              <span className="ml-auto font-medium">
                {stats.invites.cancelled}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Суперадмины */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Суперадмины</h3>
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-2">
            {stats.users.superadmins}
          </p>
          <p className="text-sm text-gray-500">
            {Math.round((stats.users.superadmins / stats.users.total) * 100)}%
            от общего числа
          </p>
        </motion.div>
      </div>

      {/* Распределение магазинов */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Распределение магазинов
        </h3>
        <div className="space-y-4">
          {stats.shops.byType &&
            Object.entries(stats.shops.byType).map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${(count / stats.shops.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </motion.div>

      {/* Распределение пользователей */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Распределение пользователей
        </h3>
        <div className="space-y-4">
          {stats.users.byRole &&
            Object.entries(stats.users.byRole).map(([role, count]) => (
              <div key={role}>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>
                    {role === RoleType.OWNER && '👑 Владелец'}
                    {role === RoleType.MANAGER && '👔 Менеджер'}
                    {role === RoleType.CASHIER && '💰 Кассир'}
                  </span>
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${(count / stats.users.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}
