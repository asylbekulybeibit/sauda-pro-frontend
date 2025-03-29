import React from 'react';
import { Popover, List, Typography, Badge } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useMinQuantityWarning } from '@/hooks';
import { useParams } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { api } from '@/services/api';

const { Text } = Typography;

export const LowStockPopover: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const warehouseId =
    currentRole?.type === 'shop' ? currentRole.warehouse?.id : undefined;

  const { warningCount, loading } = useMinQuantityWarning(shopId, warehouseId);

  const [products, setProducts] = React.useState<
    Array<{
      productName: string;
      quantity: number;
      minQuantity: number;
    }>
  >([]);

  // Загружаем данные о товарах при открытии поповера
  const handleOpenChange = async (open: boolean) => {
    if (open && shopId && warehouseId) {
      try {
        const response = await api.get(
          `/manager/warehouse-products/shop/${shopId}`,
          {
            params: {
              warehouseId,
              isService: false,
            },
          }
        );

        const lowStockProducts = response.data
          .filter(
            (product: any) =>
              product.isActive &&
              !product.barcode.isService &&
              Number(product.minQuantity) > 0 &&
              Number(product.quantity) <= Number(product.minQuantity)
          )
          .map((product: any) => ({
            productName: product.barcode.productName,
            quantity: Number(product.quantity),
            minQuantity: Number(product.minQuantity),
          }));

        setProducts(lowStockProducts);
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
      }
    }
  };

  const content = (
    <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
      <List
        size="small"
        dataSource={products}
        loading={loading}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <Text strong>{item.productName}</Text>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Text type="secondary">Осталось: {item.quantity} шт.</Text>
                <Text type={item.quantity === 0 ? 'danger' : 'warning'}>
                  Минимум: {item.minQuantity} шт.
                </Text>
              </div>
            </div>
          </List.Item>
        )}
        locale={{
          emptyText: 'Нет товаров с низким количеством',
        }}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      title="Товары с низким количеством"
      trigger="click"
      onOpenChange={handleOpenChange}
      placement="bottomRight"
    >
      <Badge count={warningCount} style={{ backgroundColor: '#ff4d4f' }}>
        <BellOutlined
          style={{ fontSize: '20px' }}
          className="text-gray-600 hover:text-gray-900"
        />
      </Badge>
    </Popover>
  );
};
