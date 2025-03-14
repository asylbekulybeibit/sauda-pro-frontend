import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryTransaction } from '@/types/inventory';
import { getProducts } from '@/services/managerApi';
import {
  createInventoryTransaction,
  updateInventoryTransaction,
} from '@/services/managerApi';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';

interface InventoryFormProps {
  transaction?: InventoryTransaction;
  onClose: () => void;
}

export function InventoryForm({ transaction, onClose }: InventoryFormProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const [formData, setFormData] = useState({
    type: transaction?.type || 'PURCHASE',
    productId: transaction?.product?.id?.toString() || '',
    quantity: transaction?.quantity.toString() || '',
    comment: transaction?.comment || '',
  });

  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  const createMutation = useMutation({
    mutationFn: (
      data: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'>
    ) => createInventoryTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InventoryTransaction>;
    }) => updateInventoryTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: formData.type as InventoryTransaction['type'],
      quantity: parseInt(formData.quantity),
      productId: parseInt(formData.productId),
      shopId: parseInt(shopId!),
      comment: formData.comment,
    };

    if (transaction) {
      await updateMutation.mutateAsync({
        id: transaction.id.toString(),
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {transaction ? 'Редактировать транзакцию' : 'Создать транзакцию'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Тип транзакции
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="PURCHASE">Закупка</option>
                <option value="SALE">Продажа</option>
                <option value="ADJUSTMENT">Корректировка</option>
                <option value="RETURN">Возврат</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="productId"
                className="block text-sm font-medium text-gray-700"
              >
                Товар
              </label>
              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Выберите товар</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Количество
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700"
            >
              Комментарий
            </label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {transaction ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
