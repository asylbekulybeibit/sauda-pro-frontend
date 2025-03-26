import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createInvite, getShops, getWarehouses } from '@/services/api';
import { RoleType } from '@/types/role';
import { ErrorModal } from '@/components/ui/error-modal';
import { normalizePhoneNumber } from '@/utils/phone';

interface CreateInviteFormProps {
  onClose: () => void;
  availableRoles?: RoleType[];
  predefinedShopId?: string; // Если задан, селект проекта не показывается
}

export function CreateInviteForm({
  onClose,
  availableRoles,
  predefinedShopId,
}: CreateInviteFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: '',
    role: (availableRoles && availableRoles[0]) || ('cashier' as RoleType),
    shopId: predefinedShopId || '',
    warehouseId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Получаем список проектов только если не задан predefinedShopId
  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: getShops,
    enabled: !predefinedShopId, // Не делаем запрос, если магазин предопределен
  });

  // Добавляем запрос на получение складов
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
    enabled: !!formData.shopId, // Запрашиваем склады только если выбран магазин
  });

  // Устанавливаем роль в зависимости от выбора склада
  useEffect(() => {
    if (availableRoles) return; // Не изменяем роль, если роли предопределены

    if (formData.warehouseId) {
      // Если выбран склад, устанавливаем роль Кассир или Менеджер (если текущая роль - Владелец)
      if (formData.role === RoleType.OWNER) {
        setFormData((prev) => ({ ...prev, role: RoleType.CASHIER }));
      }
    } else {
      // Если склад не выбран, устанавливаем роль Владелец
      setFormData((prev) => ({ ...prev, role: RoleType.OWNER }));
    }
  }, [formData.warehouseId, availableRoles]);

  const createMutation = useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      queryClient.invalidateQueries({ queryKey: ['owner-invites'] });
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
        const normalizedPhone = normalizePhoneNumber(formData.phone);
        setFormData((prev) => ({ ...prev, phone: normalizedPhone }));
      } catch (error) {
        newErrors.phone = 'Неверный формат телефона';
      }
    }

    if (!predefinedShopId && !formData.shopId) {
      newErrors.shopId = 'Выберите сеть';
    }

    // Проверяем warehouseId только если выбрана роль не Owner
    if (formData.role !== RoleType.OWNER && !formData.warehouseId) {
      newErrors.warehouseId = 'Выберите склад';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Если роль - владелец, убираем warehouseId из запроса
    if (formData.role === RoleType.OWNER) {
      const requestData = { ...formData, warehouseId: '' };
      createMutation.mutate(requestData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredWarehouses = warehouses?.filter(
    (warehouse) => warehouse.shopId === formData.shopId
  );

  // Определяем доступные роли в зависимости от выбора склада
  const getAvailableRolesOptions = () => {
    if (availableRoles) {
      // Если роли предопределены извне, используем их
      return availableRoles.map((role) => (
        <option key={role} value={role}>
          {role === RoleType.MANAGER ? 'Менеджер' : 'Кассир'}
        </option>
      ));
    } else if (!formData.warehouseId) {
      // Если склад не выбран, показываем только роль "Владелец"
      return <option value={RoleType.OWNER}>Владелец</option>;
    } else {
      // Если склад выбран, показываем "Менеджер" и "Кассир"
      return (
        <>
          <option value={RoleType.MANAGER}>Менеджер</option>
          <option value={RoleType.CASHIER}>Кассир</option>
        </>
      );
    }
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

        {!predefinedShopId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Сеть *
            </label>
            <select
              value={formData.shopId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shopId: e.target.value,
                  warehouseId: '', // Сбрасываем выбранный склад при смене проекта
                }))
              }
              className={`mt-1 block w-full rounded-md border ${
                errors.shopId ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
            >
              <option value="">Выберите сеть</option>
              {shops?.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            {errors.shopId && (
              <p className="mt-1 text-sm text-red-500">{errors.shopId}</p>
            )}
          </div>
        )}

        {formData.shopId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Склад {formData.role !== RoleType.OWNER && '*'}
            </label>
            <select
              value={formData.warehouseId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  warehouseId: e.target.value,
                }))
              }
              className={`mt-1 block w-full rounded-md border ${
                errors.warehouseId ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
            >
              <option value="">Выберите склад</option>
              {filteredWarehouses?.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}{' '}
                  {warehouse.address && `(${warehouse.address})`}
                </option>
              ))}
            </select>
            {errors.warehouseId && (
              <p className="mt-1 text-sm text-red-500">{errors.warehouseId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.role === RoleType.OWNER
                ? 'Выбор склада для владельца не обязателен'
                : 'Сотрудник будет привязан к выбранному складу'}
            </p>
          </div>
        )}

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
            {getAvailableRolesOptions()}
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
