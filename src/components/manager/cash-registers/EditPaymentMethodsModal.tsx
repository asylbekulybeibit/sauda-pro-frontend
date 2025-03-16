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
  PaymentMethodStatus,
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
    status: PaymentMethodStatus;
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
          method.source === PaymentMethodSource.SYSTEM &&
          method.systemType &&
          method.status === PaymentMethodStatus.ACTIVE &&
          method.isActive === true
      )
      .map((method) => method.systemType!),
    customPaymentMethods: register.paymentMethods
      .filter(
        (method) =>
          method.source === PaymentMethodSource.CUSTOM &&
          method.isActive === true
      )
      .map((method) => ({
        id: method.id,
        name: method.name!,
        code: method.code!,
        description: method.description,
        isActive: method.isActive,
        status: method.status,
      })),
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Преобразуем значения формы в формат API
      const paymentMethods = [
        // Системные методы - активные
        ...values.systemPaymentMethods.map((type) => ({
          source: PaymentMethodSource.SYSTEM,
          systemType: type,
          isActive: true,
          status: PaymentMethodStatus.ACTIVE,
        })),
        // Системные методы - неактивные
        ...register.paymentMethods
          .filter(
            (method) =>
              method.source === PaymentMethodSource.SYSTEM &&
              method.systemType &&
              !values.systemPaymentMethods.includes(method.systemType)
          )
          .map((method) => ({
            source: PaymentMethodSource.SYSTEM,
            systemType: method.systemType,
            isActive: true,
            status: PaymentMethodStatus.INACTIVE,
          })),
        // Кастомные методы с их статусами
        ...values.customPaymentMethods.map((method) => ({
          source: PaymentMethodSource.CUSTOM,
          name: method.name,
          code: method.code,
          description: method.description,
          isActive: true,
          status: method.status,
        })),
      ];

      await cashRegistersApi.updatePaymentMethods(
        register.shopId,
        register.id,
        paymentMethods
      );
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
                    name={[name, 'status']}
                    initialValue={PaymentMethodStatus.ACTIVE}
                  >
                    <Popconfirm
                      title={
                        form.getFieldValue([
                          'customPaymentMethods',
                          name,
                          'status',
                        ]) === PaymentMethodStatus.ACTIVE
                          ? 'Отключить метод оплаты?'
                          : 'Включить метод оплаты?'
                      }
                      description={
                        form.getFieldValue([
                          'customPaymentMethods',
                          name,
                          'status',
                        ]) === PaymentMethodStatus.ACTIVE
                          ? 'Вы уверены, что хотите отключить этот метод оплаты?'
                          : 'Вы уверены, что хотите включить этот метод оплаты?'
                      }
                      onConfirm={() => {
                        const currentStatus = form.getFieldValue([
                          'customPaymentMethods',
                          name,
                          'status',
                        ]);

                        // Получаем все текущие методы
                        const methods = form.getFieldValue(
                          'customPaymentMethods'
                        );

                        // Создаем новый массив с обновленным значением
                        const updatedMethods = methods.map(
                          (
                            method: FormValues['customPaymentMethods'][0],
                            index: number
                          ) =>
                            index === name
                              ? {
                                  ...method,
                                  status:
                                    currentStatus === PaymentMethodStatus.ACTIVE
                                      ? PaymentMethodStatus.INACTIVE
                                      : PaymentMethodStatus.ACTIVE,
                                }
                              : method
                        );

                        // Обновляем значение в форме
                        form.setFieldsValue({
                          customPaymentMethods: updatedMethods,
                        });

                        // Заставляем форму обновиться
                        form.validateFields(['customPaymentMethods']);
                      }}
                      okText="Да"
                      cancelText="Нет"
                      okButtonProps={{
                        className: 'bg-blue-500 hover:bg-blue-500',
                      }}
                      cancelButtonProps={{
                        className: 'bg-blue-500 hover:bg-blue-500',
                      }}
                    >
                      <Button
                        type="primary"
                        className={
                          form.getFieldValue([
                            'customPaymentMethods',
                            name,
                            'status',
                          ]) === PaymentMethodStatus.ACTIVE
                            ? 'bg-blue-500 hover:bg-blue-500'
                            : 'bg-gray-500 hover:bg-gray-500'
                        }
                      >
                        {form.getFieldValue([
                          'customPaymentMethods',
                          name,
                          'status',
                        ]) === PaymentMethodStatus.ACTIVE
                          ? 'Активен'
                          : 'Неактивен'}
                      </Button>
                    </Popconfirm>
                  </Form.Item>
                  <MinusCircleOutlined
                    onClick={() => {
                      // Получаем все текущие методы
                      const methods = form.getFieldValue(
                        'customPaymentMethods'
                      );

                      // Создаем новый массив с обновленным значением
                      const updatedMethods = methods.map(
                        (
                          method: FormValues['customPaymentMethods'][0],
                          index: number
                        ) =>
                          index === name
                            ? {
                                ...method,
                                isActive: false,
                                status: PaymentMethodStatus.INACTIVE,
                              }
                            : method
                      );

                      // Обновляем значение в форме перед удалением
                      form.setFieldsValue({
                        customPaymentMethods: updatedMethods,
                      });

                      // Удаляем метод из формы
                      remove(name);
                    }}
                  />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add({ status: PaymentMethodStatus.ACTIVE });
                  }}
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
          <Button
            type="primary"
            htmlType="submit"
            className="bg-blue-500 hover:bg-blue-500"
          >
            Сохранить
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
