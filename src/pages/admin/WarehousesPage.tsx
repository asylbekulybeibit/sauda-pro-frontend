import { useState } from 'react';
import { motion } from 'framer-motion';
import { Warehouse } from '@/types/warehouse';
import {
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
  getShops,
} from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { CreateWarehouseForm } from '@/components/warehouses/CreateWarehouseForm';
import { EditWarehouseForm } from '@/components/warehouses/EditWarehouseForm';

// Компонент карточки склада
const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Получение данных о магазине
  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
  });

  // Найти магазин по ID
  const shop = shops?.find((s) => s.id === warehouse.shopId);

  const updateStatusMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      updateWarehouse(warehouse.id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWarehouse(warehouse.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  const handleToggleStatus = () => {
    updateStatusMutation.mutate(!warehouse.isActive);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот склад?')) {
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
          <h3 className="text-lg font-semibold">{warehouse.name}</h3>
          <div className="text-sm text-gray-500">
            🏭 Склад {warehouse.isMain && '(Основной)'}
            {shop && ` | 🏪 Магазин: ${shop.name}`}
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
              warehouse.isActive
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-gray-500'
            } transition-colors`}
            title={warehouse.isActive ? 'Деактивировать' : 'Активировать'}
          >
            {warehouse.isActive ? '✅' : '❌'}
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
        {warehouse.address && (
          <div>
            <div className="text-sm text-gray-500">Адрес</div>
            <div>{warehouse.address}</div>
          </div>
        )}
        {warehouse.phone && (
          <div>
            <div className="text-sm text-gray-500">Телефон</div>
            <div>{warehouse.phone}</div>
          </div>
        )}
        {warehouse.email && (
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div>{warehouse.email}</div>
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактирование склада"
      >
        <EditWarehouseForm
          warehouse={warehouse}
          onClose={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Модальное окно удаления склада */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Удаление склада"
      >
        <div className="space-y-4">
          <p>Вы уверены, что хотите удалить этот склад?</p>
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
export default function WarehousesPage() {
  const [filter, setFilter] = useState<{
    status?: boolean;
    search?: string;
  }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Запрос списка складов
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  // Фильтрация складов
  const filteredWarehouses = warehouses?.filter((warehouse) => {
    if (filter.status !== undefined && warehouse.isActive !== filter.status)
      return false;
    if (
      filter.search &&
      !warehouse.name.toLowerCase().includes(filter.search.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">Склады</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          + Создать склад
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

      {/* Список складов */}
      <div className="grid grid-cols-1 gap-6">
        {filteredWarehouses?.map((warehouse) => (
          <WarehouseCard key={warehouse.id} warehouse={warehouse} />
        ))}
      </div>

      {/* Модальное окно создания склада */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создание нового склада"
      >
        <CreateWarehouseForm onClose={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
}
