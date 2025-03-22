import { useState } from 'react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { ProductForm } from './ProductForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProduct } from '@/services/managerApi';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';
import { Modal, Button } from 'antd';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  shopId: string;
}

export function ProductList({
  products,
  categories,
  shopId,
}: ProductListProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const showDeleteConfirm = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleDeleteConfirm = async () => {
    if (deletingProduct) {
      await deleteMutation.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingProduct(null);
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
                Название
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
                Цена
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
                Мин. количество
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Штрихкод
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getCategoryName(product.categoryId)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPrice(product.sellingPrice)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.quantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {product.minQuantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.barcode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(product)}
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

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          shopId={shopId}
        />
      )}

      <Modal
        title="Подтвердите действие"
        open={!!deletingProduct}
        onCancel={handleDeleteCancel}
        footer={null}
        centered
      >
        <p className="mb-4">
          Вы уверены, что хотите удалить товар "{deletingProduct?.name}"?
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
