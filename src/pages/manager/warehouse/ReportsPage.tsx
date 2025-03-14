import { useState } from 'react';
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
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { getInventory, getProducts } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

function ReportsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [reportType, setReportType] = useState<string>('stock_movement');

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

  // Filter transactions by date range
  const filteredTransactions = transactions?.filter((transaction) => {
    const transactionDate = dayjs(transaction.createdAt);
    return (
      transactionDate.isAfter(dateRange[0]) &&
      transactionDate.isBefore(dateRange[1])
    );
  });

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
        const types: Record<string, string> = {
          WRITE_OFF: 'Списание',
          TRANSFER: 'Перемещение',
          ADJUSTMENT: 'Корректировка',
          PURCHASE: 'Приход',
          SALE: 'Продажа',
        };
        return types[type] || type;
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

  const handleExport = () => {
    let exportData;
    let fileName;

    switch (reportType) {
      case 'stock_movement':
        exportData = filteredTransactions?.map((t) => ({
          Дата: formatDate(t.createdAt),
          Тип: t.type,
          'Название товара': t.product?.name,
          Артикул: t.product?.sku,
          Количество: t.quantity,
          Сумма: (t.price || 0) * Math.abs(t.quantity),
          Описание: t.description || '',
        }));
        fileName = 'Движение_товаров';
        break;

      case 'write_offs':
        exportData = filteredTransactions
          ?.filter((t) => t.type === 'WRITE_OFF')
          .map((t) => ({
            Дата: formatDate(t.createdAt),
            'Название товара': t.product?.name,
            Артикул: t.product?.sku,
            Количество: Math.abs(t.quantity),
            'Сумма списания': (t.price || 0) * Math.abs(t.quantity),
            Причина: t.description || '',
            Комментарий: t.comment || '',
          }));
        fileName = 'Списания';
        break;

      default:
        message.error('Неизвестный тип отчета');
        return;
    }

    if (!exportData) return;

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
        >
          Экспорт
        </Button>
      </div>

      <div className="flex space-x-4 mb-6">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates) {
              setDateRange([dates[0]!, dates[1]!]);
            }
          }}
          className="w-64"
        />
        <Select
          value={reportType}
          onChange={setReportType}
          className="w-48"
          options={[
            { label: 'Движение товаров', value: 'stock_movement' },
            { label: 'Списания', value: 'write_offs' },
          ]}
        />
      </div>

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
