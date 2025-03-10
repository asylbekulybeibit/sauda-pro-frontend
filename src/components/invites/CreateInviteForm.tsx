import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getShops, createInvite } from '@/services/api';
import { RoleType } from '@/store/roleStore';
import { normalizePhoneNumber } from '@/utils/phone';

interface CreateInviteFormProps {
  onClose: () => void;
}

export function CreateInviteForm({ onClose }: CreateInviteFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: '',
    role: 'cashier' as RoleType,
    shopId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Получаем список магазинов для выбора
  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
  });

  const createMutation = useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Произошла ошибка при отправке инвайта' });
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Проверка телефона
    try {
      normalizePhoneNumber(formData.phone);
    } catch {
      newErrors.phone = 'Неверный формат телефона';
    }

    // Проверка выбора магазина
    if (!formData.shopId) {
      newErrors.shopId = 'Выберите проект';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate({
        ...formData,
        phone: normalizePhoneNumber(formData.phone),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Телефон */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Телефон *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="+7 (XXX) XXX-XX-XX"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Проект */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Проект *
        </label>
        <select
          value={formData.shopId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, shopId: e.target.value }))
          }
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.shopId ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Выберите проект</option>
          {shops?.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name} {shop.address && `(${shop.address})`}
            </option>
          ))}
        </select>
        {errors.shopId && (
          <p className="mt-1 text-sm text-red-600">{errors.shopId}</p>
        )}
      </div>

      {/* Роль */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Роль *
        </label>
        <select
          value={formData.role}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              role: e.target.value as RoleType,
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="owner">👔 Владелец</option>
          <option value="manager">👨‍💼 Менеджер</option>
          <option value="cashier">💰 Кассир</option>
        </select>
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
          disabled={createMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Отправка...' : 'Отправить инвайт'}
        </button>
      </div>
    </form>
  );
}
