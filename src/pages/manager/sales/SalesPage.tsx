import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Spin, Table } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';
import { getSales } from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { formatDate } from '@/utils/date';
import type { InventoryTransaction } from '@/types/inventory';

function SalesPage() {
  const { shopId } = useParams<{ shopId: string }>();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', shopId],
    queryFn: () => getSales(shopId!),
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
      title: 'Сумма',
      key: 'total',
      render: (record: InventoryTransaction) =>
        formatPrice((record.price || 0) * record.quantity),
    },
    {
      title: 'Кассир',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (user: any) => user.name,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">История продаж</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            dataSource={sales}
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
    </div>
  );
}

export default SalesPage;
