import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Form,
  InputNumber,
  Switch,
  Button,
  Modal,
  Select,
  List,
  Spin,
  Alert,
  Space,
  Divider,
} from 'antd';
import {
  inventoryNotificationsApi,
  InventoryNotification,
  CreateInventoryNotificationDto,
} from '@/services/notifications';
import { useWarehouseProducts } from '@/hooks';
import { PlusOutlined } from '@ant-design/icons';
import { useRoleStore } from '@/store/roleStore';
import { api } from '@/services/api';
import { LowStockPopoverRef } from '@/components/manager/notifications/LowStockPopover';

const { Title, Text } = Typography;

const InventoryNotifications: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const warehouseId =
    currentRole?.type === 'shop' ? currentRole.warehouse?.id : undefined;

  const [rules, setRules] = useState<InventoryNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Создаем ref для доступа к функции обновления колокольчика
  const lowStockPopoverRef = React.useRef<LowStockPopoverRef>(null);

  const { products, loading: loadingProducts } = useWarehouseProducts(
    shopId,
    warehouseId
  );

  // Загрузка правил
  const loadRules = async () => {
    if (!shopId || !warehouseId) return;

    setLoading(true);
    try {
      const data = await inventoryNotificationsApi.getAll(shopId, warehouseId);
      setRules(data);
    } catch (err) {
      setError('Ошибка при загрузке правил уведомлений');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId && warehouseId) {
      loadRules();
    }
  }, [shopId, warehouseId]);

  // Обработчики правил
  const handleToggleRule = async (rule: InventoryNotification) => {
    if (!shopId) return;

    try {
      await inventoryNotificationsApi.update(shopId, rule.id, {
        isEnabled: !rule.isEnabled,
      });
      setRules(
        rules.map((r) =>
          r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r
        )
      );
      // Обновляем колокольчик после изменения правила
      lowStockPopoverRef.current?.refresh();
    } catch (err) {
      setError('Ошибка при обновлении правила');
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!shopId) return;

    // Находим название товара для отображения в модальном окне
    const rule = rules.find((r) => r.id === ruleId);
    const productName = products?.find((p) => p.id === rule?.warehouseProductId)
      ?.barcode?.productName;

    Modal.confirm({
      title: 'Подтверждение удаления',
      content: `Вы действительно хотите удалить правило уведомления для товара "${productName}"? Это действие нельзя отменить.`,
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await inventoryNotificationsApi.delete(shopId, ruleId);
          setRules(rules.filter((r) => r.id !== ruleId));
          // Обновляем колокольчик после удаления правила
          lowStockPopoverRef.current?.refresh();
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || 'Ошибка при удалении правила';
          setError(errorMessage);
          console.error('Error deleting rule:', err);
        }
      },
    });
  };

  // Опции для выбора продукта
  const productOptions =
    products?.map((product) => ({
      value: product.id,
      label: `${product.barcode?.productName} (${product.barcode?.code})`,
    })) || [];

  // Обработчик создания правила
  const handleCreate = async (values: any) => {
    if (!shopId || !warehouseId) return;

    try {
      // Сначала обновляем интервал уведомлений
      await api.patch(
        `/shops/${shopId}/notifications/whatsapp/interval`,
        {
          intervalHours: values.intervalHours,
        },
        {
          params: { warehouseId },
        }
      );

      // Затем создаем правило
      const savedRule = await inventoryNotificationsApi.create(shopId, {
        warehouseProductId: values.warehouseProductId,
        warehouseId,
        minQuantity: values.minQuantity,
        notifyVia: ['whatsapp'],
        isEnabled: true,
      });

      setRules([...rules, savedRule]);
      setIsModalOpen(false);
      form.resetFields();
      // Обновляем колокольчик после создания правила
      lowStockPopoverRef.current?.refresh();
    } catch (err) {
      setError('Ошибка при сохранении правила');
      console.error(err);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={5}>
          Настройка уведомлений о минимальном количестве товаров
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: '#1890ff' }}
        >
          Добавить правило
        </Button>
      </div>

      {error && (
        <Alert message={error} type="error" style={{ marginBottom: 16 }} />
      )}

      <Modal
        title="Добавить правило"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleCreate}
          layout="vertical"
          initialValues={{ intervalHours: 24 }}
        >
          <Form.Item
            name="warehouseProductId"
            label="Товар"
            rules={[{ required: true, message: 'Выберите товар' }]}
          >
            <Select
              showSearch
              placeholder="Выберите товар"
              loading={loadingProducts}
              options={productOptions}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="minQuantity"
            label="Минимальное количество"
            rules={[{ required: true, message: 'Укажите количество' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Form.Item
            name="intervalHours"
            label="Интервал между уведомлениями (часов)"
            rules={[{ required: true, message: 'Укажите интервал' }]}
            extra="Этот интервал будет применяться ко всем товарам с низким остатком. После отправки уведомления, следующее будет отправлено только после истечения указанного времени."
          >
            <InputNumber min={1} max={168} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                }}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ backgroundColor: '#1890ff' }}
              >
                Сохранить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <List
        dataSource={rules}
        locale={{ emptyText: 'Нет правил уведомлений' }}
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
                products?.find((p) => p.id === rule.warehouseProductId)?.barcode
                  ?.productName
              }
              description={
                <Space direction="vertical">
                  <Text>Минимальное количество: {rule.minQuantity}</Text>
                  <Text>Уведомления через WhatsApp</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default InventoryNotifications;
