import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { useAuthStore } from '@/store/authStore';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function OwnerLayout() {
  const { shopId } = useParams();
  const { currentRole } = useRoleStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (
    !currentRole ||
    currentRole.type !== 'shop' ||
    currentRole.id !== shopId
  ) {
    return <div>Доступ запрещен</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Кнопка-гамбургер */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Логотип и название */}
              <Link to={`/owner/${shopId}`} className="flex items-center ml-4">
                <span className="text-xl font-bold">
                  {currentRole.shop.name}
                </span>
                {currentRole.shop.address && (
                  <span className="ml-2 text-sm text-gray-500">
                    📍 {currentRole.shop.address}
                  </span>
                )}
              </Link>
            </div>

            {/* Профиль */}
            <div className="flex items-center relative" ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center text-base px-6 py-3 font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none"
              >
                <span className="text-lg">👔 Владелец</span>
                <svg
                  className={`ml-3 h-6 w-6 text-gray-400 transition-transform duration-200 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
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

              {/* Выпадающее меню профиля */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full w-56 rounded-lg shadow-lg py-2 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-6 py-3 text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-lg">👔 Мой профиль</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-6 py-3 text-base text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <span className="text-lg">🚪 Выйти</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex min-h-[calc(100vh-4rem)] relative">
        {/* Затемнение фона при открытом сайдбаре */}
        <div
          className={`absolute inset-0 bg-gray-900/20 transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Боковая навигация */}
        <nav
          className={`${
            isSidebarOpen ? 'w-64' : 'w-0'
          } bg-white shadow-sm overflow-hidden transition-all duration-300 relative z-20`}
        >
          <div className="p-4 space-y-1">
            <Link
              to={`/owner/${shopId}`}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>📊</span>
              <span>Дашборд</span>
            </Link>
            <Link
              to={`/owner/${shopId}/staff`}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>👥</span>
              <span>Сотрудники</span>
            </Link>
            <Link
              to={`/owner/${shopId}/invites`}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>📨</span>
              <span>Инвайты</span>
            </Link>
          </div>
        </nav>

        {/* Контент страницы */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
