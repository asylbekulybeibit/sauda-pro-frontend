import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface WarehouseProduct {
  id: string;
  quantity: number;
  minQuantity: number;
  isActive: boolean;
  barcode: {
    productName: string;
    isService: boolean;
  };
}

export function useMinQuantityWarning(shopId?: string, warehouseId?: string) {
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchWarningProducts = async () => {
    if (!shopId || !warehouseId) return;

    setLoading(true);
    try {
      const response = await api.get<WarehouseProduct[]>(
        `/manager/warehouse-products/shop/${shopId}`,
        {
          params: {
            warehouseId,
            isService: false,
          },
        }
      );

      console.log('[useMinQuantityWarning] Полученные товары:', response.data);

      // Подсчитываем количество товаров с количеством ниже минимального
      const lowStockProducts = response.data.filter(
        (product) =>
          product.isActive && // Проверяем только активные товары
          !product.barcode.isService && // Исключаем услуги
          Number(product.minQuantity) > 0 && // Проверяем, что установлен минимальный порог
          Number(product.quantity) <= Number(product.minQuantity) // Проверяем, что количество меньше или равно минимальному
      );

      console.log(
        '[useMinQuantityWarning] Товары с низким количеством:',
        lowStockProducts.map((p) => ({
          productName: p.barcode.productName,
          quantity: Number(p.quantity),
          minQuantity: Number(p.minQuantity),
          isActive: p.isActive,
          isService: p.barcode.isService,
        }))
      );

      setWarningCount(lowStockProducts.length);
      console.log(
        `[useMinQuantityWarning] Найдено ${lowStockProducts.length} товаров с низким количеством`
      );
    } catch (err) {
      console.error(
        '[useMinQuantityWarning] Ошибка при проверке минимального количества:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarningProducts();

    // Устанавливаем интервал для периодической проверки
    const interval = setInterval(fetchWarningProducts, 30000); // Проверяем каждые 30 секунд

    return () => clearInterval(interval);
  }, [shopId, warehouseId]);

  return { warningCount, loading, refetch: fetchWarningProducts };
}
