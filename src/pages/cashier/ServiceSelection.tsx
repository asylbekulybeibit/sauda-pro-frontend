import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Tabs,
  Row,
  Col,
  Button,
  Empty,
  Menu,
  Spin,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { getServices } from '@/services/cashierApi';

const { Title, Text } = Typography;

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
 * Страница выбора услуги (первый шаг)
 */
const ServiceSelection: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null
  );

  // Загрузка услуг
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Загрузка услуг для магазина ID:', shopId);

        const servicesData = await getServices(shopId || '');
        console.log('Получены данные услуг:', servicesData);

        // Группируем услуги по категориям
        const groupedServices = servicesData.reduce((acc, service) => {
          const category = service.category || 'Общие услуги';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(service);
          return acc;
        }, {});

        // Преобразуем группированные услуги в формат для отображения
        const serviceCategories = Object.keys(groupedServices).map(
          (category) => ({
            name: category,
            services: groupedServices[category],
          })
        );

        console.log('Сгруппированные категории:', serviceCategories);
        setServiceCategories(serviceCategories);
      } catch (error) {
        console.error('Ошибка при загрузке услуг:', error);
        setError('Не удалось загрузить список услуг');
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchServices();
    }
  }, [shopId]);

  // Обработчик выбора услуги
  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
  };

  // Обработчик перехода к выбору клиента
  const handleNext = () => {
    if (!selectedService) {
      message.warning('Пожалуйста, выберите услугу');
      return;
    }

    // Сохраняем выбранную услугу в localStorage для следующей страницы
    localStorage.setItem('selectedService', JSON.stringify(selectedService));

    // Переход к выбору клиента
    navigate(`/cashier/${shopId}/select-client`);
  };

  // Обработчик возврата к выбору типа услуги
  const handleBack = () => {
    navigate(`/cashier/${shopId}/select-type`);
  };

  return (
    <div className="flex flex-col">
      {/* Верхнее навигационное меню */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <Menu
          mode="horizontal"
          selectedKeys={['start']}
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
      <div className="p-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mr-3"
            >
              Назад
            </Button>
            <Title level={4} className="m-0">
              Выберите услугу
            </Title>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={!selectedService}
          >
            Далее
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Spin size="large" tip="Загрузка услуг..." />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-48">
            <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : serviceCategories.length === 0 ? (
          <Empty description="Нет доступных услуг" className="mt-4" />
        ) : (
          serviceCategories.map((category) => (
            <div key={category.name} className="mb-4">
              <Title level={5} className="mb-2">
                {category.name}
              </Title>
              <Row gutter={[12, 12]}>
                {category.services.map((service) => (
                  <Col key={service.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      className={`transition-all ${
                        selectedService?.id === service.id
                          ? 'border-blue-500 shadow-md'
                          : ''
                      }`}
                      onClick={() => handleServiceSelect(service)}
                      bodyStyle={{ padding: '12px' }}
                    >
                      <div className="flex flex-col">
                        <div>
                          <Title level={5} className="mb-1">
                            {service.name}
                          </Title>
                          {service.description && (
                            <Text type="secondary" className="block mb-1">
                              {service.description}
                            </Text>
                          )}
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-green-600 font-medium">
                            {service.price} ₸
                          </div>
                          {service.duration && (
                            <Text type="secondary">
                              {service.duration} мин.
                            </Text>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))
        )}
      </div>

      {/* Нижняя кнопка действия на мобильных устройствах */}
      <div className="sticky bottom-0 bg-white shadow-lg p-3 border-t border-gray-200 md:hidden">
        <Button
          type="primary"
          size="large"
          block
          onClick={handleNext}
          disabled={!selectedService}
        >
          {selectedService
            ? `Далее: ${selectedService.name} (${selectedService.price} ₸)`
            : 'Выберите услугу для продолжения'}
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelection;
