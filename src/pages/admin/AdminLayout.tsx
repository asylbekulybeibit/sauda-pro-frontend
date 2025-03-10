import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Логотип */}
          <Link
            to="/admin"
            className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent"
          >
            SaudaPro
          </Link>

          {/* Профиль и меню */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
            >
              <span className="text-gray-700">👤 Суперадмин</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
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

            {/* Выпадающее меню профиля */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    👤 Мой профиль
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    🚪 Выйти
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Боковая навигация */}
        <nav className="w-64 bg-white shadow-sm p-4">
          <div className="space-y-1">
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>📊</span>
              <span>Дашборд</span>
            </Link>
            <Link
              to="/admin/projects"
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>🏪</span>
              <span>Проекты</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>👥</span>
              <span>Пользователи</span>
            </Link>
            <Link
              to="/admin/invites"
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>📨</span>
              <span>Инвайты</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <span>📈</span>
              <span>Отчеты</span>
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
