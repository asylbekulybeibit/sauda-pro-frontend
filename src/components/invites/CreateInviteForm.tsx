import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createInvite, getShops } from '@/services/api';
import { RoleType } from '@/types/role';
import { ErrorModal } from '@/components/ui/error-modal';
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
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Получаем список проектов
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
      const message =
        error.response?.data?.message ||
        'Произошла ошибка при создании инвайта';
      setErrorMessage(message);
      setErrorModalOpen(true);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен';
    } else {
      try {
        // Normalize the phone number before validation
        const normalizedPhone = normalizePhoneNumber(formData.phone);
        // Update the form data with the normalized phone number
        setFormData((prev) => ({ ...prev, phone: normalizedPhone }));
      } catch (error) {
        newErrors.phone = 'Неверный формат телефона';
      }
    }

    if (!formData.shopId) {
      newErrors.shopId = 'Выберите проект';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Телефон *
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
          <label className="block text-sm font-medium text-gray-700">
            Проект *
          </label>
          <select
            value={formData.shopId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, shopId: e.target.value }))
            }
            className={`mt-1 block w-full rounded-md border ${
              errors.shopId ? 'border-red-500' : 'border-gray-300'
            } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
          >
            <option value="">Выберите проект</option>
            {shops?.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name} {shop.address && `(${shop.address})`}
              </option>
            ))}
          </select>
          {errors.shopId && (
            <p className="mt-1 text-sm text-red-500">{errors.shopId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Роль
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                role: e.target.value as RoleType,
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="owner">Владелец</option>
            <option value="manager">Менеджер</option>
            <option value="cashier">Кассир</option>
          </select>
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
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>

      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </>
  );
}
