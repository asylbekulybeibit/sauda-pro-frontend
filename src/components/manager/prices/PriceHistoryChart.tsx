import React, { useEffect, useState } from 'react';
import { Line } from '@ant-design/plots';
import {
  DatePicker,
  message,
  Radio,
  Space,
  Card,
  Empty,
  Spin,
  Typography,
  Alert,
  Avatar,
  Tooltip,
} from 'antd';
import { getPriceChangesReport } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import dayjs from 'dayjs';
import { formatPrice } from '@/utils/format';
import {
  RobotOutlined,
  UserOutlined,
  QuestionOutlined,
  ImportOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useShop } from '@/hooks/useShop';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface PriceHistoryChartProps {
  productId: string;
  priceTypeFilter: string;
  dateRange: [string, string] | null;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  productId,
  priceTypeFilter,
  dateRange,
}) => {
  const { currentShop } = useShop();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState<string>('');

  const fetchPriceHistory = async () => {
    if (!currentShop?.id) return;

    try {
      setLoading(true);
      const data = await getPriceChangesReport(
        currentShop.id,
        dateRange?.[0],
        dateRange?.[1]
      );

      // Фильтруем данные по productId
      const filteredData = data.filter(
        (record) => record.productId === productId
      );

      // Сортируем данные по дате для правильного отображения на графике
      const sortedData = [...filteredData].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setPriceHistory(sortedData);

      // Сохраняем название продукта, если оно есть в данных
      if (sortedData.length > 0 && sortedData[0].product?.name) {
        setProductName(sortedData[0].product.name);
      }
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, [productId, dateRange, priceTypeFilter, currentShop?.id]);

  const filteredPriceHistory = priceHistory.filter((record) => {
    if (priceTypeFilter === 'all') return true;
    return record.priceType === priceTypeFilter;
  });

  // Функция для расчета процентного изменения
  const calculatePercentChange = (
    oldPrice: number,
    newPrice: number
  ): string => {
    if (oldPrice === 0) return '';
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const renderChangedBy = (changedBy: any, changedByUser?: any) => {
    // Первый приоритет: используем данные из changedByUser, если они есть
    if (changedByUser && typeof changedByUser === 'object') {
      if (changedByUser.firstName && changedByUser.lastName) {
        const userInfo = [];

        // Добавляем имя и фамилию
        userInfo.push(`${changedByUser.firstName} ${changedByUser.lastName}`);

        // Добавляем контактную информацию, если она есть
        if (changedByUser.phone || changedByUser.email) {
          userInfo.push(
            [
              changedByUser.phone ? `Тел: ${changedByUser.phone}` : '',
              changedByUser.email || '',
            ]
              .filter(Boolean)
              .join(', ')
          );
        }

        return (
          <Tooltip title={userInfo.join('\n')}>
            <Space>
              <Avatar icon={<UserOutlined />} />
              <span>{`${changedByUser.firstName} ${changedByUser.lastName}`}</span>
            </Space>
          </Tooltip>
        );
      }
    }

    // Второй приоритет: если changedBy - объект, используем его данные
    if (typeof changedBy === 'object' && changedBy !== null) {
      const user = changedBy as any;

      // Если есть имя и фамилия, отображаем их
      if (user.firstName && user.lastName) {
        return (
          <Space>
            <Avatar icon={<UserOutlined />} />
            <span>{`${user.firstName} ${user.lastName}`}</span>
          </Space>
        );
      }

      // Если объект имеет id и name, это может быть сериализованный пользователь
      if (user.id && user.name) {
        return (
          <Space>
            <Avatar icon={<UserOutlined />} />
            <span>{user.name}</span>
          </Space>
        );
      }
    }

    // Третий приоритет: обработка строковых значений
    const changedByString = typeof changedBy === 'string' ? changedBy : '';

    if (!changedByString || changedByString === 'system') {
      return (
        <Space>
          <Avatar icon={<RobotOutlined />} />
          <span>Система</span>
        </Space>
      );
    }

    if (changedByString === 'unknown') {
      return (
        <Space>
          <Avatar icon={<QuestionOutlined />} />
          <span>Неизвестно</span>
        </Space>
      );
    }

    if (changedByString === 'import') {
      return (
        <Space>
          <Avatar icon={<ImportOutlined />} />
          <span>Импорт</span>
        </Space>
      );
    }

    if (changedByString === 'admin') {
      return (
        <Space>
          <Avatar icon={<CrownOutlined />} />
          <span>Администратор</span>
        </Space>
      );
    }

    // Если ничего не подошло, отображаем значение как есть
    return (
      <Space>
        <Avatar icon={<UserOutlined />} />
        <span>{changedByString}</span>
      </Space>
    );
  };

  // Подготовка данных для графика с предыдущими ценами для расчета изменения
  const chartData = filteredPriceHistory.map((record, index) => {
    // Находим предыдущую запись того же типа цены
    const prevRecord = filteredPriceHistory
      .slice(0, index)
      .reverse()
      .find((r) => r.priceType === record.priceType);

    const priceTypeName =
      record.priceType === 'purchase'
        ? 'Закупочная'
        : record.priceType === 'selling'
        ? 'Продажная'
        : 'Неизвестно';

    // Вычисляем изменение цены
    const prevPrice = prevRecord ? prevRecord.newPrice : record.oldPrice;
    const priceChange = record.newPrice - prevPrice;
    const percentChange = calculatePercentChange(prevPrice, record.newPrice);

    // Подготовка информации о пользователе в текстовом формате
    let changedByText = 'Неизвестно';
    if (record.changedByUser) {
      const user = record.changedByUser as any;
      if (user.firstName && user.lastName) {
        changedByText = `${user.firstName} ${user.lastName}`;
      }
    } else if (record.changedBy) {
      const changedBy = record.changedBy as any;
      if (typeof changedBy === 'string') {
        switch (changedBy) {
          case 'system':
            changedByText = 'Система';
            break;
          case 'import':
            changedByText = 'Импорт';
            break;
          case 'admin':
            changedByText = 'Администратор';
            break;
          default:
            changedByText = changedBy;
        }
      } else if (changedBy.firstName && changedBy.lastName) {
        changedByText = `${changedBy.firstName} ${changedBy.lastName}`;
      }
    }

    return {
      date: dayjs(record.createdAt).format('DD.MM.YYYY HH:mm'),
      timestamp: new Date(record.createdAt).getTime(),
      price: record.newPrice,
      priceTypeLabel: priceTypeName,
      priceType: record.priceType,
      prevPrice: prevPrice,
      priceChange: priceChange,
      percentChange: percentChange,
      reason: record.reason || 'Не указана',
      changedBy: changedByText,
    };
  });

  // Определяем цвета для типов цен
  const getPriceTypeColor = (priceType: string) => {
    switch (priceType) {
      case 'Закупочная':
        return '#1890ff';
      case 'Продажная':
        return '#52c41a';
      default:
        return '#666666';
    }
  };

  const config = {
    data: chartData,
    padding: [20, 20, 50, 50],
    xField: 'date',
    yField: 'price',
    seriesField: 'priceTypeLabel',
    color: ({ priceTypeLabel }: { priceTypeLabel: string }) => {
      switch (priceTypeLabel) {
        case 'Продажная':
          return '#36CFC9'; // бирюзовый для продажной цены
        case 'Закупочная':
          return '#722ED1'; // фиолетовый для закупочной цены
        default:
          return '#666666';
      }
    },
    legend: {
      position: 'bottom',
      itemName: {
        formatter: (text: string) => {
          switch (text) {
            case 'Продажная':
              return 'Розничная цена';
            case 'Закупочная':
              return 'Оптовая цена';
            default:
              return text;
          }
        },
      },
    },
    xAxis: {
      title: null,
      tickCount: 10,
      grid: {
        line: {
          style: {
            stroke: '#E5E5E5',
            lineWidth: 1,
          },
        },
      },
      label: {
        formatter: (text: string) => text.split(' ')[0],
        style: {
          fill: '#666666',
        },
      },
    },
    yAxis: {
      title: null,
      grid: {
        line: {
          style: {
            stroke: '#E5E5E5',
            lineWidth: 1,
          },
        },
      },
      label: {
        formatter: (value: number) => formatPrice(value).replace('₸', ''),
        style: {
          fill: '#666666',
        },
      },
    },
    tooltip: {
      showMarkers: true,
      shared: true,
      showCrosshairs: true,
      crosshairs: {
        type: 'x',
      },
      domStyles: {
        'g2-tooltip': {
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          padding: '8px 12px',
        },
      },
      formatter: (datum: any) => {
        const arrow =
          datum.priceChange > 0 ? '↑' : datum.priceChange < 0 ? '↓' : '';
        return {
          name:
            datum.priceTypeLabel === 'Продажная'
              ? 'Розничная цена'
              : 'Оптовая цена',
          value: `${formatPrice(datum.price)}
${
  datum.priceChange !== 0
    ? `${arrow} ${formatPrice(Math.abs(datum.priceChange))} (${
        datum.percentChange
      })`
    : ''
}`,
        };
      },
    },
    point: {
      size: 4,
      shape: 'circle',
      style: {
        lineWidth: 2,
      },
    },
    line: {
      style: {
        lineWidth: 2,
      },
    },
    smooth: true,
    slider: {
      start: 0,
      end: 1,
      trendCfg: {
        isArea: false,
      },
      foregroundStyle: {
        fill: 'l(0) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
      },
    },
    theme: {
      styleSheet: {
        backgroundColor: '#ffffff',
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
      {
        type: 'legend-highlight',
      },
      {
        type: 'axis-label-highlight',
      },
    ],
  };

  const renderEmptyState = () => {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>Нет данных об изменениях цен для выбранного периода</span>
        }
      >
        {dateRange && (
          <Text type="secondary">
            Попробуйте изменить период времени или выбрать другой тип цены
          </Text>
        )}
      </Empty>
    );
  };

  return (
    <div>
      <Space
        direction="vertical"
        size="middle"
        style={{ width: '100%', marginBottom: 16 }}
      >
        <Card loading={loading}>
          {chartData.length > 0 ? (
            <>
              <Alert
                message="Наведите на точки графика, чтобы увидеть подробную информацию о каждом изменении цены"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{ height: 400 }}>
                <Line {...config} />
              </div>
              {/* Добавляем легенду для цветов точек */}
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#cf1322',
                      marginRight: 8,
                    }}
                  ></span>
                  <span>Повышение цены</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#3f8600',
                      marginRight: 8,
                    }}
                  ></span>
                  <span>Снижение цены</span>
                </div>
              </div>
            </>
          ) : (
            renderEmptyState()
          )}
        </Card>
      </Space>
    </div>
  );
};
