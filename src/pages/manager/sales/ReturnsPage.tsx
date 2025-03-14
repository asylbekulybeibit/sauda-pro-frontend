import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Spin, Table } from 'antd';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { getReturns } from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { formatDate } from '@/utils/date';
import type { InventoryTransaction } from '@/types/inventory';
import { ReturnForm } from '@/components/manager/sales/ReturnForm';

function ReturnsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns', shopId],
    queryFn: () => getReturns(shopId!),
    enabled: !!shopId,
  });

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
      render: (product: any) => product.name,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Сумма возврата',
      key: 'total',
      render: (record: InventoryTransaction) =>
        formatPrice((record.price || 0) * record.quantity),
    },
    {
      title: 'Причина',
      dataIndex: 'note',
      key: 'reason',
      render: (note: string | null | undefined) => note || '-',
    },
    {
      title: 'Сотрудник',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      render: (name: string) => name || '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Возвраты</h1>
        <Button
          type="primary"
          icon={<ArrowUturnLeftIcon className="h-5 w-5" />}
          onClick={() => setShowForm(true)}
          className="bg-blue-500"
        >
          Оформить возврат
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            dataSource={returns}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Всего ${total} записей`,
            }}
          />
        </div>
      )}

      {showForm && (
        <ReturnForm
          shopId={shopId!}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default ReturnsPage;
