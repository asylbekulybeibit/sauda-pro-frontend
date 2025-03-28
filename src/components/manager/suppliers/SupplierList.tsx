import React, { useState } from 'react';
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

  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', shopId],
    queryFn: () => getSuppliers(shopId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id, shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      message.success('Поставщик успешно удален');
      setDeleteModalVisible(false);
    },
    onError: (error) => {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    },
  });

  const showModal = async (supplier?: Supplier) => {
    if (supplier) {
      try {
        setLoadingSupplier(true);
        // Получаем актуальные данные поставщика перед редактированием
        const freshData = await getSupplierById(supplier.id, shopId);
        setSelectedSupplier(freshData);
      } catch (error) {
        const apiError = ApiErrorHandler.handle(error);
        message.error(apiError.message);
        return; // Не открываем модальное окно в случае ошибки
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
        okButtonProps={{
          className: '!bg-blue-500 hover:!bg-blue-600',
        }}
      >
        <p>
          Вы уверены, что хотите удалить поставщика {supplierToDelete?.name}?
        </p>
      </Modal>
    </div>
  );
};
