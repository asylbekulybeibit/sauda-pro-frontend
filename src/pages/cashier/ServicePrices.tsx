import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Table,
  Tag,
  Menu,
  Spin,
  Input,
  Empty,
  Tabs,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getServices } from '@/services/cashierApi';
import { formatCurrency } from '@/utils/formatters';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Интерфейс для типа услуги
interface ServiceType {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  duration?: number;
}

// Интерфейс для категории услуг
interface ServiceCategory {
  name: string;
  services: ServiceType[];
}

/**
 * Страница отображения цен на услуги для кассира
 */
const ServicePrices: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchServices();
  }, []);

  // Функция загрузки услуг из API
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!shopId) {
        throw new Error('ID магазина не определен');
      }

      const data = await getServices(shopId);
      setServiceTypes(data);

      // Группировка услуг по категориям
      const categorizedServices: Record<string, ServiceType[]> = {};
      data.forEach((service) => {
        if (!categorizedServices[service.category]) {
          categorizedServices[service.category] = [];
        }
        categorizedServices[service.category].push(service);
      });

      // Преобразование объекта в массив категорий
      const categoriesArray = Object.keys(categorizedServices).map((name) => ({
        name,
        services: categorizedServices[name],
      }));

      setCategories(categoriesArray);
    } catch (error) {
      console.error('Ошибка при загрузке услуг:', error);
      setError(
        'Не удалось загрузить список услуг. Пожалуйста, попробуйте позже.'
      );
      message.error('Ошибка при загрузке услуг');
    } finally {
      setLoading(false);
    }
  };

  // Колонки для таблицы услуг
  const columns = [
    {
      title: 'Название услуги',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ServiceType) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div className="text-gray-500 text-sm">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Продолжительность',
      dataIndex: 'duration',
      key: 'duration',
      width: 150,
      render: (duration?: number) =>
        duration ? `${duration} мин.` : 'Не указано',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (price: number) => (
        <Text strong className="text-green-600">
          {formatCurrency(price)}
        </Text>
      ),
    },
  ];

  // Фильтрация услуг по поисковому запросу
  const filteredServices = searchText
    ? serviceTypes.filter(
        (service) =>
          service.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (service.description &&
            service.description
              .toLowerCase()
              .includes(searchText.toLowerCase()))
      )
    : [];

  return (
    <div className="flex flex-col h-screen">
      {/* Верхнее навигационное меню */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <Menu
          mode="horizontal"
          selectedKeys={['prices']}
          className="flex justify-around"
        >
          <Menu.Item
            key="start"
            icon={<PlayCircleOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/select-service`)}
          >
            Начать услугу
          </Menu.Item>
          <Menu.Item
            key="active"
            icon={<DollarOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/service/active`)}
          >
            Активные
          </Menu.Item>
          <Menu.Item
            key="completed"
            icon={<CheckCircleOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/completed-services`)}
          >
            Завершённые
          </Menu.Item>
          <Menu.Item
            key="prices"
            icon={<PieChartOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/service-prices`)}
          >
            Цены
          </Menu.Item>
        </Menu>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <Title level={4} className="m-0">
            Цены на услуги
          </Title>
          <Text type="secondary">
            Просмотр актуальных цен на все виды услуг в магазине
          </Text>
        </div>

        {/* Поиск */}
        <Card className="mb-4">
          <Input
            placeholder="Поиск услуг по названию или описанию..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            allowClear
          />
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Загрузка цен на услуги..." />
          </div>
        ) : error ? (
          <Empty
            description={error}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="my-8"
          />
        ) : searchText ? (
          // Отображение результатов поиска
          <Card title="Результаты поиска" className="mb-4">
            {filteredServices.length > 0 ? (
              <Table
                dataSource={filteredServices}
                columns={columns}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <Empty description="Услуги не найдены" />
            )}
          </Card>
        ) : (
          // Отображение услуг по категориям
          <Tabs defaultActiveKey="0" type="card">
            {categories.map((category, index) => (
              <TabPane
                tab={
                  <span>
                    {category.name} <Tag>{category.services.length}</Tag>
                  </span>
                }
                key={index.toString()}
              >
                <Table
                  dataSource={category.services}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                />
              </TabPane>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ServicePrices;
