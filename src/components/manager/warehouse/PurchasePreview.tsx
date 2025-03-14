import React from 'react';
import { Modal, Descriptions, Table } from 'antd';
import { formatDate, formatPrice } from '@/utils/format';

interface PurchasePreviewProps {
  data: {
    id: number;
    date: string;
    invoiceNumber: string;
    supplier: {
      name: string;
      address?: string;
      phone?: string;
    };
    items: {
      productId: number;
      product: {
        name: string;
        sku: string;
      };
      quantity: number;
      price: number;
      total: number;
    }[];
    totalAmount: number;
    comment?: string;
  };
  visible: boolean;
  onClose: () => void;
  onPrint?: () => void;
}

export const PurchasePreview: React.FC<PurchasePreviewProps> = ({
  data,
  visible,
  onClose,
  onPrint,
}) => {
  const columns = [
    {
      title: '№',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 50,
    },
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
      title: 'Кол-во',
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

  return (
    <Modal
      title="Предпросмотр приходной накладной"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <button
          key="print"
          onClick={onPrint}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Печать
        </button>,
      ]}
    >
      <div className="space-y-6 print:space-y-4" id="printable-area">
        <h1 className="text-2xl font-bold text-center">
          Приходная накладная №{data.invoiceNumber}
        </h1>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="Дата">
            {formatDate(data.date)}
          </Descriptions.Item>
          <Descriptions.Item label="Номер накладной">
            {data.invoiceNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Поставщик">
            {data.supplier.name}
          </Descriptions.Item>
          <Descriptions.Item label="Телефон">
            {data.supplier.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Адрес" span={2}>
            {data.supplier.address || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Table
          columns={columns}
          dataSource={data.items}
          pagination={false}
          rowKey="productId"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <strong>Итого:</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <strong>{formatPrice(data.totalAmount)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />

        {data.comment && (
          <div>
            <strong>Комментарий:</strong>
            <p>{data.comment}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
