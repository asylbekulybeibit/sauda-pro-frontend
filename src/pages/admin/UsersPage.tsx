import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser } from '@/services/api';
import { User } from '@/types/user';
import { formatPhoneNumber } from '@/utils/phone';
import { Modal } from '@/components/ui/modal';

// Компонент карточки пользователя
const UserCard = ({ user }: { user: User }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (isActive: boolean) => updateUser(user.id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleToggleStatus = () => {
    if (
      window.confirm(
        `Вы уверены, что хотите ${
          user.isActive ? 'деактивировать' : 'активировать'
        } этого пользователя?`
      )
    ) {
      updateStatusMutation.mutate(!user.isActive);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      {/* Заголовок и действия */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {user.firstName} {user.lastName}
            {user.isSuperAdmin && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Суперадмин
              </span>
            )}
          </h3>
          <div className="text-sm text-gray-500">
            {formatPhoneNumber(user.phone)}
          </div>
          {user.email && (
            <div className="text-sm text-gray-500">{user.email}</div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={handleToggleStatus}
            className={`p-2 ${
              user.isActive
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-gray-500'
            } transition-colors`}
            title={user.isActive ? 'Деактивировать' : 'Активировать'}
          >
            {user.isActive ? '✅' : '❌'}
          </button>
        </div>
      </div>

      {/* Роли в проектах */}
      {user.roles.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-2">
            Роли в проектах
          </div>
          <div className="space-y-2">
            {user.roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center space-x-2 text-sm"
              >
                <span>
                  {role.role === 'owner' && '👔'}
                  {role.role === 'manager' && '👨‍💼'}
                  {role.role === 'cashier' && '💰'}
                </span>
                <span className="font-medium">{role.shop.name}</span>
                <span className="text-gray-500">
                  (
                  {role.role === 'owner'
                    ? 'Владелец'
                    : role.role === 'manager'
                    ? 'Менеджер'
                    : 'Кассир'}
                  )
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно редактирования */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактирование пользователя"
      >
        <EditUserForm user={user} onClose={() => setIsEditModalOpen(false)} />
      </Modal>
    </motion.div>
  );
};

// Компонент формы редактирования пользователя
const EditUserForm = ({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: () => updateUser(user.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Произошла ошибка при обновлении пользователя' });
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateMutation.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Имя */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Имя
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, firstName: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Введите имя"
        />
      </div>

      {/* Фамилия */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Фамилия
        </label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, lastName: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Введите фамилию"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Введите email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Статус */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
          }
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Активен
        </label>
      </div>

      {/* Суперадмин */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isSuperAdmin"
          checked={formData.isSuperAdmin}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isSuperAdmin: e.target.checked }))
          }
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label
          htmlFor="isSuperAdmin"
          className="text-sm font-medium text-gray-700"
        >
          Суперадмин
        </label>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
};

// Основной компонент страницы
export default function UsersPage() {
  const [filter, setFilter] = useState<{
    status?: boolean;
    search?: string;
    role?: string;
  }>({});

  // Запрос списка пользователей
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // Фильтрация пользователей
  const filteredUsers = users?.filter((user) => {
    if (filter.status !== undefined && user.isActive !== filter.status)
      return false;
    if (
      filter.search &&
      !`${user.firstName} ${user.lastName} ${user.phone} ${user.email}`
        .toLowerCase()
        .includes(filter.search.toLowerCase())
    )
      return false;
    if (filter.role && !user.roles.some((r) => r.role === filter.role))
      return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center space-x-4">
          {/* Поиск */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по имени, телефону или email..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filter.search || ''}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Фильтр по роли */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filter.role || ''}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                role: e.target.value || undefined,
              }))
            }
          >
            <option value="">Все роли</option>
            <option value="owner">Владельцы</option>
            <option value="manager">Менеджеры</option>
            <option value="cashier">Кассиры</option>
          </select>

          {/* Фильтр по статусу */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={
              filter.status === undefined
                ? ''
                : filter.status
                ? 'active'
                : 'inactive'
            }
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                status:
                  e.target.value === ''
                    ? undefined
                    : e.target.value === 'active',
              }))
            }
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="grid grid-cols-1 gap-6">
        {filteredUsers?.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
