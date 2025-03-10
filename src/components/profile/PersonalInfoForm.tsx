import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { updateProfile, getProfile } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

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

interface UserData {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function PersonalInfoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Загружаем данные пользователя при монтировании компонента
  useState(() => {
    const loadUserData = async () => {
      try {
        const profile = await getProfile();
        setUserData(profile);
        // Устанавливаем значения формы
        reset({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      const updatedProfile = await updateProfile(data);
      setUserData(updatedProfile);
      setSuccessMessage('Данные успешно сохранены');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Сбрасываем форму к текущим данным пользователя
    reset({
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      email: userData?.email,
    });
  };

  if (!userData) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          // Режим просмотра
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Телефон</div>
                <div className="font-medium">{userData.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">
                  {userData.email || 'Не указан'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Имя</div>
                <div className="font-medium">
                  {userData.firstName || 'Не указано'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Фамилия</div>
                <div className="font-medium">
                  {userData.lastName || 'Не указана'}
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="mt-4 w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Редактировать
            </motion.button>
          </motion.div>
        ) : (
          // Режим редактирования
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Имя
                </label>
                <Input
                  {...register('firstName')}
                  className="mt-1"
                  placeholder="Введите ваше имя"
                  error={!!errors.firstName}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">
                    {errors.firstName.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Фамилия
                </label>
                <Input
                  {...register('lastName')}
                  className="mt-1"
                  placeholder="Введите вашу фамилию"
                  error={!!errors.lastName}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                className="mt-1"
                placeholder="Введите ваш email"
                error={!!errors.email}
              />
              {errors.email && (
                <span className="text-red-500 text-sm">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Отмена
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-green-600 text-sm text-center"
        >
          {successMessage}
        </motion.div>
      )}
    </div>
  );
}
