import React from 'react';
import { Modal, Descriptions, Table, Tag, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { Purchase } from '@/types/purchase';
import { formatDate, formatPrice } from '@/utils/format';

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
    },
    {
      title: 'Артикул',
      dataIndex: ['product', 'sku'],
      key: 'sku',
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Сумма',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => formatPrice(total),
    },
  ];

  const handlePrint = () => {
    const printContent = document.getElementById('purchase-details-print');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <Modal
      title="Детали прихода"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          className="bg-blue-500"
        >
          Печать
        </Button>,
      ]}
    >
      <div id="purchase-details-print">
        <Descriptions title="Информация о приходе" bordered column={2}>
          <Descriptions.Item label="Номер накладной">
            {purchase.invoiceNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Дата">
            {formatDate(purchase.date)}
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
            {purchase.items.reduce((sum, item) => sum + item.quantity, 0)}
          </Descriptions.Item>
          {purchase.comment && (
            <Descriptions.Item label="Комментарий" span={2}>
              {purchase.comment}
            </Descriptions.Item>
          )}
        </Descriptions>

        <h3 className="text-lg font-semibold mt-6 mb-3">Товары</h3>
        <Table
          columns={columns}
          dataSource={purchase.items}
          rowKey="productId"
          pagination={false}
          summary={(pageData) => {
            const totalQuantity = pageData.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            const totalAmount = pageData.reduce(
              (sum, item) => sum + item.total,
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
    </Modal>
  );
}
