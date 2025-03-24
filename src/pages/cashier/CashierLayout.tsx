import React, { useState, useEffect, useRef } from 'react';
import {
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';
import { Layout, Button, Badge, Typography, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useRoleStore } from '@/store/roleStore';

const { Header, Content } = Layout;
const { Text } = Typography;

/**
 * Макет для страниц панели кассира
 * Упрощенная версия без сайдбара, только с хедером и контентом
 */
const CashierLayout: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuthStore();

  // Закрыть меню профиля при клике снаружи
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Загрузка данных о магазине
  useEffect(() => {
    // Получаем данные магазина из currentRole
    if (currentRole?.type === 'shop') {
      setShopName(currentRole.shop.name);
      setShopAddress(currentRole.shop.address || '');
    } else if (shopId) {
      // Если нет в roleStore, получаем по ID
      setShopName(`Магазин №${shopId}`);
      setShopAddress('ул. Примерная, 123');
    }
  }, [currentRole, shopId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center">
            {/* Информация о магазине */}
            <div className="ml-4">
              <h1 className="text-xl font-semibold">{shopName}</h1>
              <p className="text-sm text-gray-500">{shopAddress}</p>
            </div>
          </div>

          <div className="flex items-center">
            

            {/* Профиль пользователя */}
            <div className="ml-4 relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center text-base px-6 py-3 font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none"
              >
                <span className="text-lg">💰 Кассир</span>
                <svg
                  className={`ml-3 h-6 w-6 text-gray-400 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <Link
                    to="/profile"
                    className="block px-6 py-3 text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-lg">👤 Мой профиль</span>
                  </Link>

                  <Link
                    to={`/cashier/${shopId}/close-shift`}
                    className="block px-6 py-3 text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-lg">⏱️ Закрытие смены</span>
                  </Link>

                  <Link
                    to={`/cashier/${shopId}/shift-history`}
                    className="block px-6 py-3 text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="text-lg">📋 История смен</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-6 py-3 text-base text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <span className="text-lg">🚪 Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Header>

        <Content style={{ margin: '0', overflow: 'initial' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default CashierLayout;
