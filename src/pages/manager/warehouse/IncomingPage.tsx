import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Table,
  Space,
  message,
  Tabs,
  Spin,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getPurchases } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import { useContext } from 'react';
import { ShopContext } from '@/contexts/ShopContext';
import { Purchase } from '@/types/purchase';

const { Title } = Typography;
const { TabPane } = Tabs;

function IncomingPage() {
  const navigate = useNavigate();
  const shopContext = useContext(ShopContext);
  const shopId = shopContext?.currentShop?.id || '';

  // State for the purchases list
  const [activeTab, setActiveTab] = useState<string>('draft');

  // Filter purchases based on the active tab
  const filterPurchasesByTab = (purchases: Purchase[] | undefined) => {
    if (!purchases) return [];

    if (activeTab === 'all') return purchases;
    if (activeTab === 'draft')
      return purchases.filter((p) => p.status !== 'completed');
    if (activeTab === 'completed')
      return purchases.filter((p) => p.status === 'completed');

    return purchases;
  };

  // Fetch purchase data
  const {
    data: allPurchases,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchases', shopId],
    queryFn: () => getPurchases(shopId),
    enabled: !!shopId,
  });

  // Filtered purchases based on active tab
  const purchases = filterPurchasesByTab(allPurchases);

  useEffect(() => {
    if (error) {
      message.error('Ошибка при загрузке приходов');
      console.error('Error fetching purchases:', error);
    }
  }, [error]);

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
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Purchase) => (
        <Space size="small">
          <Button
            type="link"
            onClick={() =>
              navigate(`/manager/${shopId}/warehouse/purchases/${record.id}`)
            }
          >
            Открыть
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreatePurchase = () => {
    // Изменяем формат URL, чтобы shopId был частью пути, а не query-параметром
    const targetUrl = `/manager/${shopId}/warehouse/purchases/create`;
    console.log('Create Purchase button clicked, navigating to:', targetUrl);
    navigate(targetUrl);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Приход товара</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreatePurchase}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Создать приход
        </Button>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-4">
          <TabPane tab={`Все (${allPurchases?.length || 0})`} key="all" />
          <TabPane
            tab={`Черновики (${
              allPurchases?.filter((p) => p.status !== 'completed')?.length || 0
            })`}
            key="draft"
          />
          <TabPane
            tab={`Завершенные (${
              allPurchases?.filter((p) => p.status === 'completed')?.length || 0
            })`}
            key="completed"
          />
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={purchases || []}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
            locale={{
              emptyText: 'Нет данных о приходах',
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default IncomingPage;
