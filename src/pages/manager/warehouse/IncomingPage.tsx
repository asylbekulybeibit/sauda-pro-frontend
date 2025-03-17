import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Table,
  Tag,
  Spin,
  message,
  Input,
  Select,
  DatePicker,
  Card,
  Space,
  Dropdown,
  Modal,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import {
  getPurchases,
  deletePurchase,
  getPurchaseById,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { formatDate, formatDateTime } from '@/utils/date';
import {
  PlusOutlined,
  DownloadOutlined,
  FilterOutlined,
  EllipsisOutlined,
  PrinterOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { PurchaseForm } from '@/components/manager/warehouse/PurchaseForm';
import PurchaseDetails from '@/components/manager/warehouse/PurchaseDetails';
import dayjs from 'dayjs';
import type { Purchase } from '@/types/purchase';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

function IncomingPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: purchases = [],
    isLoading,
    refetch,
  } = useQuery<Purchase[]>({
    queryKey: ['purchases', shopId],
    queryFn: async () => {
      console.log('Fetching purchases for shopId:', shopId);
      try {
        const response = await getPurchases(shopId!);
        console.log('API Response:', response);
        console.log('API Response type:', typeof response);
        console.log('API Response is array:', Array.isArray(response));
        if (Array.isArray(response)) {
          console.log('API Response length:', response.length);
          if (response.length > 0) {
            console.log('First item:', response[0]);
          }
        }
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching purchases:', error);
        return [];
      }
    },
    enabled: !!shopId,
  });

  // Логируем состояние purchases после загрузки
  useEffect(() => {
    console.log('Purchases state:', purchases);
    console.log('Purchases state type:', typeof purchases);
    console.log('Purchases state is array:', Array.isArray(purchases));
    if (Array.isArray(purchases)) {
      console.log('Purchases state length:', purchases.length);
    }
  }, [purchases]);

  // Получаем уникальный список поставщиков
  const suppliers = useMemo(() => {
    if (!purchases || !Array.isArray(purchases)) return [];

    const uniqueSuppliers = new Set(
      purchases.map((p: Purchase) => p.supplier.name)
    );
    return Array.from(uniqueSuppliers).map((name) => ({
      label: name,
      value: name,
    }));
  }, [purchases]);

  const handleExportToExcel = () => {
    const exportData = filteredPurchases.map((purchase: Purchase) => ({
      'Номер накладной': purchase.invoiceNumber,
      Дата: formatDateTime(purchase.date),
      Поставщик: purchase.supplier.name,
      'Адрес поставщика': purchase.supplier.address || '-',
      'Телефон поставщика': purchase.supplier.phone || '-',
      Статус: getStatusName(purchase.status),
      Сумма: purchase.totalAmount,
      'Количество товаров':
        typeof purchase.totalItems === 'number'
          ? purchase.totalItems
          : Array.isArray(purchase.items)
          ? purchase.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0,
      Комментарий: purchase.comment || '-',
    }));

    // Добавляем детальную информацию о товарах в отдельный лист
    const detailedData = filteredPurchases.flatMap((purchase: Purchase) =>
      Array.isArray(purchase.items)
        ? purchase.items.map((item) => ({
            'Номер накладной': purchase.invoiceNumber,
            Дата: formatDateTime(purchase.date),
            Поставщик: purchase.supplier.name,
            'Название товара': item.product?.name || 'Неизвестный товар',
            Артикул: item.product?.sku || '-',
            Количество: item.quantity || 0,
            Цена: item.price || 0,
            Сумма: item.total || 0,
            'Серийный номер': item.serialNumber || '-',
            'Срок годности': item.expiryDate
              ? formatDate(item.expiryDate)
              : '-',
            'Комментарий к товару': item.comment || '-',
            'Общий комментарий': purchase.comment || '-',
          }))
        : []
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Приходы');
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Детали приходов');

    const now = new Date();
    const formattedDate = now.toLocaleDateString('ru-RU').replace(/\./g, '-');
    XLSX.writeFile(wb, `Приходы_${formattedDate}.xlsx`);
  };

  const getStatusName = (status: string) => {
    const statusNames = {
      draft: 'Черновик',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      draft: 'gold',
      completed: 'green',
      cancelled: 'red',
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  const handleDeletePurchase = (id: string) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы действительно хотите удалить этот приход?',
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: () => {
        deletePurchase(shopId!, id)
          .then(() => {
            message.success('Приход успешно удален');
            refetch();
          })
          .catch((error) => {
            console.error('Error deleting purchase:', error);
            message.error('Произошла ошибка при удалении прихода');
          });
      },
    });
  };

  const handleViewPurchase = async (purchase: Purchase) => {
    try {
      // Загружаем детальную информацию о приходе
      const detailedPurchase = await getPurchaseById(
        purchase.id.toString(),
        shopId!
      );
      setSelectedPurchase(detailedPurchase);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading purchase details:', error);
      message.error('Не удалось загрузить детали прихода');
    }
  };

  const columns: ColumnsType<Purchase> = [
    {
      title: 'Номер',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Поставщик',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      sorter: (a, b) => a.supplier.name.localeCompare(b.supplier.name),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusName(status)}</Tag>
      ),
      filters: [
        { text: 'Черновик', value: 'draft' },
        { text: 'Завершен', value: 'completed' },
        { text: 'Отменен', value: 'cancelled' },
      ],
      onFilter: (value: any, record: Purchase) => record.status === value,
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatPrice(amount),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Товаров',
      dataIndex: 'totalItems',
      key: 'totalItems',
      render: (totalItems: number, record: Purchase) => {
        // Если есть поле totalItems, используем его
        if (typeof totalItems === 'number') return totalItems;

        // Иначе вычисляем из items
        if (!record.items || !Array.isArray(record.items)) return 0;
        return record.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
      },
      sorter: (a, b) => {
        // Если есть поле totalItems, используем его
        if (
          typeof a.totalItems === 'number' &&
          typeof b.totalItems === 'number'
        ) {
          return a.totalItems - b.totalItems;
        }

        // Иначе вычисляем из items
        const itemsA = a.items || [];
        const itemsB = b.items || [];

        const totalA = Array.isArray(itemsA)
          ? itemsA.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;
        const totalB = Array.isArray(itemsB)
          ? itemsB.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;

        return totalA - totalB;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Purchase) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewPurchase(record)}
            title="Просмотр"
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'print',
                  label: 'Печать',
                  icon: <PrinterOutlined />,
                  onClick: () => {
                    /* TODO: Implement print */
                  },
                },
                {
                  key: 'copy',
                  label: 'Копировать',
                  icon: <CopyOutlined />,
                  onClick: () => {
                    /* TODO: Implement copy */
                  },
                },
                {
                  key: 'delete',
                  label: 'Удалить',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeletePurchase(record.id.toString()),
                },
              ],
            }}
          >
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const filteredPurchases = useMemo(() => {
    if (!purchases || !Array.isArray(purchases)) return [];

    return purchases.filter((purchase: Purchase) => {
      const matchesSearch =
        searchText === '' ||
        purchase.invoiceNumber
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        purchase.supplier.name.toLowerCase().includes(searchText.toLowerCase());

      const matchesDate =
        !dateRange[0] ||
        !dateRange[1] ||
        (dayjs(purchase.date).isAfter(dateRange[0]) &&
          dayjs(purchase.date).isBefore(dateRange[1]));

      const matchesStatus =
        !selectedStatus || purchase.status === selectedStatus;

      const matchesSupplier =
        !selectedSupplier || purchase.supplier.name === selectedSupplier;

      const matchesAmount =
        (!minAmount || purchase.totalAmount >= minAmount) &&
        (!maxAmount || purchase.totalAmount <= maxAmount);

      return (
        matchesSearch &&
        matchesDate &&
        matchesStatus &&
        matchesSupplier &&
        matchesAmount
      );
    });
  }, [
    purchases,
    searchText,
    dateRange,
    selectedStatus,
    selectedSupplier,
    minAmount,
    maxAmount,
  ]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Приходы</h1>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowForm(true)}
            className="bg-blue-500"
          >
            Новый приход
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportToExcel}
            className="bg-blue-500"
            type="primary"
          >
            Экспорт в Excel
          </Button>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="bg-blue-500"
            type="primary"
          >
            Фильтры
          </Button>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" className="w-full">
          <Input.Search
            placeholder="Поиск по номеру накладной или поставщику"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md"
            allowClear
          />

          {showAdvancedFilters && (
            <Space wrap>
              <RangePicker
                value={dateRange}
                onChange={(dates) =>
                  setDateRange(
                    dates as [dayjs.Dayjs | null, dayjs.Dayjs | null]
                  )
                }
                placeholder={['Дата с', 'Дата по']}
              />
              <Select
                placeholder="Статус"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                style={{ width: 120 }}
                options={[
                  { label: 'Черновик', value: 'draft' },
                  { label: 'Завершен', value: 'completed' },
                  { label: 'Отменен', value: 'cancelled' },
                ]}
              />
              <Select
                placeholder="Поставщик"
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                allowClear
                style={{ width: 200 }}
                options={suppliers}
                showSearch
                optionFilterProp="label"
              />
              <Input
                placeholder="Мин. сумма"
                type="number"
                style={{ width: 120 }}
                value={minAmount || ''}
                onChange={(e) =>
                  setMinAmount(e.target.value ? Number(e.target.value) : null)
                }
              />
              <Input
                placeholder="Макс. сумма"
                type="number"
                style={{ width: 120 }}
                value={maxAmount || ''}
                onChange={(e) =>
                  setMaxAmount(e.target.value ? Number(e.target.value) : null)
                }
              />
            </Space>
          )}
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredPurchases}
        rowKey="id"
        loading={isLoading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
          defaultPageSize: 10,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {showForm && (
        <Modal
          open={showForm}
          onCancel={() => setShowForm(false)}
          footer={null}
          width="90%"
          style={{ top: 20 }}
          bodyStyle={{ padding: 0 }}
          destroyOnClose
        >
          <PurchaseForm
            shopId={shopId!}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              message.success('Приход успешно создан');
              refetch();
            }}
          />
        </Modal>
      )}

      <PurchaseDetails
        purchase={selectedPurchase}
        visible={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
}

export default IncomingPage;
