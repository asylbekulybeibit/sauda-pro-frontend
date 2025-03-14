import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, Tag, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getInventory } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import WriteOffForm from '@/components/manager/warehouse/WriteOffForm';
import { InventoryTransaction } from '@/types/inventory';

function WriteOffsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['inventory-transactions', shopId],
    queryFn: () => getInventory(shopId!),
    enabled: !!shopId,
  });

  // Filter only write-off transactions
  const writeOffs =
    transactions?.filter((transaction) => transaction.type === 'WRITE_OFF') ||
    [];

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Товар',
      dataIndex: 'product',
      key: 'product',
      render: (product: { name: string; sku: string }) => (
        <div>
          <div>{product.name}</div>
          <div className="text-gray-500 text-sm">{product.sku}</div>
        </div>
      ),
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Сумма списания',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Причина',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || 'Не указана',
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment: string) => comment || '-',
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
        <h1 className="text-2xl font-semibold">Списания</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowForm(true)}
          className="bg-blue-500"

        >
          Создать списание
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={writeOffs}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {showForm && (
        <WriteOffForm
          shopId={shopId!}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            message.success('Списание успешно создано');
          }}
        />
      )}
    </div>
  );
}

export default WriteOffsPage;
