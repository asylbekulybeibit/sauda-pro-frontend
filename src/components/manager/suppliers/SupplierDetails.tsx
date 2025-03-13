import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Spin, message, Tabs } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Supplier } from '@/types/supplier';
import { getSupplierById } from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';
import { SupplierProducts } from './SupplierProducts';

interface SupplierDetailsProps {
  supplierId: string;
}

export const SupplierDetails: React.FC<SupplierDetailsProps> = ({
  supplierId,
}) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const data = await getSupplierById(supplierId);
      setSupplier(data);
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
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
              onClick={() => navigate(`/manager/suppliers/${supplierId}/edit`)}
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
