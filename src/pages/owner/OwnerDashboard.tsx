import { motion } from 'framer-motion';
import { useRoleStore } from '@/store/roleStore';

export default function OwnerDashboard() {
  const { currentRole } = useRoleStore();

  if (!currentRole || currentRole.type !== 'shop') {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
      </div>

      {/* Информация о магазине */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {currentRole.shop.name}
          </h3>
          <span className="text-2xl">
            {currentRole.shop.type === 'shop'
              ? '🏪'
              : currentRole.shop.type === 'warehouse'
              ? '🏭'
              : '💰'}
          </span>
        </div>
        {currentRole.shop.address && (
          <p className="text-gray-500">📍 {currentRole.shop.address}</p>
        )}
      </motion.div>

      {/* Карточки с основной информацией */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Сотрудники */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Сотрудники</h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-violet-400 mr-2"></span>
              <span className="text-gray-600">Менеджеры</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></span>
              <span className="text-gray-600">Кассиры</span>
            </div>
          </div>
        </motion.div>

        {/* Инвайты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Инвайты</h3>
            <span className="text-2xl">📨</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
              <span className="text-gray-600">Ожидают ответа</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
              <span className="text-gray-600">Приняты</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 rounded-full bg-red-400 mr-2"></span>
              <span className="text-gray-600">Отклонены</span>
            </div>
          </div>
        </motion.div>

        {/* Активность */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border-4 border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Активность</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-sm text-gray-500">
            Скоро здесь появится статистика активности
          </p>
        </motion.div>
      </div>
    </div>
  );
}
