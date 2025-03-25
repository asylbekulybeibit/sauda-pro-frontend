import React, { useEffect, useState, useCallback } from 'react';
import {
  getSuppliers,
  deleteSupplier,
  getWarehouses,
} from '@/services/managerApi';
import { Supplier } from '@/types/supplier';
import { Button, Table, Modal, message, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierListProps {
  shopId: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export const SupplierList: React.FC<SupplierListProps> = ({ shopId }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Record<string, Warehouse>>({});
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [suppliersData, warehousesData] = await Promise.all([
        getSuppliers(shopId),
        getWarehouses(shopId),
      ]);

      // Преобразуем массив складов в объект для быстрого доступа по id
      const warehousesMap: Record<string, Warehouse> = {};
      warehousesData.forEach((warehouse: Warehouse) => {
        warehousesMap[warehouse.id] = warehouse;
      });

      setSuppliers(suppliersData);
      setWarehouses(warehousesMap);
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedSupplier) return;

    try {
      await deleteSupplier(selectedSupplier.id, shopId);
      message.success('Поставщик успешно удален');
      fetchData();
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
      title: 'Склад',
      key: 'warehouse',
      render: (supplier: Supplier) => {
        if (!supplier.warehouseId) {
          return <span>Все склады</span>;
        }

        const warehouse = warehouses[supplier.warehouseId];
        return warehouse ? (
          <Tag color="blue">{warehouse.name}</Tag>
        ) : (
          <span>Неизвестный склад</span>
        );
      },
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
            onClick={() =>
              navigate(`/manager/${shopId}/suppliers/${supplier.id}`)
            }
          />
          <Button
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/manager/${shopId}/suppliers/${supplier.id}/edit`)
            }
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
        <Button
          type="primary"
          onClick={() => navigate(`/manager/${shopId}/suppliers/new`)}
          className="bg-blue-500"
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
        okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-500' }}
        cancelButtonProps={{ className: 'bg-blue-500 hover:bg-blue-500' }}
      >
        <p>
          Вы уверены, что хотите удалить поставщика{' '}
          <strong>{selectedSupplier?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
};
