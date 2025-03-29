import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface Barcode {
  code: string;
  productName: string;
}

interface WarehouseProduct {
  id: string;
  warehouseId: string;
  barcode: Barcode;
  quantity: number;
}

export function useWarehouseProducts(
  shopId: string | undefined,
  warehouseId?: string
) {
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
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
        setProducts(response.data);
      } catch (err) {
        setError('Ошибка при загрузке товаров');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [shopId, warehouseId]);

  return { products, loading, error };
}
