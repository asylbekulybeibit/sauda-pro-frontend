import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Table,
  Space,
  message,
  Spin,
  Typography,
  Tag,
  Select,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getPurchases } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import { useContext } from 'react';
import { ShopContext } from '@/contexts/ShopContext';
import { Purchase } from '@/types/purchase';
import { useRoleStore } from '@/store/roleStore';
import { useGetPaymentMethods } from '../../../hooks/usePaymentMethods';
import { PurchaseDetails } from '@/components/manager/warehouse/PurchaseDetails';

const { Title } = Typography;

function IncomingPage() {
  const navigate = useNavigate();
  const shopContext = useContext(ShopContext);
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'debt'>(
    'all'
  );

  // Получаем ID склада из текущей роли менеджера
  useEffect(() => {
    if (currentRole && currentRole.type === 'shop') {
      if (currentRole.warehouse) {
        setWarehouseId(currentRole.warehouse.id);
        console.log(
          '[IncomingPage] Установлен ID склада:',
          currentRole.warehouse.id
        );
      } else if (currentRole.shop) {
        setWarehouseId(currentRole.shop.id);
        console.log(
          '[IncomingPage] Установлен ID магазина как склад:',
          currentRole.shop.id
        );
      }
    }
  }, [currentRole]);

  // Fetch purchase data
  const {
    data: purchases,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['purchases', warehouseId],
    queryFn: () => getPurchases(warehouseId!),
    enabled: !!warehouseId,
  });

  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } =
    useGetPaymentMethods(warehouseId!);

  useEffect(() => {
    if (error) {
      message.error('Ошибка при загрузке приходов');
      console.error('Error fetching purchases:', error);
    }
  }, [error]);

  // Функция фильтрации приходов
  const getFilteredPurchases = () => {
    if (!purchases) return [];

    return purchases.filter((purchase) => {
      if (paymentFilter === 'all') return true;
      if (paymentFilter === 'paid')
        return purchase.paidAmount >= purchase.totalAmount;
      if (paymentFilter === 'debt')
        return purchase.paidAmount < purchase.totalAmount;
      return true;
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => formatDate(text) || '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>
          {status === 'completed' ? 'Завершен' : 'Черновик'}
        </Tag>
      ),
    },
    {
      title: 'Номер накладной',
      dataIndex: 'number',
      key: 'number',
      render: (text: string, record: Purchase) =>
        text || record.invoiceNumber || '—',
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (text: string, record: Purchase) =>
        text || record.supplier?.name || '—',
    },
    {
      title: 'Количество позиций',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      render: (count: number, record: Purchase) =>
        count || record.items?.length || 0,
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number | string, record: Purchase) => {
        // Если есть явное значение totalAmount, используем его
        if (amount !== undefined && amount !== null) {
          return formatPrice(amount);
        }

        // Если нет, но есть items, рассчитываем сумму
        if (record.items && record.items.length > 0) {
          const total = record.items.reduce((sum, item) => {
            const quantity =
              typeof item.quantity === 'number' ? item.quantity : 0;
            const price =
              typeof item.purchasePrice === 'number' ? item.purchasePrice : 0;
            return sum + quantity * price;
          }, 0);
          return formatPrice(total);
        }

        return formatPrice(0);
      },
    },
    {
      title: 'Статус оплаты',
      key: 'paymentStatus',
      render: (_: any, record: Purchase) => {
        const isPaid = record.paidAmount >= record.totalAmount;
        return (
          <Tag color={isPaid ? 'green' : 'orange'}>
            {isPaid
              ? 'Оплачен'
              : `Долг: ${formatPrice(record.totalAmount - record.paidAmount)}`}
          </Tag>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Purchase) => (
        <Space size="small">
          <Button
            type="link"
            onClick={() =>
              navigate(
                `/manager/${warehouseId}/warehouse/purchases/${record.id}`
              )
            }
          >
            Открыть
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreatePurchase = () => {
    if (!currentRole || currentRole.type !== 'shop' || !currentRole.shop?.id) {
      message.error('Не удалось определить магазин');
      return;
    }
    const targetUrl = `/manager/${currentRole.shop.id}/warehouse/purchases/create`;
    console.log('Create Purchase button clicked, navigating to:', targetUrl);
    navigate(targetUrl);
  };

  const handlePurchaseClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
  };

  if (
    !warehouseId ||
    shopContext?.loading ||
    isLoading ||
    isLoadingPaymentMethods
  ) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
          <p className="ml-2 text-gray-500">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Оприходование</Title>
        <Space>
          <Select
            value={paymentFilter}
            onChange={setPaymentFilter}
            style={{ width: 200 }}
          >
            <Select.Option value="all">Все приходы</Select.Option>
            <Select.Option value="paid">Оплаченные</Select.Option>
            <Select.Option value="debt">С долгом</Select.Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreatePurchase}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Новое оприходование
          </Button>
        </Space>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={getFilteredPurchases()}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Всего ${total} записей`,
            }}
            locale={{
              emptyText: 'Нет данных о приходах',
            }}
          />
        )}
      </Card>

      {selectedPurchase && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onUpdate={refetch}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}

export default IncomingPage;
