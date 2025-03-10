import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import PendingInvites from '@/components/invites/PendingInvites';
import { useRoleStore, UserRole } from '@/store/roleStore';
import { useAuthStore } from '@/store/authStore';
import { getProfile } from '@/services/api';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { setCurrentRole } = useRoleStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const profile = await getProfile();
        console.log('Полученные данные профиля:', profile);
        console.log('Роли пользователя:', profile.roles);
        setIsSuperAdmin(profile.isSuperAdmin);
        setUserRoles(profile.roles || []);
      } catch (err) {
        setError('Ошибка при загрузке данных профиля');
        console.error('Ошибка загрузки профиля:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleRoleSelect = (role: 'superadmin' | UserRole) => {
    if (role === 'superadmin') {
      setCurrentRole({ type: 'superadmin' });
      navigate('/admin');
    } else {
      setCurrentRole({
        type: 'shop',
        id: role.shop.id,
        role: role.role,
        shop: role.shop,
      });
      navigate(`/shop/${role.shop.id}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderRole = (role: UserRole) => {
    if (!role || !role.shop) {
      console.log('Некорректные данные роли:', role);
      return null;
    }

    return (
      <motion.button
        key={role.id}
        onClick={() => handleRoleSelect(role)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {role.shop.name}
            </h3>
            {role.shop.address && (
              <p className="text-sm text-gray-500 mt-1">{role.shop.address}</p>
            )}
            <p className="text-gray-500">
              {role.role === 'owner'
                ? '👔 Владелец'
                : role.role === 'manager'
                ? '👨‍💼 Менеджер'
                : '💰 Кассир'}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {role.shop.type === 'shop'
              ? '🏪 Магазин'
              : role.shop.type === 'warehouse'
              ? '🏭 Склад'
              : '💳 Точка продаж'}
          </div>
        </div>
      </motion.button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto space-y-8 px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 transition-colors"
          >
            Выйти 🚪
          </button>
        </div>

        {/* Личные данные */}
        <PersonalInfoForm />

        {/* Ожидающие инвайты */}
        <PendingInvites />

        {/* Администрирование системы */}
        {isSuperAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
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
                  <h3 className="text-lg font-semibold">Панель суперадмина</h3>
                  <p className="text-violet-100">Управление всей системой</p>
                </div>
                <span className="text-2xl">👑</span>
              </div>
            </motion.button>
          </div>
        )}

        {/* Проекты */}
        {userRoles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Мои проекты</h2>
            <div className="grid gap-4">
              {userRoles.map((role) => renderRole(role))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
