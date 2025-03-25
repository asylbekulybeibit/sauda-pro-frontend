import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Menu,
  message,
  Checkbox,
  Avatar,
  Empty,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  UserOutlined,
  StarFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getActiveTechnicians } from '@/services/cashierApi';

const { Title, Text } = Typography;

// Интерфейс для мастера
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  experience?: number;
  rating?: number;
  avatar?: string;
  isActive: boolean;
  isAvailable: boolean;
  hireDate?: string;
  phone?: string;
}

/**
 * Страница выбора мастеров
 */
const TechnicianSelection: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Загрузка данных заказа из localStorage и списка мастеров
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем данные заказа из localStorage
        const storedOrderData = localStorage.getItem('newOrder');
        if (storedOrderData) {
          const parsedOrderData = JSON.parse(storedOrderData);
          setOrderData(parsedOrderData);
        } else {
          throw new Error('Не удалось загрузить данные заказа');
        }

        // Загружаем мастеров из API
        const technicianData = await getActiveTechnicians(shopId || '');
        // Преобразуем данные для корректного отображения
        const formattedTechnicians = technicianData.map((tech) => ({
          ...tech,
          isAvailable: tech.isActive,
        }));
        setTechnicians(formattedTechnicians);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить список мастеров');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  // Обработчик выбора/отмены выбора мастера
  const handleTechnicianSelect = (technicianId: string) => {
    setSelectedTechnicians((prev) =>
      prev.includes(technicianId)
        ? prev.filter((id) => id !== technicianId)
        : [...prev, technicianId]
    );
  };

  // Обработчик возврата к выбору автомобиля
  const handleBack = () => {
    navigate(`/cashier/${shopId}/select-vehicle`);
  };

  // Обработчик перехода к подтверждению заказа
  const handleNext = () => {
    if (selectedTechnicians.length === 0) {
      message.warning('Пожалуйста, выберите хотя бы одного мастера');
      return;
    }

    // Сохраняем выбранных мастеров в localStorage
    if (orderData) {
      const selectedTechnicianData = technicians.filter((tech) =>
        selectedTechnicians.includes(tech.id)
      );

      const updatedOrderData = {
        ...orderData,
        technicians: selectedTechnicianData,
      };

      localStorage.setItem('newOrder', JSON.stringify(updatedOrderData));
    }

    // Переход к странице проверки цены
    navigate(`/cashier/${shopId}/price-confirmation`);
  };

  // Хелперная функция для отображения карточки мастера
  const renderTechnicianCard = (technician: Technician) => {
    const isSelected = selectedTechnicians.includes(technician.id);
    const fullName = `${technician.lastName} ${technician.firstName}`;

    return (
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={technician.id}>
        <Card
          hoverable={technician.isAvailable}
          className={`mb-4 overflow-hidden transition-all ${
            !technician.isAvailable
              ? 'opacity-70 bg-gray-50'
              : isSelected
              ? 'border-blue-500 shadow-md'
              : 'hover:shadow-md'
          }`}
          bodyStyle={{ padding: '12px' }}
          onClick={() => {
            if (technician.isAvailable) {
              handleTechnicianSelect(technician.id);
            }
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                if (technician.isAvailable) {
                  handleTechnicianSelect(technician.id);
                }
              }}
              disabled={!technician.isAvailable}
              className="mt-1"
            />
            {technician.rating && (
              <Tag color="orange" className="flex items-center">
                <StarFilled className="mr-1" /> {technician.rating}
              </Tag>
            )}
          </div>

          <div className="flex justify-center mb-3">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              src={technician.avatar}
              className={`${isSelected ? 'border-2 border-blue-400' : ''}`}
            />
          </div>

          <div className="text-center">
            <div
              className={`font-medium text-base truncate ${
                isSelected ? 'text-blue-600' : ''
              }`}
            >
              <Tooltip title={fullName}>{fullName}</Tooltip>
            </div>

            <div className="text-gray-500 text-sm truncate">
              <Tooltip title={technician.position || 'Универсал'}>
                {technician.position || 'Универсал'}
              </Tooltip>
            </div>

            {!technician.isAvailable && (
              <Tag color="red" className="mt-1">
                Недоступен
              </Tag>
            )}

            {technician.experience && (
              <div className="text-xs text-gray-500 mt-1">
                <ClockCircleOutlined className="mr-1" />
                Опыт: {technician.experience} лет
              </div>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  return (
    <div className="flex flex-col h-screen">
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
            onClick={() => navigate(`/cashier/${shopId}/active-services`)}
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mr-4"
            >
              Назад
            </Button>
            <Title level={4} className="m-0">
              Выберите мастеров
            </Title>
          </div>

          <div className="flex items-center">
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={handleNext}
              disabled={selectedTechnicians.length === 0}
            >
              Далее
            </Button>
            {selectedTechnicians.length > 0 && (
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                Выбрано: {selectedTechnicians.length}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Загрузка мастеров..." />
          </div>
        ) : error ? (
          <Empty
            description={error}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="my-8"
          />
        ) : (
          <>
            {/* Информация об услуге */}
            {orderData && orderData.service && (
              <Card className="mb-4 bg-blue-50">
                <Title level={5}>Информация об услуге</Title>
                <p>
                  <strong>Услуга:</strong> {orderData.service.name}
                </p>
                <p>
                  <strong>Стоимость:</strong> {orderData.service.price} ₸
                </p>
                {orderData.service.duration && (
                  <p>
                    <strong>Приблизительное время:</strong>{' '}
                    {orderData.service.duration} мин.
                  </p>
                )}
                {orderData.vehicle && (
                  <p>
                    <strong>Автомобиль:</strong> {orderData.vehicle.brand}{' '}
                    {orderData.vehicle.model} {orderData.vehicle.licensePlate}
                  </p>
                )}
              </Card>
            )}

            <Card className="mb-4">
              <p className="text-gray-500 mb-4">
                Выберите одного или нескольких мастеров, которые будут выполнять
                услугу. Вы можете отметить нескольких сотрудников, если услуга
                требует участия разных специалистов.
              </p>

              <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-blue-700 mb-0">
                  <strong>Совет:</strong> Выберите мастера нажатием на карточку
                  или с помощью чекбокса. После выбора нажмите кнопку "Далее".
                </p>
              </div>

              {technicians.length === 0 ? (
                <Empty description="В магазине нет активных мастеров" />
              ) : (
                <Row gutter={[16, 0]}>
                  {technicians.map(renderTechnicianCard)}
                </Row>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TechnicianSelection;
