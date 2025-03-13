import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getProducts, getCategories } from '@/services/managerApi';
import { ProductList } from '@/components/manager/products/ProductList';
import { ProductForm } from '@/components/manager/products/ProductForm';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/outline';

export default function ProductsPage() {
  const { shopId } = useParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId!),
    enabled: !!shopId,
  });

  if (isLoadingProducts) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить товар
        </Button>
      </div>

      {/* Список товаров */}
      <ProductList products={products || []} categories={categories || []} />

      {/* Модальное окно создания товара */}
      {isCreateModalOpen && (
        <ProductForm
          categories={categories || []}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
