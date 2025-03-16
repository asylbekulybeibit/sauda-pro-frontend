import {
  Modal,
  Form,
  Select,
  Button,
  Divider,
  Space,
  Input,
  Popconfirm,
} from 'antd';
import {
  CashRegister,
  PaymentMethodType,
  PaymentMethodSource,
} from '@/types/cash-register';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import { message } from 'antd';

interface EditPaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  register: CashRegister;
}

const systemPaymentMethods = [
  { value: PaymentMethodType.CASH, label: 'Наличные' },
  { value: PaymentMethodType.CARD, label: 'Банковская карта' },
  { value: PaymentMethodType.QR, label: 'QR-код' },
];

interface FormValues {
  systemPaymentMethods: PaymentMethodType[];
  customPaymentMethods: Array<{
    id?: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
  }>;
}

export default function EditPaymentMethodsModal({
  isOpen,
  onClose,
  onSuccess,
  register,
}: EditPaymentMethodsModalProps) {
  const [form] = Form.useForm<FormValues>();

  // Подготавливаем начальные значения формы
  const initialValues = {
    systemPaymentMethods: register.paymentMethods
      .filter(
        (method) =>
          method.source === PaymentMethodSource.SYSTEM && method.systemType
      )
      .map((method) => method.systemType!),
    customPaymentMethods: register.paymentMethods
      .filter((method) => method.source === PaymentMethodSource.CUSTOM)
      .map((method) => ({
        id: method.id,
        name: method.name!,
        code: method.code!,
        description: method.description,
        isActive: method.isActive,
      })),
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Преобразуем значения формы в формат API
      const paymentMethods = [
        // Системные методы
        ...values.systemPaymentMethods.map((type) => ({
          source: PaymentMethodSource.SYSTEM,
          systemType: type,
          isActive: true,
        })),
        // Кастомные методы
        ...values.customPaymentMethods.map((method) => ({
          id: method.id,
          source: PaymentMethodSource.CUSTOM,
          name: method.name,
          code: method.code,
          description: method.description,
          isActive: method.isActive,
        })),
      ];

      await cashRegistersApi.updatePaymentMethods(register.id, paymentMethods);
      message.success('Методы оплаты обновлены');
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Не удалось обновить методы оплаты');
    }
  };

  return (
    <Modal
      title="Редактирование методов оплаты"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          name="systemPaymentMethods"
          label="Стандартные методы оплаты"
          rules={[
            {
              required: true,
              type: 'array',
              min: 1,
              message: 'Выберите хотя бы один метод оплаты',
            },
          ]}
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
                  <Form.Item
                    {...restField}
                    name={[name, 'isActive']}
                    valuePropName="checked"
                  >
                    <Popconfirm
                      title="Отключить метод оплаты?"
                      description="Вы уверены, что хотите отключить этот метод оплаты?"
                      onConfirm={() => {
                        const values = form.getFieldValue(
                          'customPaymentMethods'
                        );
                        values[name].isActive = !values[name].isActive;
                        form.setFieldValue('customPaymentMethods', values);
                      }}
                      okText="Да"
                      cancelText="Нет"
                    >
                      <Button
                        type={
                          form.getFieldValue([
                            'customPaymentMethods',
                            name,
                            'isActive',
                          ])
                            ? 'primary'
                            : 'default'
                        }
                      >
                        {form.getFieldValue([
                          'customPaymentMethods',
                          name,
                          'isActive',
                        ])
                          ? 'Активен'
                          : 'Неактивен'}
                      </Button>
                    </Popconfirm>
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
                >
                  Добавить метод оплаты
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="primary" htmlType="submit">
            Сохранить
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
