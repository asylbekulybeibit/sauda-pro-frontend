import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import PendingInvites from '@/components/invites/PendingInvites';
import { useRoleStore } from '@/store/roleStore';
import { useAuthStore } from '@/store/authStore';
import { getProfile } from '@/services/api';
import { RoleType, UserRoleDetails } from '@/types/role';

export default function ProfilePage() {
  const { setCurrentRole } = useRoleStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const handleRoleSelect = (role: 'superadmin' | UserRoleDetails) => {
    if (role === 'superadmin') {
      setCurrentRole({ type: 'superadmin' });
      navigate('/admin');
    } else {
      setCurrentRole({
        type: 'shop',
        id: role.shop.id,
        role: role.type,
        shop: {
          id: role.shop.id,
          name: role.shop.name,
          type: role.shop.type || 'shop',
          address: role.shop.address,
        },
        warehouse: role.warehouse
          ? {
              id: role.warehouse.id,
              name: role.warehouse.name,
              address: role.warehouse.address,
            }
          : undefined,
      });
      if (role.type === RoleType.OWNER) {
        navigate(`/owner/${role.shop.id}`);
      } else if (role.type === RoleType.CASHIER) {
        navigate(`/cashier/${role.shop.id}`);
      } else {
        navigate(`/manager/${role.shop.id}`);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderRole = (role: UserRoleDetails) => (
    <motion.div
      key={role.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleRoleSelect(role)}
      className="bg-white rounded-lg shadow-sm p-6 cursor-pointer border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          {role.warehouse ? (
            <h3 className="text-lg font-semibold">🏭 {role.warehouse.name}</h3>
          ) : (
            <h3 className="text-lg font-semibold">{role.shop.name}</h3>
          )}

          {role.shop.address && !role.warehouse && (
            <p className="text-gray-500">📍 {role.shop.address}</p>
          )}

          {role.warehouse && role.warehouse.address && (
            <p className="text-gray-500">📍 {role.warehouse.address}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl">
              {role.type === 'owner'
                ? '👔'
                : role.type === 'manager'
                ? '👨‍💼'
                : '💰'}
            </span>
            <span className="text-lg">
              {role.type === 'owner'
                ? 'Владелец'
                : role.type === 'manager'
                ? 'Менеджер'
                : 'Кассир'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Отображение проекта и его ролей
  const renderShopWithRoles = (shopId: string, roles: UserRoleDetails[]) => {
    // Получаем информацию о магазине из первой роли
    const shopInfo = roles[0].shop;

    // Находим роль владельца, если она есть
    const ownerRole = roles.find((role) => role.type === RoleType.OWNER);

    // Отображаем роли, где у нас нет склада отдельно
    const shopRoles = roles.filter((role) => !role.warehouse);

    // Отображаем роли, где у нас есть склад
    const warehouseRoles = roles.filter((role) => role.warehouse);

    return (
      <div
        key={shopId}
        className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-4"
      >
        {/* Показываем название проекта только если есть роль владельца */}
        {ownerRole && (
          <h3 className="text-lg font-semibold mb-4">{shopInfo.name}</h3>
        )}

        <div className={`space-y-4 ${!ownerRole ? 'mt-0' : ''}`}>
          {/* Сначала отображаем роли без склада (например, владелец) */}
          {shopRoles.map((role) => renderRole(role))}

          {/* Затем отображаем роли со складами */}
          {warehouseRoles.map((role) => renderRole(role))}
        </div>
      </div>
    );
  };

  // Подготовка данных для отображения ролей
  const prepareRolesForDisplay = (roles: UserRoleDetails[]) => {
    // Группируем роли по проектам
    const groupedByShop: { [shopId: string]: UserRoleDetails[] } = {};

    roles.forEach((role) => {
      if (!groupedByShop[role.shop.id]) {
        groupedByShop[role.shop.id] = [];
      }
      groupedByShop[role.shop.id].push(role);
    });

    // Роли для отображения
    const displayItems: React.ReactNode[] = [];

    // Обработка каждого проекта
    Object.keys(groupedByShop).forEach((shopId) => {
      const rolesInShop = groupedByShop[shopId];
      const ownerRole = rolesInShop.find(
        (role) => role.type === RoleType.OWNER
      );

      // Если есть роль владельца, группируем в общую карточку
      if (ownerRole) {
        displayItems.push(
          <div
            key={shopId}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-4"
          >
            <h3 className="text-lg font-semibold mb-4">
              {ownerRole.shop.name}
            </h3>
            <div className="space-y-4">
              {rolesInShop.map((role) => renderRole(role))}
            </div>
          </div>
        );
      } else {
        // Если нет роли владельца, показываем каждую роль отдельно
        rolesInShop.forEach((role) => {
          displayItems.push(renderRole(role));
        });
      }
    });

    return displayItems;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  // Получаем активные роли
  const activeRoles = profile?.roles?.filter((role) => role.isActive) || [];
  // Подготавливаем роли для отображения
  const rolesToDisplay = prepareRolesForDisplay(activeRoles);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-[1000px] h-[1000px] bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute top-0 -right-4 w-[1000px] h-[1000px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute -bottom-8 left-20 w-[1000px] h-[1000px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      {/* Основной контент */}
      <div className="max-w-[1600px] mx-auto p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Левая колонка - Данные профиля */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h1 className="text-2xl font-bold mb-6 flex justify-between items-center">
                Профиль
                <button onClick={handleLogout} className="text-red-600 text-sm">
                  Выйти 🚪
                </button>
              </h1>
              <PersonalInfoForm />
            </div>
          </div>

          {/* Центральная колонка - Администрирование и проекты */}
          <div className="lg:w-1/2 space-y-8">
            {profile?.isSuperAdmin && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">
                  Администрирование системы
                </h2>
                <motion.button
                  onClick={() => handleRoleSelect('superadmin')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl p-6 shadow-sm cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Панель суперадмина
                      </h3>
                      <p className="text-violet-100">
                        Управление всей системой
                      </p>
                    </div>
                    <span className="text-2xl">👑</span>
                  </div>
                </motion.button>
              </div>
            )}

            {profile?.roles && profile.roles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Мои проекты</h2>
                <div className="space-y-4">
                  {/* Отображаем карточки проектов с сгруппированными ролями */}
                  {rolesToDisplay}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка - Приглашения */}
          <div className="lg:w-1/4">
            <PendingInvites />
          </div>
        </div>
      </div>
    </div>
  );
}
