import { motion } from 'framer-motion';

const statCards = [
  {
    title: 'Проекты',
    value: '150',
    change: '+12%',
    period: 'за месяц',
    icon: '🏪',
  },
  {
    title: 'Пользователи',
    value: '320',
    change: '+5%',
    period: 'за месяц',
    icon: '👥',
  },
  {
    title: 'Инвайты',
    value: '45',
    change: '28',
    period: 'активных',
    icon: '📨',
  },
];

const recentActions = [
  'Создан новый магазин "Центральный"',
  'Отправлен инвайт +7707XXXXXXX',
  'Изменена роль пользователя в "Складе №2"',
  'Добавлен новый менеджер в "Точку продаж №5"',
  'Деактивирован магазин "Старый"',
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <div className="text-sm text-gray-500">
          Последнее обновление: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  {card.title}
                </div>
                <div className="mt-1 text-3xl font-semibold">{card.value}</div>
                <div className="mt-1 text-sm text-green-600">
                  {card.change} {card.period}
                </div>
              </div>
              <div className="text-3xl">{card.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Последние действия */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Последние действия</h2>
        <div className="space-y-4">
          {recentActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4"
            >
              <div className="w-2 h-2 bg-indigo-600 rounded-full" />
              <div className="text-gray-600">{action}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
