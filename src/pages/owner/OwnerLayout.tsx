import { useState } from 'react';
import { Link, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { useAuthStore } from '@/store/authStore';

export default function OwnerLayout() {
  const { shopId } = useParams();
  const { currentRole } = useRoleStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
              {/* Логотип и название */}
              <Link to={`/owner/${shopId}`} className="flex items-center">
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
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <span>👔 Владелец</span>
                  <svg
                    className={`h-5 w-5 transition-transform ${
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
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="mr-2">👤</span>
                        Мой профиль
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <span className="mr-2">🚪</span>
                        Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Боковая навигация */}
        <nav className="w-64 bg-white shadow-sm p-4">
          <div className="space-y-1">
            <Link
              to={`/owner/${shopId}`}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>📊</span>
              <span>Дашборд</span>
            </Link>
            <Link
              to={`/owner/${shopId}/staff`}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>👥</span>
              <span>Сотрудники</span>
            </Link>
            <Link
              to={`/owner/${shopId}/invites`}
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
