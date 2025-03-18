import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Button,
  DatePicker,
  Select,
  Table,
  Spin,
  message,
  Input,
  Tag,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { getInventory, getProducts } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;
const { Search } = Input;

// Словарь для перевода типов операций
const operationTypes: Record<string, string> = {
  WRITE_OFF: 'Списание',
  TRANSFER: 'Перемещение',
  ADJUSTMENT: 'Корректировка',
  PURCHASE: 'Приход',
  SALE: 'Продажа',
};

// Типы отчетов
const reportTypes = [
  { label: 'Все операции', value: 'all' },
  { label: 'Списания', value: 'WRITE_OFF' },
  { label: 'Приходы', value: 'PURCHASE' },
  { label: 'Перемещения', value: 'TRANSFER' },
  { label: 'Корректировки', value: 'ADJUSTMENT' },
  { label: 'Продажи', value: 'SALE' },
];

function ReportsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [reportType, setReportType] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['inventory-transactions', shopId],
    queryFn: () => getInventory(shopId!),
    enabled: !!shopId,
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  const isLoading = isLoadingTransactions || isLoadingProducts;

  // Фильтрация транзакций с учетом всех фильтров
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((transaction) => {
      const transactionDate = dayjs(transaction.createdAt);

      // Фильтр по дате
      const dateMatches =
        transactionDate.isAfter(dateRange[0]) &&
        transactionDate.isBefore(dateRange[1]);

      // Фильтр по типу отчета
      const reportTypeMatches =
        reportType === 'all' || transaction.type === reportType;

      // Фильтр по товару (поиск по имени или артикулу)
      const productMatches =
        !productSearch ||
        transaction.product?.name
          .toLowerCase()
          .includes(productSearch.toLowerCase()) ||
        transaction.product?.sku
          .toLowerCase()
          .includes(productSearch.toLowerCase());

      return dateMatches && reportTypeMatches && productMatches;
    });
  }, [transactions, dateRange, reportType, productSearch]);

  // Calculate statistics
  const stats = {
    totalWriteOffs: filteredTransactions?.filter((t) => t.type === 'WRITE_OFF')
      .length,
    totalTransfers: filteredTransactions?.filter((t) => t.type === 'TRANSFER')
      .length,
    totalAdjustments: filteredTransactions?.filter(
      (t) => t.type === 'ADJUSTMENT'
    ).length,
    writeOffValue: filteredTransactions
      ?.filter((t) => t.type === 'WRITE_OFF')
      .reduce((sum, t) => sum + (t.price || 0) * Math.abs(t.quantity), 0),
  };

  const stockMovementColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        return (
          <Tag color={getTypeColor(type)}>{operationTypes[type] || type}</Tag>
        );
      },
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
      render: (quantity: number) => (
        <span className={quantity < 0 ? 'text-red-500' : 'text-green-500'}>
          {quantity}
        </span>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: any) =>
        formatPrice(price * Math.abs(record.quantity)),
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
  ];

  // Функция для определения цвета метки типа операции
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'WRITE_OFF':
        return 'red';
      case 'ADJUSTMENT':
        return 'blue';
      case 'PURCHASE':
        return 'green';
      case 'TRANSFER':
        return 'orange';
      case 'SALE':
        return 'purple';
      default:
        return 'default';
    }
  };

  const handleExport = () => {
    let exportData;
    let fileName;

    // Prepare data for export
    const data =
      reportType === 'all'
        ? filteredTransactions
        : filteredTransactions.filter(
            (t) => reportType === 'all' || t.type === reportType
          );

    exportData = data?.map((t) => ({
      Дата: formatDate(t.createdAt),
      Тип: operationTypes[t.type] || t.type, // Переводим тип операции
      'Название товара': t.product?.name,
      Артикул: t.product?.sku,
      Количество: t.quantity,
      Сумма: (t.price || 0) * Math.abs(t.quantity),
      Причина: t.description || '',
      Комментарий: t.comment || '',
    }));

    // Set filename based on report type
    if (reportType === 'all') {
      fileName = 'Все_операции';
    } else {
      fileName = operationTypes[reportType] || reportType;
    }

    if (!exportData || exportData.length === 0) {
      message.info('Нет данных для экспорта');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(
      wb,
      `${fileName}_${formatDate(dateRange[0].toISOString())}-${formatDate(
        dateRange[1].toISOString()
      )}.xlsx`
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Отчеты по складу</h1>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          className="bg-blue-500"
        >
          Экспорт
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Период</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!, dates[1]!]);
                }
              }}
              className="w-64"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Тип отчета
            </label>
            <Select
              value={reportType}
              onChange={setReportType}
              className="w-64"
              options={reportTypes}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Поиск по товару
            </label>
            <Search
              placeholder="Название или SKU"
              allowClear
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ width: 250 }}
            />
          </div>
        </div>
      </Card>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <div className="text-sm text-gray-500">Всего списаний</div>
            <div className="text-xl font-semibold">{stats.totalWriteOffs}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-sm text-gray-500">Сумма списаний</div>
            <div className="text-xl font-semibold">
              {formatPrice(stats.writeOffValue || 0)}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-sm text-gray-500">Перемещения</div>
            <div className="text-xl font-semibold">{stats.totalTransfers}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-sm text-gray-500">Корректировки</div>
            <div className="text-xl font-semibold">
              {stats.totalAdjustments}
            </div>
          </Card>
        </Col>
      </Row>

      <Table
        columns={stockMovementColumns}
        dataSource={filteredTransactions}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default ReportsPage;
