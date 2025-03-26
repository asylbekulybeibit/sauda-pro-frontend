import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Divider,
  Space,
  message,
} from 'antd';
import {
  CashRegisterType,
  PaymentMethodType,
  PaymentMethodSource,
  PaymentMethodDto,
  PaymentMethodStatus,
} from '@/types/cash-register';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

interface CreateCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (values: FormValues) => void;
  warehouseId: string;
}

const registerTypes = [
  { value: CashRegisterType.STATIONARY, label: 'Стационарная' },
  { value: CashRegisterType.MOBILE, label: 'Мобильная' },
  { value: CashRegisterType.EXPRESS, label: 'Экспресс' },
  { value: CashRegisterType.SELF_SERVICE, label: 'Самообслуживание' },
];

const systemPaymentMethods = [
  { value: PaymentMethodType.CASH, label: 'Наличные' },
  { value: PaymentMethodType.CARD, label: 'Банковская карта' },
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
  }>;
}

export default function CreateCashRegisterModal({
  isOpen,
  onClose,
  onSuccess,
  warehouseId,
}: CreateCashRegisterModalProps) {
  const [form] = Form.useForm<FormValues>();

  const handleSubmit = async (values: FormValues) => {
    try {
      // Преобразуем значения формы в формат DTO
      const paymentMethods: PaymentMethodDto[] = [
        // Системные методы оплаты (если они выбраны)
        ...(values.systemPaymentMethods || []).map((type) => {
          // Получаем соответствующее название из списка системных методов
          const methodName =
            systemPaymentMethods.find((method) => method.value === type)
              ?.label || '';

          return {
            source: PaymentMethodSource.SYSTEM,
            systemType: type,
            name: methodName, // Добавляем название метода оплаты
            isActive: true,
            status: PaymentMethodStatus.ACTIVE,
          };
        }),
        // Кастомные методы оплаты (если они указаны)
        ...(values.customPaymentMethods || []).map((method) => ({
          source: PaymentMethodSource.CUSTOM,
          name: method.name,
          code: method.code,
          description: method.description,
          isActive: true,
          status: PaymentMethodStatus.ACTIVE,
        })),
      ];

      // Проверяем, что есть хотя бы один метод оплаты
      if (paymentMethods.length === 0) {
        message.warning('Необходимо указать хотя бы один метод оплаты');
        return;
      }

      await cashRegistersApi.create(warehouseId, {
        name: values.name,
        type: values.type,
        location: values.location,
        paymentMethods,
      });

      form.resetFields();
      onSuccess(values);
    } catch (error) {
      // Ошибка будет обработана глобальным обработчиком
    }
  };

  return (
    <Modal
      title="Создание новой кассы"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
          <Input placeholder="Введите название" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Тип кассы"
          rules={[{ required: true, message: 'Выберите тип кассы' }]}
        >
          <Select placeholder="Выберите тип" options={registerTypes} />
        </Form.Item>

        <Form.Item name="location" label="Расположение">
          <Input placeholder="Укажите расположение кассы" />
        </Form.Item>

        <Form.Item
          name="systemPaymentMethods"
          label="Стандартные методы оплаты"
        >
          <Select
            mode="multiple"
            placeholder="Выберите методы оплаты"
            options={systemPaymentMethods}
          />
        </Form.Item>

        <Divider>Кастомные методы оплаты</Divider>

        <Form.List name="customPaymentMethods">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'Введите название' }]}
                  >
                    <Input placeholder="Название" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'code']}
                    rules={[{ required: true, message: 'Введите код' }]}
                  >
                    <Input placeholder="Код" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'description']}>
                    <Input placeholder="Описание" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  Добавить метод оплаты
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className="bg-blue-500 text-white">
            Отмена
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="bg-blue-500 hover:bg-blue-600"
          >
            Создать
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
