import React, { useState } from 'react';
import { Table, Button, Modal, message } from 'antd';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBarcode } from '@/services/managerApi';

interface BarcodeTableProps {
  barcodes: any[];
  shopId: string;
  onEdit: (barcode: any) => void;
}

export function BarcodeTable({ barcodes, shopId, onEdit }: BarcodeTableProps) {
  const [deletingBarcode, setDeletingBarcode] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBarcode(id, shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      message.success('Штрихкод успешно удален');
    },
    onError: (error) => {
      message.error('Ошибка при удалении штрихкода');
      console.error('Error deleting barcode:', error);
    },
  });

  const showDeleteConfirm = (barcode: any) => {
    setDeletingBarcode(barcode);
  };

  const handleDeleteConfirm = async () => {
    if (deletingBarcode) {
      await deleteMutation.mutateAsync(deletingBarcode.id);
      setDeletingBarcode(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingBarcode(null);
  };

  const columns = [
    {
      title: 'Штрихкод',
      dataIndex: 'code',
      key: 'code',
      width: '20%',
    },
    {
      title: 'Название',
      dataIndex: 'productName',
      key: 'productName',
      width: '25%',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
      render: (text: string) => text || '—',
    },
    {
      title: 'Категория',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: '20%',
      render: (text: string) => text || 'Без категории',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: '10%',
      render: (_: any, record: any) => (
        <div className="flex space-x-2">
          <Button
            type="text"
            icon={<PencilIcon className="w-5 h-5" />}
            onClick={() => onEdit(record)}
          />
          <Button
            type="text"
            icon={<TrashIcon className="w-5 h-5 text-red-500" />}
            onClick={() => showDeleteConfirm(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={barcodes}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
        }}
      />

      <Modal
        title="Подтверждение удаления"
        open={!!deletingBarcode}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Удалить"
        cancelText="Отмена"
        confirmLoading={deleteMutation.isPending}
      >
        <p>
          Вы уверены, что хотите удалить штрихкод "
          {deletingBarcode?.productName}"?
        </p>
      </Modal>
    </>
  );
}
