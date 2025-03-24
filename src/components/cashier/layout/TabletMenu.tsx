import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CloseCircleOutlined,
  PieChartOutlined,
} from '@ant-design/icons';

interface TabletMenuProps {
  shopId?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Выдвижное меню для планшетной версии панели кассира
 */
const TabletMenu: React.FC<TabletMenuProps> = ({ shopId, isOpen, onClose }) => {
  if (!shopId) return null;

  // Базовый путь для маршрутов
  const basePath = `/cashier/${shopId}`;

  // Список пунктов меню (строго по ТЗ)
  const menuItems = [
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

  // Закрываем меню при клике на пункт
  const handleNavClick = () => {
    onClose();
  };

  return (
    <Drawer
      title="Меню кассира"
      placement="left"
      onClose={onClose}
      open={isOpen}
      width={280}
    >
      <div className="mt-4">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`
                }
                onClick={handleNavClick}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  );
};

export default TabletMenu;
