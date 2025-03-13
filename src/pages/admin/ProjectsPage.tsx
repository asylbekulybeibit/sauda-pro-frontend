import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shop, ShopType } from '@/types/shop';
import { getShops, updateShop, deleteShop } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { EditProjectForm } from '@/components/projects/EditProjectForm';

// Компонент карточки пользователя проекта
const UserRoleCard = ({ type, user }: Shop['userRoles'][0]) => {
  const roleEmoji = {
    owner: '👔',
    manager: '👨‍💼',
    cashier: '💰',
  }[type];

  const roleName = {
    owner: 'Владелец',
    manager: 'Менеджер',
    cashier: 'Кассир',
  }[type];

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>{roleEmoji}</span>
      <span className="text-gray-500">{roleName}:</span>
      <span className="font-medium">
        {user.firstName} {user.lastName}
      </span>
      <span className="text-gray-500">({user.phone})</span>
    </div>
  );
};

// Компонент карточки проекта
const ProjectCard = ({ project }: { project: Shop }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (isActive: boolean) => updateShop(project.id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteShop(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });

  const handleToggleStatus = () => {
    updateStatusMutation.mutate(!project.isActive);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот проект?')) {
      deleteMutation.mutate();
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
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <div className="text-sm text-gray-500">
            {project.type === 'shop' && '🏪 Магазин'}
            {project.type === 'warehouse' && '🏭 Склад'}
            {project.type === 'point_of_sale' && '💳 Точка продаж'}
          </div>
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
              project.isActive
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-gray-500'
            } transition-colors`}
            title={project.isActive ? 'Деактивировать' : 'Активировать'}
          >
            {project.isActive ? '✅' : '❌'}
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Информация */}
      <div className="space-y-4">
        {project.address && (
          <div>
            <div className="text-sm text-gray-500">Адрес</div>
            <div>{project.address}</div>
          </div>
        )}
        {project.phone && (
          <div>
            <div className="text-sm text-gray-500">Телефон</div>
            <div>{project.phone}</div>
          </div>
        )}
      </div>

      {/* Пользователи */}
      {project.userRoles.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Пользователи
          </div>
          <div className="space-y-2">
            {project.userRoles
              .filter((userRole) => userRole.isActive)
              .map((userRole) => (
                <UserRoleCard key={userRole.id} {...userRole} />
              ))}
          </div>
        </div>
      )}

      {/* Модальные окна */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактирование проекта"
      >
        <EditProjectForm
          project={project}
          onClose={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Модальное окно удаления проекта */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Удаление проекта"
      >
        <div className="space-y-4">
          <p>Вы уверены, что хотите удалить этот проект?</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Удалить
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

// Основной компонент страницы
export default function ProjectsPage() {
  const [filter, setFilter] = useState<{
    type?: ShopType;
    status?: boolean;
    search?: string;
  }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Запрос списка проектов
  const { data: projects, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
  });

  // Фильтрация проектов
  const filteredProjects = projects?.filter((project) => {
    if (filter.type && project.type !== filter.type) return false;
    if (filter.status !== undefined && project.isActive !== filter.status)
      return false;
    if (
      filter.search &&
      !project.name.toLowerCase().includes(filter.search.toLowerCase())
    )
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
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          + Создать проект
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center space-x-4">
          {/* Поиск */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по названию..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filter.search || ''}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Фильтр по типу */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filter.type || ''}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                type: e.target.value as ShopType | undefined,
              }))
            }
          >
            <option value="">Все типы</option>
            <option value={ShopType.SHOP}>Магазины</option>
            <option value={ShopType.WAREHOUSE}>Склады</option>
            <option value={ShopType.POINT_OF_SALE}>Точки продаж</option>
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

      {/* Список проектов */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProjects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Модальное окно создания проекта */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создание нового проекта"
      >
        <CreateProjectForm onClose={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
}
