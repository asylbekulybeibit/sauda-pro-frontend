import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CloseCircleOutlined,
  PieChartOutlined,
  MenuOutlined,
} from '@ant-design/icons';

interface MobileNavbarProps {
  shopId?: string;
}

/**
 * Нижняя навигационная панель для мобильной версии кассир-панели
 */
const MobileNavbar: React.FC<MobileNavbarProps> = ({ shopId }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  if (!shopId) return null;

  // Базовый путь для маршрутов
  const basePath = `/cashier/${shopId}`;

  // Основные пункты меню для нижней панели (ограничены, чтобы поместились)
  const mainNavItems = [
    {
      title: 'Услуга',
      path: `${basePath}/select-service`,
      icon: <PlayCircleOutlined />,
    },
    {
      title: 'Активные',
      path: `${basePath}/active-services`,
      icon: <DollarOutlined />,
    },
    {
      title: 'Завершённые',
      path: `${basePath}/completed-services`,
      icon: <CheckCircleOutlined />,
    },
    {
      title: 'Ещё',
      icon: <MenuOutlined />,
      onClick: () => setMenuVisible(true),
    },
  ];

  // Полный список пунктов для выдвижного меню (строго по ТЗ)
  const fullMenuItems = [
    {
      title: 'Начать услугу',
      path: `${basePath}/select-service`,
    },
    {
      title: 'Активные услуги',
      path: `${basePath}/active-services`,
    },
    {
      title: 'Завершённые услуги',
      path: `${basePath}/completed-services`,
    },
    {
      title: 'Цены услуг',
      path: `${basePath}/service-prices`,
    },
    {
      title: 'Закрытие смены',
      path: `${basePath}/close-shift`,
    },
  ];

  return (
    <>
      {/* Нижняя панель навигации */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {mainNavItems.map((item, index) => (
            <div key={index} className="flex-1">
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center h-full py-1 ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs mt-1">{item.title}</span>
                </NavLink>
              ) : (
                <button
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center w-full h-full py-1 text-gray-600"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs mt-1">{item.title}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Выдвижное меню для дополнительных пунктов */}
      <Drawer
        title="Меню кассира"
        placement="bottom"
        height="70vh"
        onClose={() => setMenuVisible(false)}
        open={menuVisible}
      >
        <div className="mt-2">
          <ul className="space-y-3">
            {fullMenuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                    }`
                  }
                  onClick={() => setMenuVisible(false)}
                >
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </Drawer>
    </>
  );
};

export default MobileNavbar;
