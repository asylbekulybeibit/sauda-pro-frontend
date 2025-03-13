import { useState } from 'react';
import { InventoryTransaction } from '@/types/inventory';
import { InventoryForm } from './InventoryForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInventoryTransaction } from '@/services/managerApi';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/format';

interface InventoryListProps {
  transactions: InventoryTransaction[];
}

export function InventoryList({ transactions }: InventoryListProps) {
  const [editingTransaction, setEditingTransaction] =
    useState<InventoryTransaction | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    },
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
      await deleteMutation.mutateAsync(id.toString());
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'Продажа';
      case 'PURCHASE':
        return 'Закупка';
      case 'ADJUSTMENT':
        return 'Корректировка';
      case 'RETURN':
        return 'Возврат';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'text-red-600';
      case 'PURCHASE':
        return 'text-green-600';
      case 'ADJUSTMENT':
        return 'text-yellow-600';
      case 'RETURN':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
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
                Дата
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Тип
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Товар
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Количество
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Комментарий
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(transaction.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${getTransactionTypeColor(
                      transaction.type
                    )}`}
                  >
                    {getTransactionTypeText(transaction.type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.product?.name || 'Неизвестный товар'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.quantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.comment || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
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

      {editingTransaction && (
        <InventoryForm
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}
