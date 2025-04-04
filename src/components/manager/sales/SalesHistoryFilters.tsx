import React, { useEffect, useState } from 'react';
import { DatePicker, Select, Input, Space, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { SalesHistoryFilters as Filters } from '../../../types/sales';
import * as salesApi from '../../../services/salesApi';

const { RangePicker } = DatePicker;

interface SalesHistoryFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  cashiers: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; firstName: string; lastName: string }>;
  vehicles: Array<{ id: string; name: string }>;
  warehouseId: string;
}

export const SalesHistoryFilters: React.FC<SalesHistoryFiltersProps> = ({
  onFiltersChange,
  cashiers,
  clients,
  vehicles,
  warehouseId,
}) => {
  const [form] = Form.useForm();
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ id: string; name: string; systemType?: string; source?: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoading(true);
        console.log(
          '⏳ Начинаем загрузку методов оплаты для склада:',
          warehouseId
        );
        const methods = await salesApi.getActivePaymentMethods(warehouseId);
        console.log('✅ Методы оплаты загружены:', methods);
        setPaymentMethods(methods);
      } catch (error) {
        console.error('❌ Ошибка при загрузке методов оплаты:', error);
      } finally {
        setLoading(false);
      }
    };

    if (warehouseId) {
      console.log(
        '🔄 Warehouse ID изменился, загружаем методы оплаты:',
        warehouseId
      );
      loadPaymentMethods();
    } else {
      console.log('⚠️ Отсутствует warehouseId, методы оплаты не загружаются');
    }

    // Отладочная информация
    return () => {
      console.log(
        '🧹 Компонент SalesHistoryFilters очищается с warehouseId:',
        warehouseId
      );
    };
  }, [warehouseId]);

  const handleFormChange = () => {
    const values = form.getFieldsValue();
    const dateRange = values.dateRange;
    onFiltersChange({
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      receiptType: values.receiptType,
      cashierId: values.cashierId,
      clientId: values.clientId,
      vehicleId: values.vehicleId,
      search: values.search,
      paymentMethod: values.paymentMethod,
    });
  };

  const filterOption = (
    input: string,
    option?: { label: string; value: string }
  ) => {
    return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
  };

  return (
    <Form form={form} onValuesChange={handleFormChange} layout="vertical">
      <Space wrap>
        <Form.Item name="dateRange" label="Период">
          <RangePicker
            style={{ width: '280px' }}
            placeholder={['Начало', 'Конец']}
          />
        </Form.Item>

        <Form.Item name="receiptType" label="Тип чека">
          <Select
            style={{ width: '150px' }}
            placeholder="Все типы"
            allowClear
            options={[
              { value: 'sale', label: 'Продажа' },
              { value: 'return', label: 'Возврат' },
            ]}
          />
        </Form.Item>

        <Form.Item name="cashierId" label="Кассир">
          <Select
            style={{ width: '200px' }}
            placeholder="Все кассиры"
            allowClear
            showSearch
            optionFilterProp="label"
            filterOption={filterOption}
            options={cashiers.map((cashier) => ({
              value: cashier.id,
              label: cashier.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="clientId" label="Клиент">
          <Select
            style={{ width: '250px' }}
            placeholder="Поиск клиента"
            allowClear
            showSearch
            optionFilterProp="label"
            filterOption={filterOption}
            options={clients.map((client) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName}`.trim(),
            }))}
          />
        </Form.Item>

        <Form.Item name="vehicleId" label="Автомобиль">
          <Select
            style={{ width: '300px' }}
            placeholder="Поиск автомобиля"
            allowClear
            showSearch
            optionFilterProp="label"
            filterOption={filterOption}
            options={vehicles.map((vehicle) => ({
              value: vehicle.id,
              label: vehicle.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="paymentMethod" label="Метод оплаты">
          <Select
            style={{ width: '200px' }}
            placeholder="Все методы"
            allowClear
            loading={loading}
            options={paymentMethods.map((method) => ({
              value: method.id,
              label: method.name || method.systemType || 'Неизвестный метод',
            }))}
          />
        </Form.Item>

        <Form.Item name="search" label="Поиск">
          <Input
            style={{ width: '200px' }}
            placeholder="Поиск по номеру чека"
            prefix={<SearchOutlined />}
          />
        </Form.Item>
      </Space>
    </Form>
  );
};
