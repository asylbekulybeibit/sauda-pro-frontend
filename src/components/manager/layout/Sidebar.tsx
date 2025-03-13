import { useLocation, Link } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ClipboardListIcon,
  CashIcon,
  TagIcon,
  TruckIcon,
  ChartPieIcon,
} from '@heroicons/react/outline';
import clsx from 'clsx';

interface ManagerSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navigation = [
  { name: 'Дашборд', href: '/manager', icon: HomeIcon },
  {
    name: 'Товары и склад',
    icon: ShoppingBagIcon,
    children: [
      { name: 'Товары', href: '/manager/products' },
      { name: 'Категории', href: '/manager/products/categories' },
      { name: 'Склад', href: '/manager/inventory' },
      { name: 'Перемещения', href: '/manager/inventory/transfers' },
      { name: 'Поставщики', href: '/manager/suppliers' },
    ],
  },
  {
    name: 'Продажи',
    icon: CashIcon,
    children: [
      { name: 'История продаж', href: '/manager/sales' },
      { name: 'Отчеты', href: '/manager/sales/reports' },
    ],
  },
  {
    name: 'Сотрудники',
    icon: UsersIcon,
    children: [
      { name: 'Список сотрудников', href: '/manager/staff' },
      { name: 'Приглашения', href: '/manager/staff/invites' },
    ],
  },
  {
    name: 'Маркетинг',
    icon: TagIcon,
    children: [
      { name: 'Акции', href: '/manager/promotions' },
      { name: 'Ценники', href: '/manager/labels' },
    ],
  },
  { name: 'Аналитика', href: '/manager/analytics', icon: ChartPieIcon },
  { name: 'Аудит', href: '/manager/audit', icon: ClipboardListIcon },
  { name: 'Настройки', href: '/manager/settings', icon: CogIcon },
];

export function ManagerSidebar({ isOpen, setIsOpen }: ManagerSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Мобильное меню */}
      <div
        className={clsx(
          'fixed inset-0 flex z-40 md:hidden',
          isOpen ? 'block' : 'hidden'
        )}
      >
        {/* Затемнение */}
        <div
          className={clsx(
            'fixed inset-0 bg-gray-600 bg-opacity-75',
            isOpen ? 'block' : 'hidden'
          )}
          onClick={() => setIsOpen(false)}
        />

        {/* Боковая панель */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Закрыть меню</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <SidebarContent currentPath={location.pathname} />
        </div>
      </div>

      {/* Десктопное меню */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-700">
              <h1 className="text-xl font-bold text-white">SaudaPro</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto bg-white">
              <SidebarContent currentPath={location.pathname} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SidebarContent({ currentPath }: { currentPath: string }) {
  return (
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {navigation.map((item) =>
        !item.children ? (
          <Link
            key={item.name}
            to={item.href}
            className={clsx(
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
              currentPath === item.href
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon
              className={clsx(
                'mr-3 flex-shrink-0 h-6 w-6',
                currentPath === item.href
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-gray-500'
              )}
              aria-hidden="true"
            />
            {item.name}
          </Link>
        ) : (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-600">
              <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400" />
              {item.name}
            </div>
            <div className="space-y-1 ml-8">
              {item.children.map((child) => (
                <Link
                  key={child.name}
                  to={child.href}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    currentPath === child.href
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )
      )}
    </nav>
  );
}
