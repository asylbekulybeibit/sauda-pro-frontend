import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, Tag, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getTransfers } from '@/services/managerApi';
import { Transfer } from '@/types/transfer';
import { formatDate } from '@/utils/format';
import { TransferForm } from '@/components/manager/warehouse/TransferForm';

function TransfersPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['transfers', shopId],
    queryFn: () => getTransfers(shopId!),
    enabled: !!shopId,
  });

  const getStatusColor = (status: Transfer['status']) => {
    const colors = {
      draft: 'gray',
      pending: 'gold',
      completed: 'green',
      cancelled: 'red',
    };
    return colors[status];
  };

  const getStatusName = (status: Transfer['status']) => {
    const names = {
      draft: 'Черновик',
      pending: 'В процессе',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return names[status];
  };

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Откуда',
      dataIndex: 'fromShopId',
      key: 'fromShop',
    },
    {
      title: 'Куда',
      dataIndex: 'toShopId',
      key: 'toShop',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: Transfer['status']) => (
        <Tag color={getStatusColor(status)}>{getStatusName(status)}</Tag>
      ),
    },
    {
      title: 'Товаров',
      dataIndex: 'items',
      key: 'itemsCount',
      render: (items: Transfer['items']) => items.length,
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment?: string) => comment || '-',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Перемещения</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowForm(true)}
          className="bg-blue-500"

        >
          Создать перемещение
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={transfers}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
          defaultPageSize: 10,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {showForm && (
        <TransferForm
          shopId={shopId!}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            message.success('Перемещение успешно создано');
          }}
        />
      )}
    </div>
  );
}

export default TransfersPage;
