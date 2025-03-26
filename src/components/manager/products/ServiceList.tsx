import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Category } from '@/types/category';
import { deleteWarehouseService } from '@/services/servicesApi';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';
import { Modal, Button } from 'antd';

// Interface for warehouse service
interface WarehouseService {
  id: string;
  barcodeId: string;
  warehouseId: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  barcode: {
    id: string;
    code: string;
    productName: string;
    description?: string;
    categoryId?: string;
    isService: boolean;
  };
}

interface ServiceListProps {
  services: WarehouseService[];
  categories: Category[];
  shopId: string;
  onServiceCreate: () => void;
  onServiceEdit?: (service: WarehouseService) => void;
}

export function ServiceList({
  services,
  categories,
  shopId,
  onServiceCreate,
  onServiceEdit,
}: ServiceListProps) {
  const [deletingService, setDeletingService] =
    useState<WarehouseService | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouseService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseServices'] });
    },
  });

  const showDeleteConfirm = (service: WarehouseService) => {
    setDeletingService(service);
  };

  const handleDeleteConfirm = async () => {
    if (deletingService) {
      await deleteMutation.mutateAsync(deletingService.id);
      setDeletingService(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingService(null);
  };

  const handleEditService = (service: WarehouseService) => {
    if (onServiceEdit) {
      onServiceEdit(service);
    }
  };

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Без категории';
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Неизвестная категория';
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Штрихкод
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Наименование
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Категория
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Комментарий
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Цена
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {service.barcode?.code || '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {service.barcode?.productName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getCategoryName(service.barcode?.categoryId)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {service.barcode?.description || '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPrice(service.price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleEditService(service)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(service)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title="Подтвердите действие"
        open={!!deletingService}
        onCancel={handleDeleteCancel}
        footer={null}
        centered
      >
        <p className="mb-4">
          Вы уверены, что хотите удалить услугу "
          {deletingService?.barcode?.productName}"?
        </p>
        <div className="flex justify-end space-x-3">
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button
            type="primary"
            onClick={handleDeleteConfirm}
            loading={deleteMutation.isPending}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
}
