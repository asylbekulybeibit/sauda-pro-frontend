import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '@/services/managerApi';
import { ProductList } from '@/components/manager/products/ProductList';
import { ProductForm } from '@/components/manager/products/ProductForm';
import { Button, Spin, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Category } from '@/types/category';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
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
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => navigate(`/manager/${shopId}/bulk-operations`)}
            className="!bg-blue-500 !text-white hover:!bg-blue-600"
          >
            Массовые операции
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowForm(true)}
            className="!bg-blue-500 !text-white hover:!bg-blue-600"
          >
            Добавить товар
          </Button>
        </Space>
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
};

export default ProductsPage;
