import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
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
        setError(null);
        const profile = await getProfile();
        setIsSuperAdmin(profile.isSuperAdmin);
        setUserRoles(profile.roles);
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Ошибка при загрузке профиля');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleRoleSelect = (role: 'superadmin' | UserRole) => {
    if (role === 'superadmin') {
      setCurrentRole({ type: 'superadmin' });
      navigate('/admin/dashboard');
    } else {
      setCurrentRole({
        type: 'shop',
        id: role.id,
        role: role.role,
        shop: role.shop,
      });
      navigate('/shop/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentRole(null);
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Заголовок и кнопка выхода */}
            <div className="flex justify-between items-center mb-8">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl font-bold"
              >
                Профиль
              </motion.h1>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
              >
                <span>Выйти</span>
                <span>🚪</span>
              </motion.button>
            </div>

            {/* Блок суперадмина */}
            {isSuperAdmin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold mb-4">
                  Администрирование системы
                </h2>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('superadmin')}
                  className="w-full p-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        Панель суперадмина
                      </div>
                      <div className="text-sm opacity-90">
                        Управление всей системой
                      </div>
                    </div>
                    <div className="text-3xl">👑</div>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {/* Блок ролей в магазинах */}
            {userRoles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold mb-4">Роли в магазинах</h2>
                <div className="grid gap-4">
                  {userRoles.map((role) => (
                    <motion.button
                      key={role.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelect(role)}
                      className="w-full p-4 rounded-lg border border-gray-200 hover:border-indigo-500 transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-lg">
                            {role.shop.name}
                          </div>
                          <div className="text-sm text-indigo-600 font-medium">
                            {role.role === 'owner' && '👔 Владелец'}
                            {role.role === 'manager' && '👨‍💼 Менеджер'}
                            {role.role === 'cashier' && '💰 Кассир'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {role.shop.address}
                          </div>
                        </div>
                        <div className="text-2xl bg-gray-50 p-3 rounded-full">
                          {role.shop.type === 'shop' && '🏪'}
                          {role.shop.type === 'warehouse' && '🏭'}
                          {role.shop.type === 'point_of_sale' && '💳'}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Личные данные */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-t pt-8"
            >
              <h2 className="text-xl font-semibold mb-4">Личные данные</h2>
              <PersonalInfoForm />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
