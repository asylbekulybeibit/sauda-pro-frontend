import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CloseCircleOutlined,
  PieChartOutlined,
} from '@ant-design/icons';

interface DesktopSidebarProps {
  shopId?: string;
}

/**
 * Компонент боковой навигации для десктопной версии панели кассира
 */
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ shopId }) => {
  if (!shopId) return null;

  // Определяем базовый путь для маршрутов
  const basePath = `/cashier/${shopId}`;

  // Список пунктов навигации (строго по ТЗ)
  const navItems = [
    {
      title: 'Начать услугу',
      path: `${basePath}/select-service`,
      icon: <PlayCircleOutlined />,
    },
    {
      title: 'Активные услуги',
      path: `${basePath}/active-services`,
      icon: <DollarOutlined />,
    },
    {
      title: 'Завершённые услуги',
      path: `${basePath}/completed-services`,
      icon: <CheckCircleOutlined />,
    },
    {
      title: 'Цены услуг',
      path: `${basePath}/service-prices`,
      icon: <PieChartOutlined />,
    },
    {
      title: 'Закрытие смены',
      path: `${basePath}/close-shift`,
      icon: <CloseCircleOutlined />,
    },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200">
      {/* Логотип и заголовок */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">SaudaPro</h2>
        <p className="text-sm text-gray-500">Панель кассира</p>
      </div>

      {/* Навигационные ссылки */}
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`
                }
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default DesktopSidebar;
