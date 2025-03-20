import React from 'react';
import { Descriptions, Table, Tag } from 'antd';
import { Purchase } from '@/types/purchase';
import { formatPrice } from '@/utils/format';
import { formatDate, formatDateTime } from '@/utils/date';

interface PurchaseDetailsProps {
  purchase: Purchase | null;
  visible: boolean;
  onClose: () => void;
}

export default function PurchaseDetails({
  purchase,
  visible,
  onClose,
}: PurchaseDetailsProps) {
  if (!purchase) return null;

  const getStatusName = (status: string) => {
    const statusNames = {
      draft: 'Черновик',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      draft: 'gold',
      completed: 'green',
      cancelled: 'red',
    };
    return statusColors[status as keyof typeof statusColors] || 'default';
  };

  const columns = [
    {
      title: 'Наименование',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: '20%',
    },
    {
      title: 'Артикул',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: '10%',
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '8%',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      width: '10%',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Сумма',
      dataIndex: 'total',
      key: 'total',
      width: '10%',
      render: (total: number) => formatPrice(total),
    },
    {
      title: 'Серийный номер',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: '12%',
      render: (serialNumber: string) => serialNumber || '-',
    },
    {
      title: 'Срок годности',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: '12%',
      render: (expiryDate: string) =>
        expiryDate ? formatDate(expiryDate) : '-',
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
      width: '18%',
      render: (comment: string) => comment || '-',
    },
  ];

  return (
    <div id="purchase-details-print">
      <Descriptions title="Информация о приходе" bordered column={2}>
        <Descriptions.Item label="Номер накладной">
          {purchase.invoiceNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Дата создания">
          {formatDateTime(purchase.date)}
        </Descriptions.Item>
        <Descriptions.Item label="Поставщик">
          {purchase.supplier.name}
        </Descriptions.Item>
        <Descriptions.Item label="Статус">
          <Tag color={getStatusColor(purchase.status)}>
            {getStatusName(purchase.status)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Общая сумма">
          {formatPrice(purchase.totalAmount)}
        </Descriptions.Item>
        <Descriptions.Item label="Количество товаров">
          {typeof purchase.totalItems === 'number'
            ? purchase.totalItems
            : Array.isArray(purchase.items)
            ? purchase.items.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0
              )
            : 0}
        </Descriptions.Item>
        <Descriptions.Item label="Принял">
          {purchase.createdBy?.name || purchase.createdById || 'Неизвестно'}
        </Descriptions.Item>

        {purchase.comment && (
          <Descriptions.Item label="Комментарий" span={3}>
            {purchase.comment}
          </Descriptions.Item>
        )}
      </Descriptions>

      <h3 className="text-lg font-semibold mt-6 mb-3">Товары</h3>
      <Table
        columns={columns}
        dataSource={Array.isArray(purchase.items) ? purchase.items : []}
        rowKey="productId"
        pagination={false}
        size="small"
        summary={(pageData) => {
          const totalQuantity = pageData.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0
          );
          const totalAmount = pageData.reduce(
            (sum, item) => sum + (item.total || 0),
            0
          );

          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <strong>Итого</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <strong>{totalQuantity}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}></Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <strong>{formatPrice(totalAmount)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={6}></Table.Summary.Cell>
              <Table.Summary.Cell index={7}></Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />

      {purchase.supplier.address && (
        <div className="mt-4">
          <strong>Адрес поставщика:</strong> {purchase.supplier.address}
        </div>
      )}
      {purchase.supplier.phone && (
        <div>
          <strong>Телефон поставщика:</strong> {purchase.supplier.phone}
        </div>
      )}
    </div>
  );
}
