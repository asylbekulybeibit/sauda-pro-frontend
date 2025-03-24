import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  List,
  Avatar,
  Spin,
  Empty,
  Menu,
  message,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Tag,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  CarOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  getClientVehicles,
  createVehicle,
  createVehicleForClient,
  getAllVehicles,
} from '@/services/cashierApi';
import { getClient } from '@/services/managerApi';
import axios from 'axios';
import { api } from '@/services/api';

const { Title, Text } = Typography;
const { Option } = Select;

// Интерфейс для автомобиля
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  licensePlate: string;
  color?: string;
  vin?: string;
  bodyType: string;
  engineVolume?: number;
  clientName?: string;
  clientId?: string;
}

// Интерфейс для клиента
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  discountPercent?: number;
}

// Интерфейс для услуги
interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  duration?: number;
}

// Интерфейс для создания автомобиля
interface CreateVehicleForm {
  make: string;
  model: string;
  year?: number;
  licensePlate: string;
  color?: string;
  vin?: string;
  bodyType: string;
  engineVolume?: number;
  isWithoutPlate: boolean;
}

/**
 * Страница выбора автомобиля (третий шаг)
 */
const VehicleSelection: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [unlinkedVehicles, setUnlinkedVehicles] = useState<Vehicle[]>([]);
  const [allShopVehicles, setAllShopVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isWithoutPlate, setIsWithoutPlate] = useState(false);
  const [loadingAllVehicles, setLoadingAllVehicles] = useState(false);

  // Форма для создания нового автомобиля
  const [form] = Form.useForm<CreateVehicleForm>();

  // Получение данных из предыдущих шагов
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Добавляем новое состояние, чтобы отслеживать ситуацию, когда клиент был пропущен, а автомобиль привязан к клиенту
  const [skipClient, setSkipClient] = useState<boolean>(false);

  // Загрузка всех автомобилей магазина
  useEffect(() => {
    const fetchAllVehicles = async () => {
      if (!shopId) return;

      try {
        setLoadingAllVehicles(true);
        const allVehicles = await getAllVehicles(shopId);

        // Обновляем все автомобили, сохраняя информацию о clientId если она доступна
        const enhancedVehicles = allVehicles.map((vehicle) => {
          // Предполагаем, что в API ответе может быть clientId или мы можем его вычислить
          // Это упрощенная логика, которую нужно адаптировать к реальному API
          return {
            ...vehicle,
            clientId: vehicle.clientId || undefined,
          };
        });

        setAllShopVehicles(enhancedVehicles);
      } catch (error) {
        console.error('Ошибка при загрузке всех автомобилей:', error);
        message.error('Не удалось загрузить список всех автомобилей');
      } finally {
        setLoadingAllVehicles(false);
      }
    };

    fetchAllVehicles();
  }, [shopId]);

  // Загрузка автомобилей клиента
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        // Если есть выбранный автомобиль из селекта (handleVehicleSelectFromDropdown),
        // показываем только его, независимо от того, есть ли у него привязка к клиенту
        if (selectedVehicle && skipClient) {
          setVehicles([selectedVehicle]);
        }
        // Если клиент выбран явно (через страницу выбора клиента)
        else if (selectedClient && !skipClient) {
          try {
            // Загружаем все автомобили клиента
            const vehiclesData = await getClientVehicles(
              selectedClient.id,
              shopId || ''
            );

            // Когда клиент выбран заранее, показываем все его автомобили
            setVehicles(vehiclesData);

            // Если выбрали клиента, очищаем неприязанные автомобили
            setUnlinkedVehicles([]);
          } catch (err) {
            // Если получаем ошибку доступа (403), показываем более дружественное сообщение
            console.error('Ошибка при загрузке автомобилей:', err);

            if (axios.isAxiosError(err) && err.response?.status === 403) {
              setError(
                'У вас нет прав для просмотра автомобилей этого клиента. Вы можете добавить новый автомобиль.'
              );
            } else {
              setError(
                'Не удалось загрузить список автомобилей. Пожалуйста, попробуйте позже или добавьте новый автомобиль.'
              );
            }
            // Устанавливаем пустой список автомобилей, чтобы пользователь мог продолжить
            setVehicles([]);
          }
        } else if (!selectedClient && selectedVehicle) {
          // Если клиент не выбран, но выбран автомобиль, показываем только его
          setVehicles([selectedVehicle]);
        } else {
          // Если ни клиент, ни автомобиль не выбраны, устанавливаем пустой список
          setVehicles([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [selectedClient, shopId, selectedVehicle, skipClient]);

  // Загрузка данных из localStorage - модифицируем существующий useEffect
  useEffect(() => {
    // Загружаем выбранную услугу
    const storedService = localStorage.getItem('selectedService');
    if (storedService) {
      try {
        setSelectedService(JSON.parse(storedService));
      } catch (e) {
        console.error('Ошибка при чтении выбранной услуги:', e);
      }
    }

    // Загружаем выбранного клиента
    const storedClient = localStorage.getItem('selectedClient');
    if (storedClient) {
      try {
        setSelectedClient(JSON.parse(storedClient));
        // Клиент не был пропущен
        setSkipClient(false);
      } catch (e) {
        console.error('Ошибка при чтении выбранного клиента:', e);
      }
    } else {
      // Если клиент не был выбран (пропущен), устанавливаем флаг skipClient
      setSkipClient(true);
    }
  }, []);

  // Обработчик выбора автомобиля из селекта
  const handleVehicleSelectFromDropdown = async (vehicleId: string) => {
    const vehicle = allShopVehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);

      // Если у автомобиля есть привязанный клиент (clientId), но нет выбранного клиента,
      // то нужно найти и установить этого клиента
      if (vehicle.clientId && !selectedClient) {
        try {
          // Попытаемся получить данные о клиенте по ID
          setLoading(true);

          // Используем функцию getClient из managerApi вместо прямого API-вызова
          const clientData = await getClient(shopId || '', vehicle.clientId);

          if (clientData) {
            const client: Client = {
              id: clientData.id,
              firstName: clientData.firstName,
              lastName: clientData.lastName,
              phone: clientData.phone,
              email: clientData.email,
              discountPercent: clientData.discountPercent,
            };

            // Устанавливаем выбранного клиента, но только для внутреннего использования
            setSelectedClient(client);

            // ВАЖНО: Сохраняем флаг skipClient как true, чтобы:
            // 1. Селект оставался видимым даже после установки selectedClient
            // 2. Отображался только выбранный автомобиль, а не все автомобили клиента
            setSkipClient(true);

            // Не сохраняем клиента в localStorage, чтобы на следующем шаге
            // он не был считан как выбранный пользователем
            localStorage.removeItem('selectedClient');

            // Устанавливаем только выбранный автомобиль для отображения
            setVehicles([vehicle]);
          }
        } catch (error) {
          console.error('Ошибка при получении данных клиента:', error);
          // В случае ошибки все равно покажем выбранный автомобиль
          setVehicles([vehicle]);
        } finally {
          setLoading(false);
        }
      } else if (!selectedClient) {
        // Если клиент не выбран и у автомобиля нет клиента, просто обновляем UI
        setVehicles([vehicle]);
      } else {
        // Если клиент уже выбран, всё равно показываем только выбранный автомобиль
        setSelectedVehicle(vehicle);
      }
    }
  };

  // Модифицируем renderVehicleOption, чтобы он возвращал строку для совместимости с label
  const getVehicleDisplayText = (vehicle: Vehicle): string => {
    let displayText = `${vehicle.make} ${vehicle.model}`;

    if (vehicle.licensePlate) {
      displayText += ` - ${vehicle.licensePlate}`;
    }

    if (vehicle.clientId) {
      displayText += ` (Клиент: ${vehicle.clientName || 'Привязан'})`;
    } else {
      displayText += ' (Без привязки)';
    }

    return displayText;
  };

  // Оставляем renderVehicleOption для обратной совместимости
  const renderVehicleOption = (vehicle: Vehicle) => {
    return (
      <div key={vehicle.id} className="flex justify-between">
        <div>
          <div>
            <Text strong>
              {vehicle.make} {vehicle.model}
            </Text>
            {vehicle.year && <Text> ({vehicle.year})</Text>}
            <Tag color="blue">{vehicle.licensePlate}</Tag>
          </div>
          <div className="text-gray-500 text-sm">
            {vehicle.bodyType && `Кузов: ${vehicle.bodyType}`}
            {vehicle.engineVolume && `, Двигатель: ${vehicle.engineVolume} л`}
            {vehicle.color && `, Цвет: ${vehicle.color}`}
          </div>
        </div>
        <div>
          {vehicle.clientId ? (
            <Tag color="green">{vehicle.clientName || 'Клиент'}</Tag>
          ) : (
            <Tag color="orange">Без привязки</Tag>
          )}
        </div>
      </div>
    );
  };

  // Обработчик возврата к выбору клиента
  const handleBack = () => {
    navigate(`/cashier/${shopId}/select-client`);
  };

  // Обработчик перехода к следующему шагу (создание заказа)
  const handleNext = () => {
    if (!selectedVehicle) {
      message.warning('Пожалуйста, выберите автомобиль');
      return;
    }

    if (!selectedService) {
      message.error('Отсутствуют данные об услуге');
      return;
    }

    // Сохраняем выбранный автомобиль в localStorage для следующей страницы
    localStorage.setItem('selectedVehicle', JSON.stringify(selectedVehicle));

    // Создаем объект заказа
    const orderData = {
      service: selectedService,
      client: selectedClient, // Может быть null, если клиент не выбран
      vehicle: selectedVehicle,
      shopId: shopId,
      createdAt: new Date().toISOString(),
    };

    // Сохраняем данные заказа
    localStorage.setItem('newOrder', JSON.stringify(orderData));

    // Переход к странице подтверждения заказа
    navigate(`/cashier/${shopId}/confirm-order`);
  };

  // Открытие модального окна для добавления нового автомобиля
  const showNewVehicleModal = () => {
    form.resetFields();
    setIsWithoutPlate(false);
    setIsModalVisible(true);
  };

  // Обработчик изменения чекбокса "Без номера"
  const handleWithoutPlateChange = (e: any) => {
    const checked = e.target.checked;
    setIsWithoutPlate(checked);

    if (checked) {
      form.setFieldsValue({ licensePlate: 'Б/Н' });
    } else {
      form.setFieldsValue({ licensePlate: '' });
    }
  };

  // Создание нового автомобиля
  const handleCreateVehicle = async (values: CreateVehicleForm) => {
    try {
      setLoading(true);
      let newVehicle: Vehicle;

      // Если выбран чекбокс "Без номера", убедимся, что licensePlate имеет значение "Б/Н"
      if (values.isWithoutPlate) {
        values.licensePlate = 'Б/Н';
      }

      // Преобразование строкового значения года в число, если оно указано
      const vehicleDataWithParsedYear = {
        ...values,
        year: values.year ? Number(values.year) : undefined,
        engineVolume: values.engineVolume
          ? Number(values.engineVolume)
          : undefined,
      };

      // Удаляем поле isWithoutPlate перед отправкой данных на сервер,
      // так как это внутреннее поле формы
      const { isWithoutPlate, ...vehicleData } = vehicleDataWithParsedYear;

      // Дополнительная проверка на валидность года
      if (
        vehicleData.year !== undefined &&
        (isNaN(vehicleData.year) || vehicleData.year < 1900)
      ) {
        message.error('Год выпуска должен быть числом не менее 1900');
        setLoading(false);
        return;
      }

      if (selectedClient) {
        // Если выбран клиент, создаем автомобиль с привязкой к нему
        try {
          newVehicle = await createVehicleForClient(
            shopId || '',
            selectedClient.id,
            vehicleData
          );
          message.success('Автомобиль успешно добавлен для клиента');

          // Добавляем новый автомобиль в список
          setVehicles((prev) => [...prev, newVehicle]);

          // Добавляем информацию о клиенте для отображения в списке всех автомобилей
          const vehicleWithClientInfo = {
            ...newVehicle,
            clientName: `${selectedClient.lastName} ${selectedClient.firstName}`,
          };

          // Добавляем в список всех автомобилей
          setAllShopVehicles((prev) => [...prev, vehicleWithClientInfo]);

          // Устанавливаем созданный автомобиль как выбранный
          setSelectedVehicle(newVehicle);
        } catch (err) {
          console.error('Ошибка при создании автомобиля для клиента:', err);

          if (axios.isAxiosError(err) && err.response?.status === 403) {
            message.error(
              'У вас нет прав для добавления автомобиля этому клиенту. Попробуйте добавить автомобиль без привязки к клиенту.'
            );
            // Пробуем создать автомобиль без привязки к клиенту
            newVehicle = await createVehicle(shopId || '', vehicleData);
            message.success(
              'Автомобиль успешно добавлен без привязки к клиенту'
            );

            // Добавляем автомобиль в список неприязанных
            setUnlinkedVehicles((prev) => [...prev, newVehicle]);

            // Добавляем в список всех автомобилей
            setAllShopVehicles((prev) => [...prev, newVehicle]);

            // Устанавливаем созданный автомобиль как выбранный
            setSelectedVehicle(newVehicle);
          } else {
            throw err; // Передаем ошибку дальше для общей обработки
          }
        }
      } else {
        // Если клиент не выбран, создаем автомобиль без привязки
        newVehicle = await createVehicle(shopId || '', vehicleData);
        message.success('Автомобиль успешно добавлен');

        // Добавляем автомобиль в список неприязанных
        setUnlinkedVehicles((prev) => [...prev, newVehicle]);

        // Добавляем в список всех автомобилей
        setAllShopVehicles((prev) => [...prev, newVehicle]);

        // Устанавливаем созданный автомобиль как выбранный
        setSelectedVehicle(newVehicle);
      }

      // Закрываем модальное окно
      setIsModalVisible(false);
    } catch (error) {
      console.error('Ошибка при создании автомобиля:', error);
      if (axios.isAxiosError(error) && error.response) {
        message.error(
          `Ошибка: ${error.response.data.message || 'Неизвестная ошибка'}`
        );
      } else {
        message.error('Не удалось создать автомобиль');
      }
    } finally {
      setLoading(false);
    }
  };

  // Популярные марки автомобилей для выбора
  const carBrands = [
    'Audi',
    'BMW',
    'Chevrolet',
    'Ford',
    'Honda',
    'Hyundai',
    'Kia',
    'Lexus',
    'Mazda',
    'Mercedes-Benz',
    'Mitsubishi',
    'Nissan',
    'Renault',
    'Skoda',
    'Toyota',
    'Volkswagen',
    'Volvo',
  ];

  // Добавляем функцию-помощник для рендеринга карточки автомобиля
  const renderVehicleCard = (vehicle: any, index: number) => {
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={index}>
        <Card
          hoverable
          className={`h-full transition-all ${
            selectedVehicle?.id === vehicle.id
              ? 'border-blue-500 shadow-md bg-blue-50'
              : 'border-gray-200'
          }`}
          onClick={() => setSelectedVehicle(vehicle)}
        >
          <div className="flex items-start mb-2">
            <Avatar icon={<CarOutlined />} size="large" className="mr-2 mt-1" />
            <div>
              <Title level={5} className="m-0">
                {vehicle.make} {vehicle.model}{' '}
                {vehicle.year ? `(${vehicle.year})` : ''}
              </Title>
              <Text strong>Гос. номер:</Text> {vehicle.licensePlate}
            </div>
            {selectedVehicle?.id === vehicle.id && (
              <div className="ml-auto text-blue-500">✓</div>
            )}
          </div>
          <div className="text-sm">
            <p className="mb-1">
              <Text strong>Тип кузова:</Text> {vehicle.bodyType}
            </p>
            {vehicle.engineVolume && (
              <p className="mb-1">
                <Text strong>Объем:</Text> {vehicle.engineVolume} л
              </p>
            )}
            {vehicle.color && (
              <p className="mb-1">
                <Text strong>Цвет:</Text> {vehicle.color}
              </p>
            )}
            {vehicle.vin && (
              <p className="mb-1">
                <Text strong>VIN:</Text> {vehicle.vin}
              </p>
            )}
          </div>
          {!selectedClient && vehicle.clientName && (
            <Tag color="blue" className="mt-2">
              Клиент: {vehicle.clientName}
            </Tag>
          )}
          {!selectedClient && !vehicle.clientName && (
            <Tag color="orange" className="mt-2">
              Без привязки
            </Tag>
          )}
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
              Выберите автомобиль
            </Title>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={!selectedVehicle}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Далее
          </Button>
        </div>

        {/* Информация о выбранной услуге и клиенте */}
        <Card className="mb-4 bg-blue-50">
          <Row gutter={16}>
            {selectedService && (
              <Col span={12}>
                <div>
                  <Text strong>Услуга: </Text>
                  <Text>{selectedService.name}</Text>
                </div>
                <div>
                  <Text strong>Стоимость: </Text>
                  <Text>{selectedService.price} ₽</Text>
                </div>
              </Col>
            )}

            {selectedClient ? (
              <Col span={12}>
                <div>
                  <Text strong>Клиент: </Text>
                  <Text>
                    {selectedClient.lastName} {selectedClient.firstName}
                  </Text>
                </div>
                <div>
                  <Text strong>Телефон: </Text>
                  <Text>{selectedClient.phone}</Text>
                </div>
                {selectedClient.email && (
                  <div>
                    <Text strong>Email: </Text>
                    <Text>{selectedClient.email}</Text>
                  </div>
                )}
                {selectedClient.discountPercent && (
                  <div>
                    <Text strong>Скидка: </Text>
                    <Text>{selectedClient.discountPercent}%</Text>
                  </div>
                )}
              </Col>
            ) : (
              <Col span={12}>
                <Text type="secondary">
                  Клиент не выбран. Автомобиль будет создан без привязки к
                  клиенту.
                </Text>
              </Col>
            )}
          </Row>
        </Card>

        {/* Селект для выбора автомобиля из всех доступных - только если клиент НЕ выбран */}
        {(skipClient || !selectedClient) && (
          <div className="mb-4">
            <Card>
              <div className="mb-2">
                <Text strong>
                  Выберите автомобиль из всех доступных в магазине:
                </Text>
                <p className="text-gray-500 text-sm mt-1">
                  Если автомобиль принадлежит клиенту, будет загружена
                  информация о клиенте.
                </p>
              </div>
              <Select
                showSearch
                placeholder="Введите номер или данные автомобиля..."
                optionFilterProp="children"
                value={selectedVehicle ? selectedVehicle.id : undefined}
                onChange={handleVehicleSelectFromDropdown}
                filterOption={(input, option) => {
                  if (!option?.label || typeof option.label !== 'string') {
                    return false;
                  }
                  return option.label
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }}
                options={allShopVehicles.map((vehicle) => ({
                  value: vehicle.id,
                  label: getVehicleDisplayText(vehicle),
                }))}
                style={{ width: '100%' }}
                loading={loading}
              />
            </Card>
          </div>
        )}

        {/* Кнопка добавления нового автомобиля */}
        <div className="mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={showNewVehicleModal}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {selectedClient
              ? 'Добавить автомобиль для клиента'
              : 'Добавить автомобиль без привязки'}
          </Button>
        </div>

        {/* Список автомобилей - показываем только если клиент не выбран или если клиент выбран и у него есть автомобили */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Загрузка автомобилей..." />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Empty
              description={
                <div className="text-center">
                  <p>{error}</p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showNewVehicleModal}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Добавить автомобиль {selectedClient ? 'для клиента' : ''}
                  </Button>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : selectedClient && vehicles.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <p>У клиента нет зарегистрированных автомобилей</p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showNewVehicleModal}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Добавить автомобиль для клиента
                </Button>
              </div>
            }
            className="mt-8"
          />
        ) : !selectedClient &&
          unlinkedVehicles.length === 0 &&
          allShopVehicles.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <p>В магазине нет доступных автомобилей</p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showNewVehicleModal}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Добавить автомобиль без привязки
                </Button>
              </div>
            }
            className="mt-8"
          />
        ) : (
          <div className="space-y-6">
            {/* Автомобили клиента или выбранный автомобиль */}
            {((selectedClient && vehicles.length > 0) || selectedVehicle) && (
              <div>
                <Title level={5} className="mb-4">
                  {selectedClient
                    ? 'Автомобили клиента'
                    : 'Выбранный автомобиль'}
                </Title>
                <Row gutter={[16, 16]}>
                  {/* Если выбран автомобиль из выпадающего списка, показываем только его */}
                  {selectedVehicle && !selectedClient
                    ? renderVehicleCard(selectedVehicle, 0)
                    : vehicles.map((vehicle, index) =>
                        renderVehicleCard(vehicle, index)
                      )}
                </Row>
              </div>
            )}

            {/* Автомобили без привязки - показываем только если клиент НЕ выбран и нет выбранного автомобиля из селекта */}
            {!selectedClient &&
              !selectedVehicle &&
              unlinkedVehicles.length > 0 && (
                <div>
                  <Title level={5} className="mb-4 mt-6">
                    Автомобили без привязки к клиенту
                  </Title>
                  <Row gutter={[16, 16]}>
                    {unlinkedVehicles.map((vehicle, index) =>
                      renderVehicleCard(vehicle, index)
                    )}
                  </Row>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Нижняя кнопка действия на мобильных устройствах */}
      <div className="sticky bottom-0 bg-white shadow-lg p-4 border-t border-gray-200 md:hidden">
        <Button
          type="primary"
          size="large"
          block
          onClick={handleNext}
          disabled={!selectedVehicle}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {selectedVehicle
            ? `Далее: ${selectedVehicle.make} ${selectedVehicle.model}`
            : 'Выберите автомобиль для продолжения'}
        </Button>
      </div>

      {/* Модальное окно для добавления нового автомобиля */}
      <Modal
        title={
          selectedClient
            ? `Новый автомобиль для ${selectedClient.lastName} ${selectedClient.firstName}`
            : 'Новый автомобиль без привязки к клиенту'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateVehicle}>
          <Form.Item
            name="make"
            label="Марка"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите марку автомобиля',
              },
            ]}
          >
            <Input placeholder="Например: Mercedes-Benz" />
          </Form.Item>
          <Form.Item
            name="model"
            label="Модель"
            rules={[
              {
                required: false,
                message: 'Пожалуйста, введите модель автомобиля',
              },
            ]}
          >
            <Input placeholder="Например: Camry" />
          </Form.Item>

          <Form.Item label="Государственный номер" required>
            <div className="mb-2">
              <Form.Item name="isWithoutPlate" valuePropName="checked" noStyle>
                <Checkbox onChange={handleWithoutPlateChange}>
                  Без номера
                </Checkbox>
              </Form.Item>
            </div>
            <Form.Item
              name="licensePlate"
              noStyle
              rules={[
                {
                  required: true,
                  message:
                    'Пожалуйста, введите гос. номер или отметьте "Без номера"',
                },
              ]}
            >
              <Input placeholder="А123БВ" disabled={isWithoutPlate} />
            </Form.Item>
          </Form.Item>

          <Form.Item
            name="year"
            label="Год выпуска"
            rules={[
              {
                type: 'number',
                transform: (value) => (value ? Number(value) : null),
                min: 1900,
                max: new Date().getFullYear(),
                message: `Год выпуска должен быть числом от 1900 до ${new Date().getFullYear()}`,
              },
            ]}
          >
            <Input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              placeholder="Например: 2020"
            />
          </Form.Item>

          <Form.Item
            name="bodyType"
            label="Тип кузова"
            rules={[
              { required: true, message: 'Пожалуйста, укажите тип кузова' },
            ]}
          >
            <Select placeholder="Выберите тип кузова">
              <Option value="Седан">Седан</Option>
              <Option value="Хэтчбек">Хэтчбек</Option>
              <Option value="Универсал">Универсал</Option>
              <Option value="Кроссовер">Кроссовер</Option>
              <Option value="Внедорожник">Внедорожник</Option>
              <Option value="Минивэн">Минивэн</Option>
              <Option value="Купе">Купе</Option>
              <Option value="Кабриолет">Кабриолет</Option>
              <Option value="Пикап">Пикап</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="engineVolume"
            label="Объем двигателя (л)"
            rules={[
              {
                type: 'number',
                transform: (value) => (value ? Number(value) : null),
                min: 0.1,
                message: 'Объем двигателя должен быть числом больше 0.1',
              },
            ]}
          >
            <Input
              type="number"
              min={0.1}
              step={0.1}
              placeholder="Например: 2.0"
            />
          </Form.Item>

          <Form.Item name="vin" label="VIN">
            <Input maxLength={17} placeholder="17 знаков VIN-номера" />
          </Form.Item>

          <div className="flex justify-between mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Отмена</Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleSelection;
