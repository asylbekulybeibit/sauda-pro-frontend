import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, deleteUser } from '@/services/api';
import { User } from '@/types/user';
import { formatPhoneNumber } from '@/utils/phone';
import { Modal } from '@/components/ui/modal';

// Компонент для отображения контактной информации
const ContactInfo = ({
  phone,
  firstName,
  lastName,
  email,
}: {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}) => {
  const openWhatsApp = () => {
    // Убираем все нецифровые символы из номера
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-gray-900">{phone}</span>
        <button
          onClick={openWhatsApp}
          className="text-green-600 hover:text-green-700 p-1.5 rounded-full hover:bg-green-50 transition-colors"
          title="Открыть WhatsApp"
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
          </svg>
        </button>
      </div>
      {(firstName || lastName) && (
        <div className="font-medium text-gray-900">
          {firstName} {lastName}
        </div>
      )}
      {email && (
        <div className="text-sm text-gray-500 hover:text-gray-700">
          <a href={`mailto:${email}`}>{email}</a>
        </div>
      )}
    </div>
  );
};

// Компонент для отображения ролей пользователя
const UserRoles = ({ user }: { user: User }) => {
  if (user.isSuperAdmin) {
    return <span className="text-violet-600 font-medium">👑 Суперадмин</span>;
  }

  if (user.roles.length === 0) {
    return <span className="text-gray-400">Нет ролей</span>;
  }

  return (
    <div className="space-y-1">
      {user.roles.map((role) => (
        <div key={role.id} className="flex items-center text-sm">
          <span className="mr-1">
            {role.role === 'owner'
              ? '👔'
              : role.role === 'manager'
              ? '👨‍💼'
              : '💰'}
          </span>
          <span className="font-medium capitalize">{role.role}</span>
        </div>
      ))}
    </div>
  );
};

// Компонент для отображения проектов пользователя
const UserProjects = ({ user }: { user: User }) => {
  if (user.isSuperAdmin || user.roles.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="space-y-1">
      {user.roles.map((role) => (
        <div key={role.id} className="flex items-center text-sm">
          <span className="text-gray-600">{role.shop.name}</span>
          <span className="ml-1 text-gray-400">
            {role.shop.type === 'shop'
              ? '🏪'
              : role.shop.type === 'warehouse'
              ? '🏭'
              : '💳'}
          </span>
        </div>
      ))}
    </div>
  );
};

// Форма редактирования пользователя
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
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateUser>[1]) =>
      updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Имя</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Фамилия
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
          }
          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
          Активен
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
};

// Компонент подтверждения удаления
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Подтверждение удаления">
      <div className="space-y-4">
        <p className="text-gray-700">
          Вы уверены, что хотите удалить этого пользователя? Он больше не сможет
          войти в систему без нового приглашения.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            disabled={isDeleting}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Основной компонент страницы
export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleDeleteUser = async (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteMutation.mutate(userToDelete);
      setUserToDelete(null);
    }
  };

  // Фильтрация пользователей
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'superadmin' && user.isSuperAdmin) ||
      (roleFilter === 'owner' && user.roles.some((r) => r.role === 'owner')) ||
      (roleFilter === 'manager' &&
        user.roles.some((r) => r.role === 'manager')) ||
      (roleFilter === 'cashier' &&
        user.roles.some((r) => r.role === 'cashier')) ||
      (roleFilter === 'no-role' && user.roles.length === 0);

    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
      </div>

      {/* Фильтры */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Поиск по телефону, имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        >
          <option value="all">Все роли</option>
          <option value="superadmin">Суперадмины</option>
          <option value="owner">Владельцы</option>
          <option value="manager">Менеджеры</option>
          <option value="cashier">Кассиры</option>
          <option value="no-role">Без роли</option>
        </select>
      </div>

      {/* Таблица пользователей */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контактная информация
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роли
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Проекты
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <ContactInfo
                    phone={user.phone}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    email={user.email}
                  />
                </td>
                <td className="px-6 py-4">
                  <UserRoles user={user} />
                </td>
                <td className="px-6 py-4">
                  <UserProjects user={user} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900 font-medium"
                    disabled={deleteMutation.isPending}
                  >
                    Удалить
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно редактирования */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Редактирование пользователя"
      >
        {selectedUser && (
          <EditUserForm
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
