import { Link, useLocation } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import {
  HomeIcon,
  ShoppingBagIcon,
  BanknotesIcon as CashIcon,
  UsersIcon,
  ChartPieIcon,
  Cog6ToothIcon as CogIcon,
  ChartBarIcon,
  ChevronRightIcon,
  UserPlusIcon,
  ArchiveBoxIcon,
  TruckIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Disclosure } from '@headlessui/react';

interface NavigationChild {
  name: string;
  href: string;
}

interface NavigationItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href?: string;
  children?: NavigationChild[];
  color: string;
}

interface ManagerSidebarProps {
  onNavigate?: () => void;
}

export function ManagerSidebar({ onNavigate }: ManagerSidebarProps) {
  const location = useLocation();
  const { currentRole } = useRoleStore();

  if (!currentRole || currentRole.type !== 'shop') return null;

  const shopId = currentRole.shop.id;

  const navigation: NavigationItem[] = [
    {
      name: 'Дашборд',
      href: `/manager/${shopId}`,
      icon: HomeIcon,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Товары и склад',
      icon: ShoppingBagIcon,
      color: 'bg-purple-100 text-purple-600',
      children: [
        { name: 'Товары', href: `/manager/${shopId}/products` },
        { name: 'Категории', href: `/manager/${shopId}/categories` },
      ],
    },
    {
      name: 'Кассы',
      href: `/manager/${shopId}/cash-registers`,
      icon: CashIcon,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      name: 'История изменений цен',
      icon: CurrencyDollarIcon,
      color: 'bg-green-100 text-green-600',
      href: `/manager/${shopId}/prices`,
    },
    {
      name: 'Продажи',
      icon: CashIcon,
      color: 'bg-green-100 text-green-600',
      children: [
        { name: 'История продаж', href: `/manager/${shopId}/sales` },
        { name: 'Возвраты', href: `/manager/${shopId}/sales/returns` },
      ],
    },
    {
      name: 'Склад',
      icon: ArchiveBoxIcon,
      color: 'bg-orange-100 text-orange-600',
      children: [
        {
          name: 'Обзор',
          href: `/manager/${shopId}/warehouse`,
        },
        {
          name: 'Приход товара',
          href: `/manager/${shopId}/warehouse/incoming`,
        },
        {
          name: 'Инвентаризация',
          href: `/manager/${shopId}/warehouse/inventory`,
        },
        {
          name: 'Перемещения',
          href: `/manager/${shopId}/warehouse/transfers`,
        },
      ],
    },
    {
      name: 'Поставщики',
      href: `/manager/${shopId}/suppliers`,
      icon: TruckIcon,
      color: 'bg-teal-100 text-teal-600',
    },
    {
      name: 'Сотрудники',
      href: `/manager/${shopId}/staff`,
      icon: UsersIcon,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      name: 'Приглашения',
      href: `/manager/${shopId}/invites`,
      icon: UserPlusIcon,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      name: 'Маркетинг',
      icon: ChartBarIcon,
      color: 'bg-indigo-100 text-indigo-600',
      children: [
        { name: 'Акции', href: `/manager/${shopId}/promotions` },
        { name: 'Этикетки', href: `/manager/${shopId}/labels` },
      ],
    },
    {
      name: 'Аналитика',
      icon: ChartPieIcon,
      color: 'bg-cyan-100 text-cyan-600',
      children: [
        { name: 'Статистика', href: `/manager/${shopId}/analytics` },
        { name: 'Отчеты', href: `/manager/${shopId}/analytics/reports` },
      ],
    },
  ];

  return (
    <div className="w-64 h-full overflow-y-auto bg-white">
      <nav className="mt-5 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = item.href
            ? location.pathname === item.href
            : item.children?.some((child) => location.pathname === child.href);

          if (item.children) {
            return (
              <Disclosure
                as="div"
                key={item.name}
                className="space-y-1"
                defaultOpen={item.children.some(
                  (child) => location.pathname === child.href
                )}
              >
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                      group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <item.icon
                        className={`${
                          isActive
                            ? item.color
                            : 'text-gray-400 hover:' + item.color
                        } mr-3 flex-shrink-0 h-6 w-6 p-1 rounded-lg transition-all duration-150`}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                      <ChevronRightIcon
                        className={`${
                          open ? 'transform rotate-90' : ''
                        } ml-3 flex-shrink-0 h-5 w-5 text-gray-400 transition-transform duration-150 ease-in-out`}
                        aria-hidden="true"
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="space-y-1">
                      {item.children?.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          onClick={onNavigate}
                          className={`${
                            location.pathname === subItem.href
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                          group w-full flex items-center pl-11 pr-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href!}
              onClick={onNavigate}
              className={`${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
            >
              <item.icon
                className={`${
                  isActive ? item.color : 'text-gray-400 hover:' + item.color
                } mr-3 flex-shrink-0 h-6 w-6 p-1 rounded-lg transition-all duration-150`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
