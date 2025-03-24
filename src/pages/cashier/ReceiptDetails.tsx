import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Descriptions,
  Space,
  Divider,
  Table,
  Tag,
  Typography,
  Spin,
  Empty,
  Row,
  Col,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  MailOutlined,
  CopyOutlined,
  UserOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Интерфейс для товара в чеке
interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

// Интерфейс для чека
interface Receipt {
  id: string;
  number: string;
  type: 'sale' | 'refund';
  date: string;
  status: 'completed' | 'canceled' | 'refunded';
  cashierName: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: ReceiptItem[];
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Страница деталей чека
 */
const ReceiptDetails: React.FC = () => {
  const { shopId, receiptId } = useParams<{
    shopId: string;
    receiptId: string;
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // Загрузка данных чека
  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setLoading(true);
        // Здесь будет вызов API для получения данных чека
        // Пока используем заглушку с таймаутом
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Тестовые данные чека
        const mockReceipt: Receipt = {
          id: receiptId || 'receipt-not-found',
          number: '00001-1',
          type: 'sale',
          date: '2023-07-15T09:15:30Z',
          status: 'completed',
          cashierName: 'Иванов Иван',
          paymentMethod: 'Наличные',
          subtotal: 1300.0,
          discount: 50.0,
          tax: 0,
          total: 1250.0,
          items: [
            {
              id: 'item-1',
              name: 'Масло моторное 5W30 Синтетическое',
              quantity: 1,
              unitPrice: 850.0,
              totalPrice: 850.0,
            },
            {
              id: 'item-2',
              name: 'Фильтр масляный',
              quantity: 1,
              unitPrice: 250.0,
              totalPrice: 250.0,
            },
            {
              id: 'item-3',
              name: 'Работа: Замена масла',
              quantity: 1,
              unitPrice: 200.0,
              totalPrice: 200.0,
              discount: 50.0,
            },
          ],
          customer: {
            name: 'Петров Петр',
            phone: '+7 (999) 123-45-67',
            email: 'petrov@example.com',
          },
        };

        setReceipt(mockReceipt);
      } catch (error) {
        message.error('Не удалось загрузить данные чека');
      } finally {
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceiptData();
    }
  }, [receiptId, shopId]);

  // Колонки таблицы товаров
  const itemColumns: ColumnsType<ReceiptItem> = [
    {
      title: '№',
      key: 'index',
      width: 60,
      render: (_, record, index) => index + 1,
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Цена',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right' as const,
      render: (price) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Скидка',
      dataIndex: 'discount',
      key: 'discount',
      width: 120,
      align: 'right' as const,
      render: (discount) => (discount ? `${discount.toFixed(2)} ₽` : '-'),
    },
    {
      title: 'Сумма',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      align: 'right' as const,
      render: (total) => `${total.toFixed(2)} ₽`,
    },
  ];

  // Функция для печати чека
  const printReceipt = () => {
    message.info('Печать чека');
  };

  // Функция для отправки чека по email
  const sendReceiptByEmail = () => {
    message.info('Отправка чека по email');
  };

  // Функция для копирования ссылки на чек
  const copyReceiptLink = () => {
    const link = `${window.location.origin}/receipt/${receiptId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        message.success('Ссылка скопирована в буфер обмена');
      })
      .catch(() => {
        message.error('Не удалось скопировать ссылку');
      });
  };

  // Получение статуса чека
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="green">Оплачен</Tag>;
      case 'canceled':
        return <Tag color="red">Отменен</Tag>;
      case 'refunded':
        return <Tag color="orange">Возвращен</Tag>;
      default:
        return <Tag>Неизвестно</Tag>;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            Назад
          </Button>
          <Title level={4} className="m-0">
            Детали чека № {receipt?.number || receiptId}
          </Title>
        </div>

        <Space>
          <Button icon={<PrinterOutlined />} onClick={printReceipt}>
            Печать
          </Button>
          <Button
            icon={<MailOutlined />}
            onClick={sendReceiptByEmail}
            disabled={!receipt?.customer?.email}
          >
            Email
          </Button>
          <Button icon={<CopyOutlined />} onClick={copyReceiptLink}>
            Копировать ссылку
          </Button>
        </Space>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : receipt ? (
        <>
          <Card className="mb-4 shadow-sm">
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Descriptions
                  title="Информация о чеке"
                  bordered
                  size="small"
                  column={{ xs: 1, sm: 2 }}
                >
                  <Descriptions.Item label="Номер чека">
                    {receipt.number}
                  </Descriptions.Item>
                  <Descriptions.Item label="Дата">
                    {dayjs(receipt.date).format('DD.MM.YYYY HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Тип">
                    {receipt.type === 'sale' ? 'Продажа' : 'Возврат'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Статус">
                    {getStatusTag(receipt.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Кассир">
                    {receipt.cashierName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Метод оплаты">
                    {receipt.paymentMethod}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              {receipt.customer && (
                <Col xs={24} md={8}>
                  <Card
                    title={
                      <div className="flex items-center">
                        <UserOutlined className="mr-2" />
                        <span>Информация о клиенте</span>
                      </div>
                    }
                    size="small"
                    className="bg-gray-50"
                  >
                    <p className="m-0 mb-2">
                      <Text strong>{receipt.customer.name}</Text>
                    </p>
                    {receipt.customer.phone && (
                      <p className="m-0 mb-2">
                        <Text>{receipt.customer.phone}</Text>
                      </p>
                    )}
                    {receipt.customer.email && (
                      <p className="m-0">
                        <Text>{receipt.customer.email}</Text>
                      </p>
                    )}
                  </Card>
                </Col>
              )}
            </Row>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Table
              columns={itemColumns}
              dataSource={receipt.items}
              rowKey="id"
              pagination={false}
              summary={(pageData) => {
                let totalItems = 0;
                let totalDiscount = 0;

                pageData.forEach(({ totalPrice, discount }) => {
                  totalItems += totalPrice;
                  totalDiscount += discount || 0;
                });

                return (
                  <>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <Text strong>Подытог:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{receipt.subtotal.toFixed(2)} ₽</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    {receipt.discount > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <Text type="secondary">Скидка:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text type="secondary">
                            - {receipt.discount.toFixed(2)} ₽
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {receipt.tax > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <Text type="secondary">НДС (20%):</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text type="secondary">
                            {receipt.tax.toFixed(2)} ₽
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <Text strong style={{ fontSize: '16px' }}>
                          Итого:
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ fontSize: '16px' }}>
                          {receipt.total.toFixed(2)} ₽
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                );
              }}
            />
          </Card>

          <Card className="shadow-sm">
            <div className="text-center text-gray-500">
              <div className="mb-2">
                <ShopOutlined style={{ fontSize: 24 }} />
              </div>
              <p className="mb-1">Спасибо за покупку!</p>
              <p className="mb-0">
                ООО "SaudaPro" | ИНН: 1234567890 |{' '}
                {dayjs(receipt.date).format('DD.MM.YYYY')}
              </p>
            </div>
          </Card>
        </>
      ) : (
        <Empty
          description="Чек не найден"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

export default ReceiptDetails;
