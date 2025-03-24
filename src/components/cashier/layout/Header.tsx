import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Menu } from 'antd';
import { MenuOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

interface HeaderProps {
  shopId?: string;
  isTablet?: boolean;
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

/**
 * Компонент заголовка для панели кассира
 * Отображает информацию о текущей смене, кассе и кассире
 */
const Header: React.FC<HeaderProps> = ({
  shopId,
  isTablet = false,
  isMobile = false,
  onMenuToggle,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Здесь должна быть логика для получения информации о текущей смене и кассе
  const shiftInfo = {
    isActive: false, // Будет заменено на реальные данные
    cashRegister: 'Не выбрана', // Будет заменено на реальные данные
    openedAt: null, // Будет заменено на реальные данные
  };

  // Профиль пользователя
  const userMenu = (
    <Menu
      items={[
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Профиль',
          onClick: () => navigate('/profile'),
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Выйти',
          onClick: logout,
        },
      ]}
    />
  );

  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        {/* Левая часть */}
        <div className="flex items-center space-x-4">
          {(isTablet || isMobile) && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={onMenuToggle}
              className="mr-2"
            />
          )}
          <div>
            <h1 className="text-xl font-semibold">Панель кассира</h1>
            <p className="text-sm text-gray-500">
              {shopId ? `Магазин ID: ${shopId}` : 'Магазин не выбран'}
            </p>
          </div>
        </div>

        {/* Центральная часть - информация о смене */}
        <div className="hidden md:flex flex-col items-center">
          {shiftInfo.isActive ? (
            <>
              <span className="text-green-500 font-medium">Смена открыта</span>
              <span className="text-sm">Касса: {shiftInfo.cashRegister}</span>
              {shiftInfo.openedAt && (
                <span className="text-xs text-gray-500">
                  Открыта: {new Date(shiftInfo.openedAt).toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <span className="text-red-500 font-medium">Смена не открыта</span>
          )}
        </div>

        {/* Правая часть - профиль */}
        <div>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />} size="large" />
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
