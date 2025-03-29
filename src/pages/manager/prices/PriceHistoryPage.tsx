import React, { useState } from 'react';
import { Table, DatePicker, Space, Tag, Tooltip, Select, Input } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getPriceChangesReport } from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import dayjs from 'dayjs';
import { UserOutlined, ImportOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Search } = Input;

interface PriceHistoryPageProps {
  warehouseId: string;
}

const PriceHistoryPage: React.FC<PriceHistoryPageProps> = ({ warehouseId }) => {
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [priceTypeFilter, setPriceTypeFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  const { data: priceHistory, isLoading } = useQuery({
    queryKey: ['priceHistory', warehouseId, dateRange],
    queryFn: () => {
      if (!dateRange) return getPriceChangesReport(warehouseId);

      // Устанавливаем время для начальной и конечной даты
      const startDate = dayjs(dateRange[0]).startOf('day').toISOString();
      const endDate = dayjs(dateRange[1]).endOf('day').toISOString();

      return getPriceChangesReport(warehouseId, startDate, endDate);
    },
  });

  // Фильтруем данные по типу цены и названию товара
  const filteredData = priceHistory?.filter((item) => {
    const matchesType = !priceTypeFilter || item.priceType === priceTypeFilter;
    const productName = (
      item.product?.barcode?.productName || ''
    ).toLowerCase();
    const matchesSearch =
      !searchText || productName.includes(searchText.toLowerCase());
    return matchesType && matchesSearch;
  });

  const columns = [
    {
      title: 'Дата и время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Наименование',
      dataIndex: 'product',
      key: 'product',
      render: (_: any, record: any) =>
        record.warehouseProduct?.barcode?.productName || 'Без названия',
    },
    {
      title: 'Тип цены',
      dataIndex: 'priceType',
      key: 'priceType',
      render: (type: string) => (
        <Tag color={type === 'purchase' ? 'blue' : 'green'}>
          {type === 'purchase' ? 'Закупочная' : 'Продажная'}
        </Tag>
      ),
    },
    {
      title: 'Старая цена',
      dataIndex: 'oldPrice',
      key: 'oldPrice',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Новая цена',
      dataIndex: 'newPrice',
      key: 'newPrice',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Изменение',
      key: 'change',
      render: (_: any, record: any) => {
        const change = record.newPrice - record.oldPrice;
        let percentageText = '';

        // Вычисляем процент только если старая цена не равна 0
        if (record.oldPrice > 0) {
          const percentChange = ((change / record.oldPrice) * 100).toFixed(2);
          percentageText = ` (${percentChange}%)`;
        }

        return (
          <span style={{ color: change >= 0 ? 'green' : 'red' }}>
            {change >= 0 ? '+' : ''}
            {formatPrice(change)}
            {percentageText}
          </span>
        );
      },
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => reason || '—',
    },
    {
      title: 'Кто изменил',
      dataIndex: 'changedBy',
      key: 'changedBy',
      render: (user: any) => (
        <Tooltip
          title={
            user?.firstName
              ? `${user.firstName} ${user.lastName || ''}`
              : 'Система'
          }
        >
          <Space>
            {user?.firstName ? <UserOutlined /> : <ImportOutlined />}
            {user?.firstName
              ? `${user.firstName} ${user.lastName || ''}`
              : 'Система'}
          </Space>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4">
        <Space size="middle" wrap>
          <RangePicker
            showTime={false}
            format="DD.MM.YYYY"
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]!.format('YYYY-MM-DD'),
                  dates[1]!.format('YYYY-MM-DD'),
                ]);
              } else {
                setDateRange(null);
              }
            }}
          />
          <Select
            style={{ width: 200 }}
            placeholder="Тип цены"
            allowClear
            onChange={(value) => setPriceTypeFilter(value)}
            options={[
              { label: 'Все', value: null },
              { label: 'Закупочная', value: 'purchase' },
              { label: 'Продажная', value: 'selling' },
            ]}
          />
          <Search
            placeholder="Поиск по названию"
            style={{ width: 300 }}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={isLoading}
      />
    </div>
  );
};

export default PriceHistoryPage;
