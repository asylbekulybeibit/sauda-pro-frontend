import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Space,
  Alert,
  Table,
  Button,
  Modal,
  Typography,
  Tag,
} from 'antd';
import { PrinterOutlined, EyeOutlined } from '@ant-design/icons';
import { SalesHistoryFilters as FiltersComponent } from '@/components/manager/sales/SalesHistoryFilters';
import * as salesApi from '@/services/salesApi';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import {
  SalesHistoryResponse,
  SalesReceiptDetails,
  SalesHistoryFilters as Filters,
} from '@/types/sales';
import { useRoleStore } from '@/store/roleStore';

const { Title } = Typography;

export const SalesHistoryPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<SalesHistoryResponse[]>([]);
  const [selectedReceipt, setSelectedReceipt] =
    useState<SalesHistoryResponse | null>(null);
  const [receiptDetails, setReceiptDetails] =
    useState<SalesReceiptDetails | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [cashiers, setCashiers] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [clients, setClients] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [vehicles, setVehicles] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [filters, setFilters] = useState<Filters>({});

  // Получаем ID склада из текущей роли
  const warehouseId =
    currentRole?.type === 'shop' ? currentRole.warehouse?.id || shopId : shopId;

  // Эффект для загрузки данных при монтировании компонента
  useEffect(() => {
    if (warehouseId) {
      loadInitialData();
    }
  }, [warehouseId]);

  const loadInitialData = async () => {
    if (!warehouseId) {
      setError('ID склада не найден');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading initial data for warehouse:', warehouseId);

      // Загружаем справочные данные и чеки параллельно
      const [cashiersData, clientsData, vehiclesData, receiptsData] =
        await Promise.all([
          salesApi.getCashiers(warehouseId),
          salesApi.getClients(warehouseId),
          salesApi.getVehicles(warehouseId),
          salesApi.getSalesHistory(warehouseId, filters),
        ]);

      console.log('Reference data loaded:', {
        cashiers: cashiersData.length,
        clients: clientsData.length,
        vehicles: vehiclesData.length,
      });

      setCashiers(cashiersData);
      setClients(clientsData);
      setVehicles(vehiclesData);
      setReceipts(receiptsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения фильтров
  const handleFiltersChange = async (newFilters: Filters) => {
    console.log('Applying new filters:', newFilters);
    setFilters(newFilters);

    if (!warehouseId) {
      return;
    }

    setLoading(true);
    try {
      const data = await salesApi.getSalesHistory(warehouseId, newFilters);
      setReceipts(data);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError('Ошибка при применении фильтров');
    } finally {
      setLoading(false);
    }
  };

  // Обработчики для просмотра деталей и печати
  const handleViewDetails = async (receipt: SalesHistoryResponse) => {
    setSelectedReceipt(receipt);
    if (!warehouseId) {
      setError('ID склада не найден');
      return;
    }
    try {
      const details = await salesApi.getSalesReceiptDetails(
        warehouseId,
        receipt.id
      );
      setReceiptDetails(details);
      setDetailsVisible(true);
    } catch (err) {
      console.error('Error loading receipt details:', err);
    }
  };

  const handlePrintReceipt = async (receipt: SalesHistoryResponse) => {
    if (!warehouseId) {
      setError('ID склада не найден');
      return;
    }
    try {
      await salesApi.printReceipt(warehouseId, receipt.id);
    } catch (err) {
      console.error('Error printing receipt:', err);
    }
  };

  // Колонки таблицы
  const columns = [
    {
      title: 'Дата и время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Номер чека',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Тип',
      dataIndex: 'totalAmount',
      key: 'type',
      render: (amount: number) => (
        <Tag color={amount < 0 ? 'orange' : 'green'}>
          {amount < 0 ? 'Возврат' : 'Продажа'}
        </Tag>
      ),
    },
    {
      title: 'Кассир',
      dataIndex: 'cashier',
      key: 'cashier',
      render: (cashier?: { name: string }) => cashier?.name || 'Н/Д',
    },
    {
      title: 'Клиент',
      dataIndex: 'client',
      key: 'client',
      render: (client?: { firstName: string; lastName: string }) =>
        client ? `${client.firstName} ${client.lastName}`.trim() : 'Н/Д',
    },
    {
      title: 'Метод оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (paymentMethod: { name: string }) => paymentMethod?.name || 'Н/Д',
    },
    {
      title: 'Автомобиль',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle: { name: string } | undefined) => vehicle?.name || 'Н/Д',
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: SalesHistoryResponse) => (
        <Button.Group>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Детали
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handlePrintReceipt(record)}
          >
            Печать
          </Button>
        </Button.Group>
      ),
    },
  ];

  return (
    <Card title="История продаж">
      <Space direction="vertical" style={{ width: '100%' }}>
        {error && <Alert message={error} type="error" />}

        <FiltersComponent
          onFiltersChange={handleFiltersChange}
          cashiers={cashiers}
          clients={clients}
          vehicles={vehicles}
        />

        <Table
          columns={columns}
          dataSource={receipts}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
          }}
        />

        <Modal
          title={`Детали чека №${selectedReceipt?.number}`}
          open={detailsVisible}
          onCancel={() => setDetailsVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailsVisible(false)}>
              Закрыть
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() =>
                selectedReceipt && handlePrintReceipt(selectedReceipt)
              }
            >
              Печать
            </Button>,
          ]}
          width={800}
        >
          {receiptDetails && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <p>
                  <strong>Дата и время:</strong>{' '}
                  {formatDateTime(receiptDetails.createdAt)}
                </p>
                <p>
                  <strong>Кассир:</strong> {receiptDetails.cashier.name}
                </p>
                {receiptDetails.client && (
                  <p>
                    <strong>Клиент:</strong>{' '}
                    {`${receiptDetails.client.firstName} ${receiptDetails.client.lastName}`.trim()}
                  </p>
                )}
                {receiptDetails.vehicle && (
                  <p>
                    <strong>Транспорт:</strong> {receiptDetails.vehicle.name}
                  </p>
                )}
              </div>

              <Table
                dataSource={receiptDetails.items}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Наименование',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Цена',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => formatCurrency(price),
                  },
                  {
                    title: 'Кол-во',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Сумма',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (amount: number) => formatCurrency(amount),
                  },
                ]}
                summary={(data) => {
                  const total = data.reduce(
                    (sum, item) => sum + item.amount,
                    0
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>Итого:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatCurrency(total)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </div>
          )}
        </Modal>
      </Space>
    </Card>
  );
};

export default SalesHistoryPage;
