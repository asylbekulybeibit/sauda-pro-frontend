import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Form,
  InputNumber,
  Switch,
  Button,
  Card,
  Select,
  List,
  Spin,
  Alert,
  Space,
} from 'antd';
import {
  vehicleNotificationsApi,
  VehicleNotification,
  CreateVehicleNotificationDto,
} from '@/services/notifications';

const { Title, Text } = Typography;
const { Option } = Select;

const serviceTypes = [
  {
    value: 'engine_oil',
    label: 'Замена масла двигателя',
    averageKm: 7000,
    averageDays: 180, // ~6 месяцев при среднем пробеге 15000 км/год
    description:
      'Средний пробег до замены 7000 км (около 6 месяцев при стандартной эксплуатации)',
  },
  {
    value: 'transmission_oil',
    label: 'Замена масла АКПП',
    averageKm: 60000,
    averageDays: 730, // ~24 месяца
    description:
      'Средний пробег до замены 60000 км (около 2 лет при стандартной эксплуатации)',
  },
  {
    value: 'brake_fluid',
    label: 'Замена тормозной жидкости',
    averageKm: 40000,
    averageDays: 730, // каждые 2 года
    description: 'Замена каждые 40000 км или раз в 2 года',
  },
  {
    value: 'air_filter',
    label: 'Замена воздушного фильтра',
    averageKm: 15000,
    averageDays: 365, // раз в год
    description: 'Замена каждые 15000 км или раз в год',
  },
  {
    value: 'fuel_filter',
    label: 'Замена топливного фильтра',
    averageKm: 30000,
    averageDays: 730, // каждые 2 года
    description: 'Замена каждые 30000 км или раз в 2 года',
  },
];

const VehicleNotifications: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const [rules, setRules] = useState<VehicleNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (shopId) {
      loadRules();
    }
  }, [shopId]);

  const loadRules = async () => {
    if (!shopId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await vehicleNotificationsApi.getAll(shopId);
      setRules(data);
    } catch (err) {
      setError('Ошибка при загрузке правил уведомлений');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values: CreateVehicleNotificationDto) => {
    if (!shopId) return;

    setSaving(true);
    setError(null);
    try {
      const savedRule = await vehicleNotificationsApi.create(shopId, values);
      setRules([...rules, savedRule]);
      form.resetFields();
    } catch (err) {
      setError('Ошибка при сохранении правила');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (rule: VehicleNotification) => {
    if (!shopId) return;

    try {
      await vehicleNotificationsApi.update(shopId, rule.id, {
        isEnabled: !rule.isEnabled,
      });
      setRules(
        rules.map((r) =>
          r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r
        )
      );
    } catch (err) {
      setError('Ошибка при обновлении правила');
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!shopId) return;

    try {
      await vehicleNotificationsApi.delete(shopId, ruleId);
      setRules(rules.filter((r) => r.id !== ruleId));
    } catch (err) {
      setError('Ошибка при удалении правила');
      console.error(err);
    }
  };

  const handleServiceTypeChange = (value: string) => {
    const selectedType = serviceTypes.find((type) => type.value === value);
    if (selectedType) {
      form.setFieldsValue({
        mileageInterval: selectedType.averageKm,
        monthsInterval: Math.floor(selectedType.averageDays / 30), // конвертируем дни в месяцы
      });
    }
  };

  return (
    <div>
      <Title level={5}>Настройка уведомлений о техническом обслуживании</Title>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: 16 }} />
      )}

      <Card
        title="Добавить новое правило обслуживания"
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          onFinish={handleFinish}
          layout="vertical"
          initialValues={{
            isEnabled: true,
            notifyVia: ['whatsapp'],
          }}
        >
          <Form.Item
            name="serviceType"
            label="Тип обслуживания"
            rules={[{ required: true, message: 'Выберите тип обслуживания' }]}
            extra={
              form.getFieldValue('serviceType') &&
              serviceTypes.find(
                (t) => t.value === form.getFieldValue('serviceType')
              )?.description
            }
          >
            <Select onChange={handleServiceTypeChange}>
              {serviceTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Space style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="mileageInterval"
              label="Интервал пробега (км)"
              rules={[{ required: true, message: 'Укажите интервал пробега' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="monthsInterval"
              label="Интервал времени (месяцев)"
              rules={[{ required: true, message: 'Укажите интервал времени' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            name="notifyVia"
            label="Способ уведомления"
            rules={[{ required: true, message: 'Выберите способ уведомления' }]}
          >
            <Select mode="multiple">
              <Option value="whatsapp">WhatsApp</Option>
              <Option value="email">Email</Option>
              <Option value="sms">SMS</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isEnabled" valuePropName="checked">
            <Switch checkedChildren="Включено" unCheckedChildren="Выключено" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={!form.getFieldValue('serviceType')}
            >
              Сохранить правило
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Title level={5}>Существующие правила</Title>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
        </div>
      ) : rules.length === 0 ? (
        <Text type="secondary">Пока нет настроенных правил уведомлений</Text>
      ) : (
        <List
          dataSource={rules}
          renderItem={(rule) => (
            <List.Item
              actions={[
                <Switch
                  key="toggle"
                  checked={rule.isEnabled}
                  onChange={() => handleToggleRule(rule)}
                />,
                <Button
                  key="delete"
                  danger
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  Удалить
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  serviceTypes.find((t) => t.value === rule.serviceType)?.label
                }
                description={
                  <Space direction="vertical">
                    <Text>
                      Интервал: {rule.mileageInterval} км или{' '}
                      {rule.monthsInterval} месяцев
                    </Text>
                    <Text>Уведомления через: {rule.notifyVia.join(', ')}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default VehicleNotifications;
