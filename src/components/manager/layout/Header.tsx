import { FC } from 'react';
import { MenuIcon } from '@heroicons/react/outline';

interface ManagerHeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  NotificationsComponent: FC;
}

export function ManagerHeader({
  onMenuClick,
  onLogout,
  NotificationsComponent,
}: ManagerHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Левая часть */}
          <div className="flex">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Открыть меню</span>
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Правая часть */}
          <div className="flex items-center">
            {/* Уведомления */}
            <NotificationsComponent />

            {/* Профиль */}
            <div className="ml-4 relative flex-shrink-0">
              <button
                onClick={onLogout}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
