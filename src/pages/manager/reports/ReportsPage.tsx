import { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/services/managerApi';
import { ReportList } from '@/components/manager/reports/ReportList';
import { ReportForm } from '@/components/manager/reports/ReportForm';
import {
  Button,
  Spin,
  Typography,
  Card,
  Select,
  Empty,
  DatePicker,
  Space,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { ShopContext } from '@/contexts/ShopContext';
import { Report, ReportType } from '@/types/report';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const { shopId: urlShopId } = useParams<{ shopId: string }>();
  const { currentShop, loading } = useContext(ShopContext)!;
  const shopId = urlShopId || currentShop?.id;
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  const {
    data: reports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reports', shopId],
    queryFn: () => {
      if (!shopId) {
        console.error('No shopId provided');
        throw new Error('No shopId provided');
      }
      return getReports(shopId);
    },
    enabled: !!shopId,
  });

  // Функция для фильтрации отчетов
  const getFilteredReports = (): Report[] => {
    if (!reports) return [];

    return reports.filter((report) => {
      // Фильтрация по типу отчета
      if (filterType && report.type !== filterType) {
        return false;
      }

      // Фильтрация по дате создания
      if (dateRange && dateRange[0] && dateRange[1]) {
        const reportDate = dayjs(report.createdAt);
        const startDate = dateRange[0];
        const endDate = dateRange[1];

        if (reportDate.isBefore(startDate) || reportDate.isAfter(endDate)) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredReports = getFilteredReports();

  // Функция очистки фильтров
  const clearFilters = () => {
    setFilterType(null);
    setDateRange(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="p-4">
        <Alert
          message="Ошибка"
          description="ID магазина не указан. Пожалуйста, выберите магазин."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="Ошибка при загрузке отчетов"
          description="Не удалось загрузить список отчетов. Пожалуйста, попробуйте позже."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Отчеты
            </Title>
            <Paragraph className="text-gray-500 mt-1">
              Управление и создание отчетов по работе магазина
            </Paragraph>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowForm(true)}
            size="large"
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            Создать отчет
          </Button>
        </div>

        {/* Фильтры */}
        <Card
          className="mb-4"
          size="small"
          title={
            <span>
              <FilterOutlined /> Фильтры
            </span>
          }
        >
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="mb-1 text-sm text-gray-500">Тип отчета</div>
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder="Все типы"
                value={filterType}
                onChange={setFilterType}
              >
                <Option value="SALES">Продажи</Option>
                <Option value="INVENTORY">Инвентарь</Option>
                <Option value="STAFF">Персонал</Option>
                <Option value="FINANCIAL">Финансы</Option>
                <Option value="CATEGORIES">Категории</Option>
                <Option value="PROMOTIONS">Акции</Option>
              </Select>
            </div>

            <div>
              <div className="mb-1 text-sm text-gray-500">Дата создания</div>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: 280 }}
              />
            </div>

            <div className="self-end">
              <Button onClick={clearFilters}>Сбросить фильтры</Button>
            </div>
          </div>
        </Card>

        {reports && reports.length > 0 ? (
          <>
            {filteredReports.length > 0 ? (
              <ReportList reports={filteredReports} />
            ) : (
              <Empty
                description="Нет отчетов, соответствующих выбранным фильтрам"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </>
        ) : (
          <Card className="text-center py-8">
            <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} className="mt-4">
              У вас пока нет отчетов
            </Title>
            <Paragraph className="text-gray-500">
              Создайте свой первый отчет, чтобы анализировать данные о работе
              магазина
            </Paragraph>
            <Button
              type="primary"
              onClick={() => setShowForm(true)}
              className="mt-2"
              icon={<PlusOutlined />}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              Создать отчет
            </Button>
          </Card>
        )}
      </div>

      <ReportForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
