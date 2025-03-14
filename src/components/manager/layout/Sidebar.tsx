import { Link, useLocation } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { RoleType, UserRoleDetails } from '@/types/role';
import {
  HomeIcon,
  ShoppingBagIcon,
  BanknotesIcon as CashIcon,
  UsersIcon,
  TagIcon,
  ChartPieIcon,
  ClipboardIcon as ClipboardListIcon,
  Cog6ToothIcon as CogIcon,
  ChartBarIcon,
  ChevronRightIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
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
}

interface ManagerSidebarProps {
  onNavigate?: () => void;
}

export function ManagerSidebar({ onNavigate }: ManagerSidebarProps) {
  const location = useLocation();
  const { currentRole } = useRoleStore();

  if (!currentRole || currentRole.type !== 'shop') return null;

  const shopId = currentRole.shop.id;

  const navigation = [
    { name: 'Дашборд', href: `/manager/${shopId}`, icon: HomeIcon },
    {
      name: 'Товары и склад',
      icon: ShoppingBagIcon,
      children: [
        { name: 'Товары', href: `/manager/${shopId}/products` },
        { name: 'Категории', href: `/manager/${shopId}/categories` },
        { name: 'Склад', href: `/manager/${shopId}/inventory` },
      ],
    },
    {
      name: 'Продажи',
      icon: CashIcon,
      children: [
        { name: 'История продаж', href: `/manager/${shopId}/sales` },
        { name: 'Возвраты', href: `/manager/${shopId}/sales/returns` },
      ],
    },
    { name: 'Сотрудники', href: `/manager/${shopId}/staff`, icon: UsersIcon },
    {
      name: 'Приглашения',
      href: `/manager/${shopId}/invites`,
      icon: UserPlusIcon,
    },
    {
      name: 'Маркетинг',
      icon: ChartBarIcon,
      children: [
        { name: 'Акции', href: `/manager/${shopId}/promotions` },
        { name: 'Этикетки', href: `/manager/${shopId}/labels` },
      ],
    },
    {
      name: 'Аналитика',
      icon: ChartPieIcon,
      children: [
        { name: 'Отчеты', href: `/manager/${shopId}/reports` },
        { name: 'Статистика', href: `/manager/${shopId}/analytics` },
      ],
    },
    { name: 'Настройки', href: `/manager/${shopId}/settings`, icon: CogIcon },
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
                          isActive ? 'text-gray-500' : 'text-gray-400'
                        } mr-3 flex-shrink-0 h-6 w-6`}
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
                      {item.children.map((subItem) => (
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
                  isActive ? 'text-gray-500' : 'text-gray-400'
                } mr-3 flex-shrink-0 h-6 w-6`}
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
