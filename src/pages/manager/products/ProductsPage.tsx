import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '@/services/managerApi';
import { ProductList } from '@/components/manager/products/ProductList';
import { Button, Spin, Space, Tabs } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Category } from '@/types/category';
import { ServiceList } from '@/components/manager/products/ServiceList';
import { getWarehouseServices } from '@/services/servicesApi';
import { ServiceForm } from '@/components/manager/products/ServiceForm';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { shopId, warehouseId } = useParams<{
    shopId: string;
    warehouseId: string;
  }>();
  const [showForm, setShowForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [editingService, setEditingService] = useState(null);

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

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['warehouseServices', shopId],
    queryFn: () => getWarehouseServices(shopId!),
    enabled: !!shopId,
  });

  if (isLoadingProducts || isLoadingCategories || isLoadingServices) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Товары и услуги</h1>
        <Space>
          {activeTab === '1' && (
            <>
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
            </>
          )}
          {activeTab === '2' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingService(null);
                setShowServiceForm(true);
              }}
              className="!bg-blue-500 !text-white hover:!bg-blue-600"
            >
              Создать услугу
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: 'Товары',
            children: products ? (
              <ProductList
                products={products}
                categories={categories || []}
                shopId={shopId!}
              />
            ) : null,
          },
          {
            key: '2',
            label: 'Услуги',
            children: services ? (
              <ServiceList
                services={services}
                categories={categories || []}
                shopId={shopId!}
                onServiceCreate={() => {
                  setEditingService(null);
                  setShowServiceForm(true);
                }}
              />
            ) : null,
          },
        ]}
      />

     

      {showServiceForm && (
        <ServiceForm
          service={editingService}
          categories={categories || []}
          shopId={shopId!}
          onClose={() => {
            setShowServiceForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductsPage;
