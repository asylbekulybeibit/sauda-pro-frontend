import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  Switch,
  message,
  Divider,
  Tabs,
  Checkbox,
  Tooltip,
  Typography,
} from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  MinusCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  CashRegister,
  PaymentMethodType,
  PaymentMethodSource,
  PaymentMethodStatus,
  RegisterPaymentMethod,
} from '@/types/cash-register';
import { cashRegistersApi } from '@/services/cashRegistersApi';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;

interface EditPaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  register: CashRegister;
  warehouseId: string;
}

interface FormValues {
  systemPaymentMethods: PaymentMethodType[];
  customPaymentMethods: Array<{
    id?: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    status: PaymentMethodStatus;
    isShared?: boolean;
  }>;
}

export default function EditPaymentMethodsModal({
  isOpen,
  onClose,
  onSuccess,
  register,
  warehouseId,
}: EditPaymentMethodsModalProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  // Получаем общие методы оплаты для склада
  const { data: sharedPaymentMethods = [] } = useQuery({
    queryKey: ['shared-payment-methods', warehouseId],
    queryFn: () => cashRegistersApi.getSharedPaymentMethods(warehouseId),
    enabled: !!warehouseId && isOpen,
  });

  // При открытии модального окна устанавливаем начальные значения формы
  useEffect(() => {
    if (isOpen && register) {
      // Разделяем методы оплаты по источнику (системные/кастомные)
      const systemMethods = register.paymentMethods
        .filter(
          (method) =>
            method.source === PaymentMethodSource.SYSTEM &&
            method.cashRegisterId === register.id
        )
        .map((method) => method.systemType);

      const customMethods = register.paymentMethods
        .filter(
          (method) =>
            method.source === PaymentMethodSource.CUSTOM &&
            method.cashRegisterId === register.id
        )
        .map((method) => ({
          id: method.id,
          name: method.name || '',
          code: method.code || '',
          description: method.description || '',
          isActive: method.isActive,
          status: method.status,
          isShared: false,
        }));

      form.setFieldsValue({
        systemPaymentMethods: systemMethods,
        customPaymentMethods: customMethods,
      });
    }
  }, [isOpen, register, form]);

  const updateMutation = useMutation({
    mutationFn: (values: any) => {
      // Проверка наличия warehouseId
      if (!warehouseId) {
        console.error('warehouseId is undefined in EditPaymentMethodsModal');
        throw new Error(
          'ID склада не определен. Пожалуйста, перезагрузите страницу.'
        );
      }

      console.log(
        'Updating payment methods with warehouseId:',
        warehouseId,
        'registerId:',
        register.id
      );

      // Трансформируем данные для API
      const paymentMethods = [];

      // Обрабатываем системные методы оплаты, если они есть
      if (
        values.systemPaymentMethods &&
        values.systemPaymentMethods.length > 0
      ) {
        const systemMethods = values.systemPaymentMethods.map(
          (type: PaymentMethodType) => ({
            source: PaymentMethodSource.SYSTEM,
            systemType: type,
            status: PaymentMethodStatus.ACTIVE,
            isActive: true,
          })
        );
        paymentMethods.push(...systemMethods);
      }

      // Обрабатываем кастомные методы оплаты, если они есть
      if (
        values.customPaymentMethods &&
        values.customPaymentMethods.length > 0
      ) {
        const customMethods = values.customPaymentMethods.map(
          (method: any) => ({
            source: PaymentMethodSource.CUSTOM,
            id: method.id,
            name: method.name,
            code: method.code,
            description: method.description,
            isActive: method.isActive,
            status: method.status || PaymentMethodStatus.ACTIVE,
            isShared: method.isShared || false,
          })
        );
        paymentMethods.push(...customMethods);
      }

      console.log(
        'Отправка методов оплаты на сервер:',
        JSON.stringify(paymentMethods, null, 2)
      );

      return cashRegistersApi.updatePaymentMethods(
        warehouseId,
        register.id,
        paymentMethods
      );
    },
    onSuccess: (data) => {
      console.log('Успешное обновление методов оплаты:', data);
    },
    onError: (error) => {
      console.error('Ошибка при обновлении методов оплаты:', error);
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await updateMutation.mutateAsync(values);
      message.success('Методы оплаты успешно обновлены');
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(
        `Ошибка при обновлении методов оплаты: ${
          error.response?.data?.message || 'Неизвестная ошибка'
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Редактирование методов оплаты кассы: ${register?.name || ''}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Системные методы" key="1">
            <Form.Item
              name="systemPaymentMethods"
              label="Системные методы оплаты"
            >
              <Select
                mode="multiple"
                placeholder="Выберите методы оплаты"
                style={{ width: '100%' }}
              >
                <Option value={PaymentMethodType.CASH}>Наличные</Option>
                <Option value={PaymentMethodType.CARD}>Карта</Option>
                <Option value={PaymentMethodType.QR}>QR-код</Option>
              </Select>
            </Form.Item>
          </TabPane>

          <TabPane tab="Кастомные методы" key="2">
            <div className="mb-4">
              <Text>
                Кастомные методы оплаты позволяют создать дополнительные способы
                оплаты, которые не входят в стандартные системные методы. Вы
                можете сделать их общими для всех касс склада или ограничить
                доступ только этой кассой.
                <Tooltip title="Метод с флагом 'Общий' будет доступен во всех кассах склада с единым балансом">
                  <InfoCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </Text>
            </div>

            {/* Список существующих общих методов оплаты */}
            {sharedPaymentMethods.length > 0 && (
              <div className="mb-4">
                <Text strong>Существующие общие методы оплаты:</Text>
                <div>
                  <Text type="secondary">
                    Эти методы оплаты уже созданы и являются общими для всего
                    склада. Они автоматически доступны во всех кассах, включая
                    текущую. Редактировать и удалять эти методы можно только
                    через создание новой кассы или редактирование другой кассы.
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
                        rules={[
                          { required: true, message: 'Введите название' },
                        ]}
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
                        name={[name, 'isActive']}
                        fieldKey={[fieldKey, 'isActive']}
                        label="Активен"
                        valuePropName="checked"
                        initialValue={true}
                      >
                        <Switch />
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
                      >
                        Удалить
                      </Button>
                    </div>
                  ))}

                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          isActive: true,
                          status: PaymentMethodStatus.ACTIVE,
                        })
                      }
                      block
                      icon={<PlusOutlined />}
                    >
                      Добавить кастомный метод оплаты
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </TabPane>
        </Tabs>

        <Divider />

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Сохранить
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
