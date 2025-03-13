import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { SupplierForm } from '@/components/manager/suppliers/SupplierForm';
import { getSupplierById } from '@/services/managerApi';
import { Supplier } from '@/types/supplier';
import { useShop } from '@/hooks/useShop';
import { ApiErrorHandler } from '@/utils/error-handler';

export const SupplierFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchSupplier = async () => {
        try {
          setLoading(true);
          const data = await getSupplierById(id);
          setSupplier(data);
        } catch (error) {
          const apiError = ApiErrorHandler.handle(error);
          message.error(apiError.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSupplier();
    }
  }, [id]);

  if (!currentShop) {
    return <div>Магазин не выбран</div>;
  }

  if (id && loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2>{id ? 'Редактирование поставщика' : 'Новый поставщик'}</h2>
      <SupplierForm
        shopId={currentShop.id}
        initialData={supplier}
        onSuccess={() => {
          navigate('/manager/suppliers');
          message.success(
            id ? 'Поставщик успешно обновлен' : 'Поставщик успешно создан'
          );
        }}
      />
    </div>
  );
};
