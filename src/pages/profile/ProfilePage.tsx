import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { updateProfile, getProfile } from '@/services/api';

// Схема валидации для профиля
const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .optional(),
  email: z.string().email('Введите корректный email').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Типы для магазинов и ролей
type ShopType = 'shop' | 'warehouse' | 'point_of_sale';
type Role = 'owner' | 'manager' | 'cashier';

interface Shop {
  id: string;
  name: string;
  type: ShopType;
  address: string;
}

interface UserRole {
  shopId: string;
  role: Role;
}

export default function ProfilePage() {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Моковые данные для примера
  const shops: Shop[] = [
    {
      id: '1',
      name: 'Магазин на Ленина',
      type: 'shop',
      address: 'ул. Ленина, 1',
    },
    {
      id: '2',
      name: 'Склад Центральный',
      type: 'warehouse',
      address: 'ул. Складская, 5',
    },
    {
      id: '3',
      name: 'Точка продаж ТЦ',
      type: 'point_of_sale',
      address: 'ТЦ Мега',
    },
  ];

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // TODO: Get actual user ID from auth context
        const userId = 'current-user-id';
        const profile = await getProfile(userId);
        form.reset({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [form]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      // TODO: Get actual user ID from auth context
      const userId = 'current-user-id';
      await updateProfile(userId, data);
      // TODO: Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    // В реальном приложении здесь будет запрос на бэкенд для получения доступных ролей
    setAvailableRoles(['owner', 'manager', 'cashier']);
    setSelectedRole(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-center mb-8"
          >
            Профиль
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Форма профиля */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">Личные данные</h2>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Имя
                  </label>
                  <Input
                    {...form.register('firstName')}
                    className="mt-1"
                    placeholder="Введите ваше имя"
                  />
                  {form.formState.errors.firstName && (
                    <span className="text-red-500 text-sm">
                      {form.formState.errors.firstName.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Фамилия
                  </label>
                  <Input
                    {...form.register('lastName')}
                    className="mt-1"
                    placeholder="Введите вашу фамилию"
                  />
                  {form.formState.errors.lastName && (
                    <span className="text-red-500 text-sm">
                      {form.formState.errors.lastName.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    {...form.register('email')}
                    type="email"
                    className="mt-1"
                    placeholder="Введите ваш email"
                  />
                  {form.formState.errors.email && (
                    <span className="text-red-500 text-sm">
                      {form.formState.errors.email.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Телефон
                  </label>
                  <Input
                    type="tel"
                    disabled
                    value="+7 (999) 123-45-67" // Здесь будет реальный номер
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </form>
            </motion.div>

            {/* Выбор магазина и роли */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">Выбор магазина и роли</h2>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Выберите магазин
                </label>
                <div className="grid gap-3">
                  {shops.map((shop) => (
                    <motion.button
                      key={shop.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleShopSelect(shop)}
                      className={`p-4 rounded-lg border text-left ${
                        selectedShop?.id === shop.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-sm text-gray-500">
                        {shop.address}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {shop.type === 'shop' && 'Магазин'}
                        {shop.type === 'warehouse' && 'Склад'}
                        {shop.type === 'point_of_sale' && 'Точка продаж'}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {selectedShop && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Выберите роль
                    </label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {availableRoles.map((role) => (
                        <motion.button
                          key={role}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedRole(role)}
                          className={`p-3 rounded-lg border ${
                            selectedRole === role
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200'
                          }`}
                        >
                          {role === 'owner' && 'Владелец'}
                          {role === 'manager' && 'Менеджер'}
                          {role === 'cashier' && 'Кассир'}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={form.handleSubmit(onSubmit)}
            className="mt-8 w-full bg-indigo-600 text-white rounded-lg py-3 font-medium"
          >
            Сохранить изменения
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
