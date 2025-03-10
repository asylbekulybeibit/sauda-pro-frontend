import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateShop } from '@/services/api';
import { Shop, ShopType } from '@/types/shop';

interface EditProjectFormProps {
  project: Shop;
  onClose: () => void;
}

export function EditProjectForm({ project, onClose }: EditProjectFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: project.name,
    address: project.address || '',
    phone: project.phone || '',
    type: project.type,
    isActive: project.isActive,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: () => updateShop(project.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      onClose();
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (formData.phone && !/^\+7\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
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
        <label className="block text-sm font-medium text-gray-700">Тип</label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              type: e.target.value as ShopType,
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        >
          <option value={ShopType.SHOP}>Магазин</option>
          <option value={ShopType.WAREHOUSE}>Склад</option>
          <option value={ShopType.POINT_OF_SALE}>Точка продаж</option>
        </select>
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
