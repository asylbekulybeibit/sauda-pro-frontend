import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { Popover, List, Typography, Badge } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useMinQuantityWarning } from '@/hooks';
import { useParams } from 'react-router-dom';
import { useRoleStore } from '@/store/roleStore';
import { api } from '@/services/api';

const { Text } = Typography;

export interface LowStockPopoverRef {
  refresh: () => Promise<void>;
}

export const LowStockPopover = forwardRef<LowStockPopoverRef>((_, ref) => {
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
      isEnabled: boolean;
    }>
  >([]);

  // Загружаем данные о товарах при монтировании компонента и при изменении зависимостей
  const loadLowStockProducts = async () => {
    if (!shopId || !warehouseId) return;

    try {
      // Получаем правила уведомлений
      const rulesResponse = await api.get(
        `/shops/${shopId}/notifications/inventory`,
        {
          params: { warehouseId },
        }
      );
      const notificationRules = rulesResponse.data;

      // Получаем товары
      const productsResponse = await api.get(
        `/manager/warehouse-products/shop/${shopId}`,
        {
          params: {
            warehouseId,
            isService: false,
          },
        }
      );

      // Фильтруем и объединяем данные
      const lowStockProducts = productsResponse.data
        .filter((product: any) => {
          const rule = notificationRules.find(
            (r: any) => r.warehouseProductId === product.id
          );
          return (
            product.isActive &&
            !product.barcode.isService &&
            rule?.isEnabled && // Проверяем, что правило активно
            Number(product.minQuantity) > 0 &&
            Number(product.quantity) <= Number(product.minQuantity)
          );
        })
        .map((product: any) => ({
          productName: product.barcode.productName,
          quantity: Number(product.quantity),
          minQuantity: Number(product.minQuantity),
          isEnabled: true,
        }));

      setProducts(lowStockProducts);
    } catch (error) {
      console.error('Ошибка при загрузке товаров:', error);
    }
  };

  // Экспортируем функцию обновления через ref
  useImperativeHandle(ref, () => ({
    refresh: loadLowStockProducts,
  }));

  useEffect(() => {
    loadLowStockProducts();
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(loadLowStockProducts, 30000);
    return () => clearInterval(interval);
  }, [shopId, warehouseId]);

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
      placement="bottomRight"
    >
      <Badge count={products.length} style={{ backgroundColor: '#ff4d4f' }}>
        <BellOutlined
          style={{ fontSize: '20px', cursor: 'pointer' }}
          className="text-gray-600 hover:text-gray-900"
        />
      </Badge>
    </Popover>
  );
});
