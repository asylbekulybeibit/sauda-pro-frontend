import {  useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useRoleStore } from '@/store/roleStore';
import { useState } from 'react';
import { ManagerSidebar } from '@/components/manager/layout/Sidebar';
import { NotificationsPopover } from '@/components/manager/notifications/NotificationsPopover';
import { useAuthStore } from '@/store/authStore';
import { RoleType } from '@/types/role';

export function ManagerHeader() {
  const { currentRole } = useRoleStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentRole || currentRole.type !== 'shop') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Нет доступа
          </h2>
          <p className="text-gray-600 mb-4">
            Для доступа к панели управления необходимо выбрать роль
          </p>
          <Link to="/profile" className="text-indigo-600 hover:text-indigo-500">
            Перейти в профиль
          </Link>
        </div>
      </div>
    );
  }

  if (currentRole.role !== RoleType.MANAGER) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Недостаточно прав
          </h2>
          <p className="text-gray-600 mb-4">
            У вас нет прав для доступа к панели управления магазином
          </p>
          <Link to="/profile" className="text-indigo-600 hover:text-indigo-500">
            Вернуться в профиль
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm fixed w-full z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <Link
                to={`/manager/${currentRole.shop.id}`}
                className="flex items-center hover:text-gray-600"
              >
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

            <div className="flex items-center">
              <NotificationsPopover />
              <div className="ml-4 relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center text-base px-6 py-3 font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none"
                >
                  <span className="text-lg">👨‍💼 Менеджер</span>
                  <ChevronDownIcon
                    className={`ml-3 h-6 w-6 text-gray-400 transition-transform duration-200 ${
                      isProfileMenuOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 bg-white ring-1 ring-black ring-opacity-5">
                    <Link
                      to="/profile"
                      className="block px-6 py-3 text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-lg">👨‍💼 Мой профиль</span>
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
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <div
          className={`fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-64 bg-white border-r border-gray-200 pt-16 transition-transform duration-300 ease-in-out z-30`}
        >
          <ManagerSidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1">
          <div className="p-6 pl-10 w-full">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden inline-flex items-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none mb-4"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
