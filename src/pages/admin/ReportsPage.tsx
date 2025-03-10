import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  getProjectStats,
  getUserStats,
  getInviteStats,
} from '@/services/api';

// Компонент статистической карточки
const StatCard = ({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-lg shadow-sm p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="mt-1 text-3xl font-semibold">{value}</div>
        {change && <div className="mt-1 text-sm text-green-600">{change}</div>}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </motion.div>
);

// Компонент диаграммы распределения
const DistributionChart = ({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number; icon: string }[];
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <span className="text-sm font-medium">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${(item.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Основной компонент страницы
export default function ReportsPage() {
  const [period, setPeriod] = useState<string>('month');

  // Запросы на получение статистики
  const { data: dashboardStats, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: getDashboardStats,
  });

  const { data: projectStats, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['stats', 'projects', period],
    queryFn: () => getProjectStats(period),
  });

  const { data: userStats, isLoading: isUsersLoading } = useQuery({
    queryKey: ['stats', 'users', period],
    queryFn: () => getUserStats(period),
  });

  const { data: inviteStats, isLoading: isInvitesLoading } = useQuery({
    queryKey: ['stats', 'invites', period],
    queryFn: () => getInviteStats(period),
  });

  const isLoading =
    isDashboardLoading ||
    isProjectsLoading ||
    isUsersLoading ||
    isInvitesLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Отчеты</h1>
        <select
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="week">За неделю</option>
          <option value="month">За месяц</option>
          <option value="year">За год</option>
        </select>
      </div>

      {/* Основные показатели */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Проекты"
          value={projectStats?.total || 0}
          change={`${projectStats?.active || 0} активных`}
          icon="🏪"
        />
        <StatCard
          title="Пользователи"
          value={userStats?.total || 0}
          change={`${userStats?.active || 0} активных`}
          icon="👥"
        />
        <StatCard
          title="Инвайты"
          value={inviteStats?.total || 0}
          change={`${inviteStats?.pending || 0} ожидают`}
          icon="📨"
        />
      </div>

      {/* Распределение по типам */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Распределение проектов */}
        <DistributionChart
          title="Распределение проектов"
          data={[
            {
              label: 'Магазины',
              value: projectStats?.byType.shop || 0,
              icon: '🏪',
            },
            {
              label: 'Склады',
              value: projectStats?.byType.warehouse || 0,
              icon: '🏭',
            },
            {
              label: 'Точки продаж',
              value: projectStats?.byType.point_of_sale || 0,
              icon: '🏢',
            },
          ]}
        />

        {/* Распределение пользователей по ролям */}
        <DistributionChart
          title="Распределение пользователей"
          data={[
            {
              label: 'Владельцы',
              value: userStats?.byRole.owner || 0,
              icon: '👔',
            },
            {
              label: 'Менеджеры',
              value: userStats?.byRole.manager || 0,
              icon: '👨‍💼',
            },
            {
              label: 'Кассиры',
              value: userStats?.byRole.cashier || 0,
              icon: '💰',
            },
          ]}
        />
      </div>

      {/* Последние действия */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Последние действия</h3>
        <div className="space-y-4">
          {dashboardStats?.recentActions.map((action) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              <div className="flex-1">
                <div className="text-sm text-gray-600">{action.action}</div>
                <div className="text-xs text-gray-500">
                  {new Date(action.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {action.user.name || action.user.phone}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
