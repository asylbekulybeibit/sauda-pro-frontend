import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tooltip, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierForm } from './SupplierForm';
import { Supplier } from '@/types/supplier';
import {
  deleteSupplier,
  getSuppliers,
  getSupplierById,
} from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierListProps {
  shopId: string;
}

export const SupplierList: React.FC<SupplierListProps> = ({ shopId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<
    Supplier | undefined
  >();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<
    Supplier | undefined
  >();
  const [loadingSupplier, setLoadingSupplier] = useState(false);

  useEffect(() => {
    console.log('[SupplierList] Mounted with shopId:', shopId);
    return () => {
      console.log('[SupplierList] Unmounting');
    };
  }, [shopId]);

  const queryClient = useQueryClient();

  const {
    data: suppliers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['suppliers', shopId],
    queryFn: async () => {
      console.log('[SupplierList] Fetching suppliers for shopId:', shopId);
      try {
        const data = await getSuppliers(shopId);
        console.log('[SupplierList] Suppliers data received:', data);
        return data;
      } catch (err) {
        console.error('[SupplierList] Error fetching suppliers:', err);
        message.error('Ошибка при загрузке списка поставщиков');
        throw err;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('[SupplierList] Deleting supplier:', id);
      return deleteSupplier(id, shopId);
    },
    onSuccess: () => {
      console.log('[SupplierList] Supplier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      message.success('Поставщик успешно удален');
      setDeleteModalVisible(false);
    },
    onError: (err) => {
      console.error('[SupplierList] Delete mutation error:', err);
      const apiError = ApiErrorHandler.handle(err);
      message.error(apiError.message);
    },
  });

  const showModal = async (supplier?: Supplier) => {
    console.log('[SupplierList] Opening modal for supplier:', supplier);
    if (supplier) {
      try {
        setLoadingSupplier(true);
        console.log(
          '[SupplierList] Fetching fresh supplier data:',
          supplier.id
        );
        const freshData = await getSupplierById(supplier.id, shopId);
        console.log('[SupplierList] Fresh supplier data received:', freshData);
        setSelectedSupplier(freshData);
      } catch (err) {
        console.error('[SupplierList] Error fetching supplier details:', err);
        const apiError = ApiErrorHandler.handle(err);
        message.error(apiError.message);
        return;
      } finally {
        setLoadingSupplier(false);
      }
    } else {
      setSelectedSupplier(undefined);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedSupplier(undefined);
  };

  const showDeleteConfirm = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (supplierToDelete) {
      await deleteMutation.mutateAsync(supplierToDelete.id);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
    },
    {
      title: 'Контактное лицо',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: '15%',
      render: (text: string) => text || '—',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: '10%',
      render: (text: string) => text || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '15%',
      render: (text: string) => text || '—',
    },
    {
      title: 'Адрес',
      dataIndex: 'address',
      key: 'address',
      width: '15%',
      render: (text: string) => text || '—',
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      width: '20%',
      render: (text: string) => {
        if (!text) return '—';
        return text.length > 50 ? (
          <Tooltip title={text}>{text.substring(0, 50)}...</Tooltip>
        ) : (
          text
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: '10%',
      render: (_: unknown, record: Supplier) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            loading={loadingSupplier && selectedSupplier?.id === record.id}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record)}
            danger
          />
        </div>
      ),
    },
  ];

  if (error) {
    console.error('[SupplierList] Rendering error state:', error);
    return (
      <div className="text-center text-red-500">Ошибка при загрузке данных</div>
    );
  }

  console.log('[SupplierList] Rendering with suppliers:', suppliers);

  return (
    <div>
      <div className="mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          className="!bg-blue-500 hover:!bg-blue-600"
        >
          Добавить поставщика
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={suppliers}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
        }}
      />

      {(isModalVisible || loadingSupplier) && (
        <SupplierForm
          shopId={shopId}
          initialData={selectedSupplier}
          visible={isModalVisible && !loadingSupplier}
          onClose={handleCloseModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            handleCloseModal();
          }}
        />
      )}

      <Modal
        title="Подтверждение удаления"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p>
          Вы уверены, что хотите удалить поставщика "
          {supplierToDelete?.name || ''}"?
        </p>
      </Modal>
    </div>
  );
};
