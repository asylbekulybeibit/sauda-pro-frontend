import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '@/services/managerApi';
import { ProductList } from '@/components/manager/products/ProductList';
import { ProductForm } from '@/components/manager/products/ProductForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';
import { Category } from '@/types/category';

function ProductsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId!),
    enabled: !!shopId,
  });

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Товары</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
        >
          Добавить товар
        </Button>
      </div>

      {products && (
        <ProductList
          products={products}
          categories={categories || []}
          shopId={shopId!}
        />
      )}

      {showForm && (
        <ProductForm
          categories={categories || []}
          shopId={shopId!}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default ProductsPage;
