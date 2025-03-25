import React, { useEffect, useState, useCallback } from 'react';
import { Card, Descriptions, Button, Spin, message, Tabs, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Supplier } from '@/types/supplier';
import { getSupplierById, getWarehouses } from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';
import { SupplierProducts } from './SupplierProducts';

interface SupplierDetailsProps {
  supplierId: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export const SupplierDetails: React.FC<SupplierDetailsProps> = ({
  supplierId,
}) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supplierData = await getSupplierById(supplierId, shopId || '');
      setSupplier(supplierData);

      // Если у поставщика есть привязка к складу, загружаем информацию о складе
      if (supplierData.warehouseId) {
        const warehousesData = await getWarehouses(shopId || '');
        const supplierWarehouse = warehousesData.find(
          (w: Warehouse) => w.id === supplierData.warehouseId
        );
        setWarehouse(supplierWarehouse || null);
      }
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      if (ApiErrorHandler.isNotFoundError(apiError)) {
        message.error('Поставщик не найден');
        navigate(`/manager/${shopId}/suppliers`);
      } else {
        message.error(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  }, [supplierId, shopId, navigate]);

  useEffect(() => {
    if (shopId) {
      fetchData();
    }
  }, [shopId, fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!supplier) {
    return <div>Поставщик не найден</div>;
  }

  const items = [
    {
      key: 'info',
      label: 'Информация',
      children: (
        <Card
          title="Детали поставщика"
          extra={
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/manager/${shopId}/suppliers/${supplierId}/edit`)
              }
            >
              Редактировать
            </Button>
          }
        >
          <Descriptions column={2}>
            <Descriptions.Item label="Название">
              {supplier.name}
            </Descriptions.Item>
            <Descriptions.Item label="Контактное лицо">
              {supplier.contactPerson}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {supplier.email}
            </Descriptions.Item>
            <Descriptions.Item label="Телефон">
              {supplier.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Адрес">
              {supplier.address || 'Не указан'}
            </Descriptions.Item>
            <Descriptions.Item label="Склад">
              {supplier.warehouseId ? (
                warehouse ? (
                  <Tag color="blue">{warehouse.name}</Tag>
                ) : (
                  'Склад не найден'
                )
              ) : (
                'Все склады'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Статус">
              <span style={{ color: supplier.isActive ? 'green' : 'red' }}>
                {supplier.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'products',
      label: 'Товары',
      children: <SupplierProducts supplierId={supplierId} />,
    },
  ];

  return <Tabs items={items} />;
};
