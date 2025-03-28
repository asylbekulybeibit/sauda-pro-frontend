import React, { useEffect, useState, useCallback } from 'react';
import {
  getSuppliers,
  deleteSupplier,
  getWarehouses,
  Warehouse,
} from '@/services/managerApi';
import { Supplier } from '@/types/supplier';
import { Button, Table, Modal, message, Tag, Space } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiErrorHandler } from '@/utils/error-handler';
import { useRoleStore } from '@/store/roleStore';

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
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(
    null
  );
  const navigate = useNavigate();
  const { currentRole } = useRoleStore();
  const { warehouseId: urlWarehouseId } = useParams<{ warehouseId: string }>();

  // Получаем ID склада из URL или из текущей роли менеджера
  const warehouseId =
    urlWarehouseId ||
    (currentRole?.type === 'shop' ? currentRole.warehouse?.id : undefined);

  // Добавляем лог для отслеживания текущего склада
  useEffect(() => {
    console.log('=== ИНФОРМАЦИЯ О ТЕКУЩЕМ СКЛАДЕ (SupplierList) ===');
    console.log('URL warehouseId:', urlWarehouseId);
    console.log('Роль менеджера:', currentRole);
    console.log(
      'Warehouse из роли:',
      currentRole?.type === 'shop' ? currentRole.warehouse : 'Нет'
    );
    console.log('Итоговый warehouseId:', warehouseId);
    console.log('===============================================');
  }, [urlWarehouseId, currentRole, warehouseId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Получаем информацию о текущем складе
      if (warehouseId) {
        console.log(
          `Загрузка информации о складе ${warehouseId} для магазина ${shopId}`
        );
        const warehousesData = await getWarehouses(shopId);
        console.log('Все склады магазина:', warehousesData);

        const warehouse = warehousesData.find(
          (w: Warehouse) => w.id === warehouseId
        );
        if (warehouse) {
          console.log('Найден текущий склад:', warehouse);
          setCurrentWarehouse(warehouse);
        } else {
          console.warn(
            `Склад с ID ${warehouseId} не найден в списке складов магазина ${shopId}`
          );
        }
      }

      // Получаем поставщиков для магазина
      console.log(`Загрузка поставщиков для магазина ${shopId}`);
      const suppliersData = await getSuppliers(shopId);
      console.log(
        `Загружено ${suppliersData.length} поставщиков:`,
        suppliersData
      );
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [shopId, warehouseId]);

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
          alignItems: 'center',
        }}
      >
        <Button
          type="primary"
          onClick={() =>
            navigate(
              `/manager/${shopId}/suppliers/warehouse/${warehouseId}/new`
            )
          }
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
