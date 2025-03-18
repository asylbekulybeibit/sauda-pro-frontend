import { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Table, Spin, message, Modal, Descriptions, Tag } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { getWriteOffs } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import WriteOffForm from '@/components/manager/warehouse/WriteOffForm';
import { InventoryTransaction } from '@/types/inventory';
import { ShopContext } from '@/contexts/ShopContext';
import { useParams } from 'react-router-dom';

// Компонент для просмотра подробной информации о списании
function WriteOffDetails({
  writeOff,
  visible,
  onClose,
}: {
  writeOff: InventoryTransaction | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!writeOff) return null;

  return (
    <Modal
      open={visible}
      title="Информация о списании"
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
      width={800}
    >
      <Descriptions bordered column={2} className="mb-4">
        <Descriptions.Item label="Дата" span={2}>
          {formatDate(writeOff.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Товар" span={2}>
          <div>
            <div className="font-medium">{writeOff.product?.name}</div>
            <div className="text-gray-500">SKU: {writeOff.product?.sku}</div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Количество">
          {writeOff.quantity}
        </Descriptions.Item>
        <Descriptions.Item label="Сумма списания">
          {formatPrice(writeOff.price * writeOff.quantity)}
        </Descriptions.Item>
        <Descriptions.Item label="Цена за единицу">
          {formatPrice(writeOff.price)}
        </Descriptions.Item>
        <Descriptions.Item label="Проведено">
          {writeOff.createdBy?.firstName} {writeOff.createdBy?.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Причина списания" span={2}>
          {writeOff.description || 'Не указана'}
        </Descriptions.Item>
        <Descriptions.Item label="Комментарий" span={2}>
          {writeOff.comment || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

function WriteOffsPage() {
  console.log('WriteOffsPage component rendering');
  const { shopId: urlShopId } = useParams<{ shopId: string }>();
  const { currentShop, loading } = useContext(ShopContext)!;
  const shopId = urlShopId || currentShop?.id;
  const [showForm, setShowForm] = useState(false);
  const [selectedWriteOff, setSelectedWriteOff] =
    useState<InventoryTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  console.log('URL Shop ID:', urlShopId);
  console.log('Current shop:', currentShop);
  console.log('Shop ID:', shopId);
  console.log('Shop context loading:', loading);

  useEffect(() => {
    console.log('WriteOffsPage mounted');
    return () => {
      console.log('WriteOffsPage unmounted');
    };
  }, []);

  const {
    data: writeOffs,
    isLoading: isLoadingWriteOffs,
    error,
    refetch,
  } = useQuery<InventoryTransaction[]>({
    queryKey: ['write-offs', shopId],
    queryFn: async () => {
      if (!shopId) {
        console.error('No shopId provided');
        throw new Error('No shopId provided');
      }

      console.log('Starting write-offs fetch for shop:', shopId);
      try {
        const data = await getWriteOffs(shopId);
        console.log('Write-offs data received:', data);
        return data;
      } catch (error) {
        console.error('Error fetching write-offs:', error);
        message.error('Ошибка при загрузке списаний');
        throw error;
      }
    },
    enabled: !!shopId,
  });

  console.log('Query state:', { isLoadingWriteOffs, error, writeOffs });

  const handleViewWriteOff = (writeOff: InventoryTransaction) => {
    setSelectedWriteOff(writeOff);
    setShowDetailsModal(true);
  };

  // Показываем загрузку, пока ShopContext инициализируется
  if (loading) {
    console.log('Showing ShopContext loading state');
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!shopId) {
    console.error('No shopId available');
    return (
      <div className="p-4 text-red-500">Ошибка: ID магазина не указан</div>
    );
  }

  if (isLoadingWriteOffs) {
    console.log('Showing write-offs loading state');
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    console.error('Render error:', error);
    return (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="text-red-500 mb-4">Ошибка загрузки данных</div>
        <Button onClick={() => refetch()}>Повторить загрузку</Button>
      </div>
    );
  }

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
      key: 'totalPrice',
      render: (_, record: InventoryTransaction) => {
        // Умножаем цену на количество для получения общей суммы
        const totalPrice = record.price * record.quantity;
        return formatPrice(totalPrice);
      },
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
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: InventoryTransaction) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewWriteOff(record)}
          className="bg-blue-500"
        >
          Просмотр
        </Button>
      ),
    },
  ];

  console.log('Rendering main content');
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
        dataSource={writeOffs || []}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {showForm && (
        <WriteOffForm
          shopId={shopId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            message.success('Списание успешно создано');
            refetch();
          }}
        />
      )}

      <WriteOffDetails
        writeOff={selectedWriteOff}
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
}

export default WriteOffsPage;
