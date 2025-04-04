import React from 'react';
import { DatePicker, Select, Input, Space, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { SalesHistoryFilters as Filters } from '../../../types/sales';

const { RangePicker } = DatePicker;

interface SalesHistoryFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  cashiers: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; number: string }>;
}

export const SalesHistoryFilters: React.FC<SalesHistoryFiltersProps> = ({
  onFiltersChange,
  cashiers,
  clients,
  vehicles,
}) => {
  const [form] = Form.useForm();

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
    });
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
            optionFilterProp="children"
            options={cashiers.map((cashier) => ({
              value: cashier.id,
              label: cashier.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="clientId" label="Клиент">
          <Select
            style={{ width: '200px' }}
            placeholder="Все клиенты"
            allowClear
            showSearch
            optionFilterProp="children"
            options={clients.map((client) => ({
              value: client.id,
              label: client.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="vehicleId" label="Машина">
          <Select
            style={{ width: '200px' }}
            placeholder="Все машины"
            allowClear
            showSearch
            optionFilterProp="children"
            options={vehicles.map((vehicle) => ({
              value: vehicle.id,
              label: vehicle.number,
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
