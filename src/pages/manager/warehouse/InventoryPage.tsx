import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Table, Tag, Spin, message } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getInventory } from '@/services/managerApi';
import { formatDate } from '@/utils/format';
import { PlusOutlined } from '@ant-design/icons';
import { InventoryForm } from '@/components/manager/warehouse/InventoryForm';
import { Product } from '@/types/product';

interface ProductWithInventory extends Product {
  lastInventoryDate?: string;
}

function InventoryPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: products, isLoading } = useQuery<ProductWithInventory[]>({
    queryKey: ['products', shopId],
    queryFn: async () => {
      const [productsResponse, transactionsResponse] = await Promise.all([
        getProducts(shopId!),
        getInventory(shopId!),
      ]);

      console.log('Products API Response:', productsResponse);
      console.log('Transactions API Response:', transactionsResponse);

      // Получаем последние даты инвентаризации для каждого продукта
      const lastInventoryDates = new Map<number, string>();
      if (transactionsResponse) {
        transactionsResponse.forEach((transaction) => {
          if (transaction.type === 'ADJUSTMENT') {
            const productId = transaction.productId;
            const date = transaction.createdAt;
            if (
              !lastInventoryDates.has(productId) ||
              lastInventoryDates.get(productId)! < date
            ) {
              lastInventoryDates.set(productId, date);
            }
          }
        });
      }

      // Добавляем даты к продуктам
      const productsWithInventory = productsResponse.map(
        (product: Product) => ({
          ...product,
          lastInventoryDate: lastInventoryDates.get(Number(product.id)),
        })
      );

      return productsWithInventory;
    },
    enabled: !!shopId,
  });

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Артикул',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Штрих-код',
      dataIndex: 'barcode',
      key: 'barcode',
    },
    {
      title: 'Текущий остаток',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Последняя инвентаризация',
      dataIndex: 'lastInventoryDate',
      key: 'lastInventoryDate',
      render: (date: string) => (date ? formatDate(date) : 'Не проводилась'),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_: unknown, record: ProductWithInventory) => {
        const needsInventory =
          !record.lastInventoryDate ||
          new Date(record.lastInventoryDate).getTime() <
            new Date().getTime() - 30 * 24 * 60 * 60 * 1000;

        return (
          <Tag color={needsInventory ? 'red' : 'green'}>
            {needsInventory ? 'Требуется проверка' : 'В норме'}
          </Tag>
        );
      },
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
        <h1 className="text-2xl font-semibold">Инвентаризация</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowForm(true)}
          className="bg-blue-500"
        >
          Начать инвентаризацию
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {showForm && (
        <InventoryForm
          shopId={shopId!}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            message.success('Инвентаризация успешно создана');
          }}
        />
      )}
    </div>
  );
}

export default InventoryPage;
