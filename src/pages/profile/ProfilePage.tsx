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

  const renderRole = (role: UserRole) => (
    <motion.div
      key={role.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleRoleSelect(role)}
      className="bg-white rounded-lg shadow-sm p-6 cursor-pointer border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{role.shop.name}</h3>
          {role.shop.address && (
            <p className="text-gray-500">📍 {role.shop.address}</p>
          )}
          <p className="text-violet-600 mt-2">
            {role.role === 'owner'
              ? 'Владелец'
              : role.role === 'manager'
              ? 'Менеджер'
              : 'Кассир'}
          </p>
        </div>
        <span className="text-2xl">
          {role.role === 'owner' ? '👔' : role.role === 'manager' ? '👨‍💼' : '💰'}
        </span>
      </div>
    </motion.div>
  );

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
            {isSuperAdmin && (
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

            {userRoles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Мои проекты</h2>
                <div className="space-y-4">
                  {userRoles.map((role) => renderRole(role))}
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
