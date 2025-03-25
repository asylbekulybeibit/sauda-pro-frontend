import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateWarehouse, getShops } from '@/services/api';
import { Warehouse } from '@/types/warehouse';
import { Shop } from '@/types/shop';

interface EditWarehouseFormProps {
  warehouse: Warehouse;
  onClose: () => void;
}

export function EditWarehouseForm({
  warehouse,
  onClose,
}: EditWarehouseFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: warehouse.name,
    address: warehouse.address || '',
    phone: warehouse.phone || '',
    email: warehouse.email || '',
    isMain: warehouse.isMain,
    isActive: warehouse.isActive,
    shopId: warehouse.shopId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Получение списка магазинов
  const { data: shops, isLoading: isLoadingShops } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateWarehouse(warehouse.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onClose();
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (!formData.shopId) {
      newErrors.shopId = 'Магазин обязателен';
    }

    if (formData.phone && !/^\+7\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    updateMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Магазин *
        </label>
        <select
          value={formData.shopId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, shopId: e.target.value }))
          }
          className={`mt-1 block w-full rounded-md border ${
            errors.shopId ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
          disabled={isLoadingShops}
        >
          {isLoadingShops ? (
            <option>Загрузка магазинов...</option>
          ) : (
            shops?.map((shop: Shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))
          )}
        </select>
        {errors.shopId && (
          <p className="mt-1 text-sm text-red-500">{errors.shopId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Название *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className={`mt-1 block w-full rounded-md border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Адрес</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, address: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Телефон
        </label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          placeholder="+7XXXXXXXXXX"
          className={`mt-1 block w-full rounded-md border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="text"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className={`mt-1 block w-full rounded-md border ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isMain"
          checked={formData.isMain}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isMain: e.target.checked }))
          }
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isMain" className="ml-2 text-sm text-gray-700">
          Основной склад
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
          }
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}
