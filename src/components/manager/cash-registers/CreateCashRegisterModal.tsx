import { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Checkbox,
  Space,
  message,
  Divider,
  Typography,
  Tooltip,
} from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  MinusCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  CashRegisterType,
  PaymentMethodType,
  PaymentMethodSource,
  PaymentMethodStatus,
} from '@/types/cash-register';
import { cashRegistersApi } from '@/services/cashRegistersApi';

const { Option } = Select;
const { Text } = Typography;

interface CreateCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (values: FormValues) => void;
  warehouseId: string;
}

// Объект для перевода типов касс
const cashRegisterTypeOptions = [
  { value: CashRegisterType.STATIONARY, label: 'Стационарная' },
  { value: CashRegisterType.MOBILE, label: 'Мобильная' },
  { value: CashRegisterType.EXPRESS, label: 'Экспресс' },
  { value: CashRegisterType.SELF_SERVICE, label: 'Самообслуживание' },
];

// Объект для перевода типов методов оплаты
const paymentMethodTypeOptions = [
  { value: PaymentMethodType.CASH, label: 'Наличные' },
  { value: PaymentMethodType.CARD, label: 'Карта' },
  { value: PaymentMethodType.QR, label: 'QR-код' },
];

interface FormValues {
  name: string;
  type: CashRegisterType;
  location?: string;
  systemPaymentMethods: PaymentMethodType[];
  customPaymentMethods: Array<{
    name: string;
    code: string;
    description?: string;
    isShared?: boolean;
  }>;
}

export default function CreateCashRegisterModal({
  isOpen,
  onClose,
  onSuccess,
  warehouseId,
}: CreateCashRegisterModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Получаем общие методы оплаты для склада
  const { data: sharedPaymentMethods = [] } = useQuery({
    queryKey: ['shared-payment-methods', warehouseId],
    queryFn: () => cashRegistersApi.getSharedPaymentMethods(warehouseId),
    enabled: !!warehouseId && isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      console.log('Create mutation called with values:', values);

      // Трансформируем данные для API
      const paymentMethods = [];

      // Обрабатываем системные методы оплаты, если они есть
      if (
        values.systemPaymentMethods &&
        values.systemPaymentMethods.length > 0
      ) {
        console.log('Processing system payment methods');
        const systemMethods = values.systemPaymentMethods.map(
          (type: PaymentMethodType) => ({
            source: PaymentMethodSource.SYSTEM,
            systemType: type,
            status: PaymentMethodStatus.ACTIVE,
            isActive: true,
          })
        );
        paymentMethods.push(...systemMethods);
        console.log('Added system payment methods:', systemMethods);
      }

      // Обрабатываем кастомные методы оплаты, если они есть
      if (
        values.customPaymentMethods &&
        values.customPaymentMethods.length > 0
      ) {
        console.log('Processing custom payment methods');
        console.log('Raw custom methods:', values.customPaymentMethods);

        const customMethods = values.customPaymentMethods.map(
          (method: any) => ({
            source: PaymentMethodSource.CUSTOM,
            name: method.name,
            code: method.code,
            description: method.description,
            status: PaymentMethodStatus.ACTIVE,
            isActive: true,
            isShared: method.isShared || false,
          })
        );
        paymentMethods.push(...customMethods);
        console.log('Added custom payment methods:', customMethods);
      }

      const payload = {
        name: values.name,
        type: values.type,
        location: values.location,
      };

      // Добавляем paymentMethods только если массив не пустой
      if (paymentMethods.length > 0) {
        payload.paymentMethods = paymentMethods;
        console.log('Adding payment methods to payload');
      } else {
        console.log('No payment methods to add to payload');
      }

      console.log('Final API payload:', payload);
      console.log('warehouseId:', warehouseId);

      return cashRegistersApi.create(warehouseId, payload);
    },
    onSuccess: (data) => {
      console.log('Cash register created successfully:', data);
    },
    onError: (error) => {
      console.error('Error creating cash register:', error);
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await createMutation.mutateAsync(values);
      message.success('Касса успешно создана');
      form.resetFields();
      onSuccess(values);
    } catch (error: any) {
      message.error(
        `Ошибка при создании кассы: ${
          error.response?.data?.message || 'Неизвестная ошибка'
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Создание новой кассы"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        preserve={false}
        initialValues={{
          systemPaymentMethods: [],
          customPaymentMethods: [],
        }}
      >
        <Form.Item
          name="name"
          label="Название кассы"
          rules={[{ required: true, message: 'Введите название кассы' }]}
        >
          <Input placeholder="Введите название кассы" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Тип кассы"
          rules={[{ required: true, message: 'Выберите тип кассы' }]}
        >
          <Select placeholder="Выберите тип кассы">
            {cashRegisterTypeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="location" label="Расположение">
          <Input placeholder="Введите расположение кассы" />
        </Form.Item>

        <Divider orientation="left">Системные методы оплаты</Divider>

        <Form.Item name="systemPaymentMethods" label="Методы оплаты">
          <Select
            mode="multiple"
            placeholder="Выберите методы оплаты"
            style={{ width: '100%' }}
          >
            {paymentMethodTypeOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider orientation="left">
          Кастомные методы оплаты
          <Tooltip title="Кастомные методы оплаты позволяют создать дополнительные способы оплаты, которые не входят в стандартные системные методы. Вы можете сделать их общими для всех касс склада или ограничить доступ только этой кассой.">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Divider>

        {/* Список существующих общих методов оплаты */}
        {sharedPaymentMethods.length > 0 && (
          <div className="mb-4">
            <Text strong>Существующие общие методы оплаты:</Text>
            <div>
              <Text type="secondary">
                Эти методы оплаты уже созданы и являются общими для всего
                склада. Они будут автоматически доступны в этой кассе, их не
                нужно добавлять повторно.
              </Text>
            </div>
            <div className="bg-gray-50 p-2 mt-2 rounded">
              {sharedPaymentMethods.map((method) => (
                <div key={method.id} className="py-1">
                  <Text>
                    {method.name}{' '}
                    <Text type="success">(общий для всех касс склада)</Text>
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}

        <Form.List name="customPaymentMethods">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }) => (
                <div key={key} className="bg-gray-50 p-3 mb-3 rounded">
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    fieldKey={[fieldKey, 'name']}
                    label="Название"
                    rules={[{ required: true, message: 'Введите название' }]}
                  >
                    <Input placeholder="Название метода оплаты" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'code']}
                    fieldKey={[fieldKey, 'code']}
                    label="Код"
                    rules={[{ required: true, message: 'Введите код' }]}
                  >
                    <Input placeholder="Уникальный код метода оплаты" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'description']}
                    fieldKey={[fieldKey, 'description']}
                    label="Описание"
                  >
                    <Input.TextArea placeholder="Описание метода оплаты" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'isShared']}
                    fieldKey={[fieldKey, 'isShared']}
                    valuePropName="checked"
                  >
                    <Checkbox>
                      Сделать общим для всех касс
                      <Tooltip title="Общий метод оплаты будет доступен во всех кассах склада, а его баланс будет общим. Вы сможете вносить и снимать средства через любую кассу, а баланс будет изменяться централизованно для всего склада.">
                        <InfoCircleOutlined style={{ marginLeft: 8 }} />
                      </Tooltip>
                    </Checkbox>
                  </Form.Item>

                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
                    style={{ marginTop: 8 }}
                  >
                    Удалить
                  </Button>
                </div>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Добавить кастомный метод оплаты
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Создать
            </Button>
            <Button onClick={onClose}>Отмена</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
