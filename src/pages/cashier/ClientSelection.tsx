import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Input,
  Spin,
  Empty,
  Menu,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { getClients, createClient } from '@/services/cashierApi';

const { Title, Text } = Typography;
const { Option } = Select;

// Интерфейс для клиента
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  discountPercent?: number;
  notes?: string;
}

// Интерфейс для формы создания нового клиента
interface CreateClientForm {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  discountPercent?: number;
}

/**
 * Страница выбора клиента (второй шаг)
 */
const ClientSelection: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Форма для создания нового клиента
  const [form] = Form.useForm<CreateClientForm>();

  // Получение выбранной услуги из предыдущего шага
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    // Загружаем выбранную услугу из localStorage
    const storedService = localStorage.getItem('selectedService');
    if (storedService) {
      try {
        setSelectedService(JSON.parse(storedService));
      } catch (e) {
        console.error('Ошибка при чтении выбранной услуги:', e);
      }
    }
  }, []);

  // Загрузка клиентов
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const clientsData = await getClients(shopId || '');
        setClients(clientsData);
      } catch (err) {
        console.error('Ошибка при загрузке клиентов:', err);
        setError(
          'Не удалось загрузить список клиентов. Пожалуйста, попробуйте позже.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchClients();
    }
  }, [shopId]);

  // Обработчик возврата к выбору услуги
  const handleBack = () => {
    navigate(`/cashier/${shopId}/select-service`);
  };

  // Обработчик выбора клиента
  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  // Обработчик перехода к следующему шагу
  const handleNext = () => {
    if (!selectedClient) {
      message.warning('Пожалуйста, выберите клиента');
      return;
    }

    // Сохраняем выбранного клиента в localStorage для следующей страницы
    localStorage.setItem('selectedClient', JSON.stringify(selectedClient));

    // Переход к выбору автомобиля клиента
    navigate(`/cashier/${shopId}/select-vehicle`);
  };

  // Обработчик "Пропустить"
  const handleSkip = () => {
    // Очищаем выбранного клиента
    localStorage.removeItem('selectedClient');

    // Переходим к следующему шагу
    navigate(`/cashier/${shopId}/select-vehicle`);
  };

  // Открытие модального окна для создания нового клиента
  const showNewClientModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // Создание нового клиента
  const handleCreateClient = async (values: CreateClientForm) => {
    try {
      setLoading(true);
      // Создаем клиента через API
      const newClient = await createClient(shopId || '', values);

      // Обновляем список клиентов
      setClients((prev) => [...prev, newClient]);
      setSelectedClient(newClient);

      message.success('Клиент успешно создан');
      setIsModalVisible(false);

      // Сохраняем клиента и переходим к выбору автомобиля
      localStorage.setItem('selectedClient', JSON.stringify(newClient));
      navigate(`/cashier/${shopId}/select-vehicle`);
    } catch (err) {
      console.error('Ошибка при создании клиента:', err);
      message.error(
        'Не удалось создать клиента. Проверьте, возможно, клиент с таким телефоном уже существует.'
      );
    } finally {
      setLoading(false);
    }
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
              Выберите клиента
            </Title>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleSkip}>Пропустить</Button>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={handleNext}
              disabled={!selectedClient}
            >
              Далее
            </Button>
          </div>
        </div>

        {/* Информация о выбранной услуге */}
        {selectedService && (
          <Card className="mb-4 bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <Text strong>Выбранная услуга: </Text>
                <Text>{selectedService.name}</Text>
              </div>
              <Text strong>{selectedService.price} ₽</Text>
            </div>
          </Card>
        )}

        {/* Выбор клиента */}
        <div className="mb-6">
          <div className="mb-2">
            <Text strong>Выберите клиента из списка:</Text>
          </div>
          <div className="flex gap-2">
            {loading ? (
              <Spin className="mr-2" />
            ) : (
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="Найдите клиента по имени, фамилии или телефону"
                optionFilterProp="children"
                onChange={handleClientSelect}
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                notFoundContent={
                  error ? (
                    <Empty description={error} />
                  ) : (
                    <Empty description="Клиенты не найдены" />
                  )
                }
                size="large"
              >
                {clients.map((client) => (
                  <Option
                    key={client.id}
                    value={client.id}
                    label={`${client.lastName} ${client.firstName} (${client.phone})`}
                  >
                    <div className="flex justify-between">
                      <span>
                        {client.lastName} {client.firstName}
                      </span>
                      <span className="text-gray-400">{client.phone}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showNewClientModal}
              size="large"
            >
              Добавить нового
            </Button>
          </div>
        </div>

        {/* Информация о выбранном клиенте */}
        {selectedClient && (
          <Card className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <Text strong>Выбранный клиент: </Text>
                <Text>{`${selectedClient.lastName} ${selectedClient.firstName}`}</Text>
              </div>
              {selectedClient.discountPercent > 0 && (
                <Text type="success">
                  Скидка: {selectedClient.discountPercent}%
                </Text>
              )}
            </div>
            <div>
              <Text type="secondary">Телефон: {selectedClient.phone}</Text>
              {selectedClient.email && (
                <div>
                  <Text type="secondary">Email: {selectedClient.email}</Text>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="mb-4 mt-6">
          <Text type="secondary">
            Если клиента нет в базе данных, нажмите кнопку "Добавить нового".
            Если вы хотите продолжить без выбора клиента, нажмите "Пропустить".
          </Text>
        </Card>
      </div>

      {/* Нижняя кнопка действия на мобильных устройствах */}
      <div className="sticky bottom-0 bg-white shadow-lg p-4 border-t border-gray-200 md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Button size="large" block onClick={handleSkip}>
            Пропустить
          </Button>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleNext}
            disabled={!selectedClient}
          >
            Далее
          </Button>
        </div>
      </div>

      {/* Модальное окно для создания нового клиента */}
      <Modal
        title="Добавление нового клиента"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateClient}>
          <Form.Item
            name="firstName"
            label="Имя"
            rules={[{ required: true, message: 'Пожалуйста, введите имя' }]}
          >
            <Input placeholder="Введите имя" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Фамилия"
            rules={[{ required: true, message: 'Пожалуйста, введите фамилию' }]}
          >
            <Input placeholder="Введите фамилию" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Телефон"
            rules={[{ required: true, message: 'Пожалуйста, введите телефон' }]}
          >
            <Input placeholder="+7 (___) ___-__-__" />
          </Form.Item>
          <Form.Item name="discountPercent" label="Скидка %">
            <InputNumber min={0} max={100} placeholder="0 %" />
          </Form.Item>
          <div className="flex justify-between mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Назад</Button>
            <Button type="primary" htmlType="submit">
              Сохранить
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientSelection;
