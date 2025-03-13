import React, { useEffect, useState } from 'react';
import { getSuppliers, deleteSupplier } from '@/services/managerApi';
import { Supplier } from '@/types/supplier';
import { Button, Table, Modal, message } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierListProps {
  shopId: string;
}

export const SupplierList: React.FC<SupplierListProps> = ({ shopId }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers(shopId);
      setSuppliers(data);
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [shopId]);

  const handleDelete = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedSupplier) return;

    try {
      await deleteSupplier(selectedSupplier.id);
      message.success('Поставщик успешно удален');
      fetchSuppliers();
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setDeleteModalVisible(false);
      setSelectedSupplier(null);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Контактное лицо',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Активен' : 'Неактивен'}
        </span>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, supplier: Supplier) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/manager/suppliers/${supplier.id}`)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/manager/suppliers/${supplier.id}/edit`)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(supplier)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <h2>Поставщики</h2>
        <Button
          type="primary"
          onClick={() => navigate('/manager/suppliers/new')}
        >
          Добавить поставщика
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={suppliers}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="Подтверждение удаления"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedSupplier(null);
        }}
        okText="Удалить"
        cancelText="Отмена"
      >
        <p>
          Вы уверены, что хотите удалить поставщика{' '}
          <strong>{selectedSupplier?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
};
