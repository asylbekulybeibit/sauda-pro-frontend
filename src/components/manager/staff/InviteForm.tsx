import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvite } from '@/services/managerApi';
import { RoleType } from '@/types/role';
import { normalizePhoneNumber } from '@/utils/phone';
import { Modal } from 'antd';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка</h3>
          <p className="text-gray-500">{message}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Закрыть
          </button>
        </div>
      </div>
      <div className="fixed inset-0 bg-gray-500 opacity-75 -z-10" />
    </div>
  );
}

interface CreateInviteFormProps {
  onClose: () => void;
  predefinedShopId?: string; // Если задан, селект проекта не показывается
}

interface FormData {
  phone: string;
  role: RoleType;
  shopId: string;
}

export function CreateInviteForm({
  onClose,
  predefinedShopId,
}: CreateInviteFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    role: RoleType.CASHIER,
    shopId: predefinedShopId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createInvite(formData.shopId, {
        phone: normalizePhoneNumber(formData.phone),
        role: RoleType.CASHIER,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = 'Произошла ошибка при отправке приглашения';

      if (error.response?.status === 404) {
        errorMessage =
          'Не удалось отправить приглашение. Пожалуйста, обновите страницу и попробуйте снова.';
      } else if (error.response?.data?.message) {
        // Map backend error messages to user-friendly Russian messages
        const errorMessageMap: Record<string, string> = {
          'Для этого номера телефона уже есть активное приглашение':
            'Для этого номера телефона уже есть активное приглашение. Дождитесь ответа или отмените существующее приглашение.',
          'Этот номер телефона уже зарегистрирован как кассир в вашем магазине':
            'Этот номер телефона уже зарегистрирован как  кассир в вашем магазине.',
          'Invalid phone number format': 'Неверный формат номера телефона',
          'Shop not found': 'Магазин не найден',
          'Cannot invite to this role':
            'У вас нет прав для приглашения сотрудника на эту роль',
        };

        errorMessage =
          errorMessageMap[error.response.data.message] ||
          error.response.data.message;
      }

      setErrorMessage(errorMessage);
      setErrorModalOpen(true);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.phone) {
      errors.phone = 'Введите номер телефона';
    } else {
      try {
        normalizePhoneNumber(formData.phone);
      } catch (error) {
        errors.phone = 'Неверный формат номера телефона';
      }
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    createMutation.mutate();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+]/g, '');
    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));
    setErrors((prev) => ({ ...prev, phone: '' }));
  };

  return (
    <Modal
      title="Приглашение нового сотрудника"
      open={true}
      onCancel={onClose}
      footer={null}
      width={600}
      maskClosable={false}
      centered
      className="invite-form-modal"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div>
          <label htmlFor="phone" className="block text-base text-gray-700 mb-2">
            Телефон *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            className="block w-full h-12 px-4 rounded-lg border border-[#E5E7EB] text-base focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="+7XXXXXXXXXX"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-base text-gray-700 mb-2">
            Роль
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            disabled
            className="block w-full h-12 px-4 rounded-lg border border-[#E5E7EB] text-base bg-white focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-white disabled:opacity-100"
          >
            <option value={RoleType.CASHIER}>Кассир</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-base font-normal text-gray-700 hover:text-gray-900"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-3 text-base font-normal text-white bg-[#6366F1] rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>

      {errorModalOpen && (
        <ErrorModal
          isOpen={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
          message={errorMessage}
        />
      )}
    </Modal>
  );
}
