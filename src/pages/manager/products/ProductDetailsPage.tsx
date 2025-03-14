import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Descriptions, Spin, Tag } from 'antd';
import { getProducts } from '@/services/managerApi';
import { formatPrice } from '@/utils/format';

function ProductDetailsPage() {
  const { shopId, productId } = useParams<{
    shopId: string;
    productId: string;
  }>();

  console.log('Params:', { shopId, productId });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  console.log('Products:', products);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!products) {
    return <div>Ошибка загрузки данных</div>;
  }

  const product = products.find((p) => p.id === productId);
  console.log('Found product:', product);

  if (!product) {
    return <div className="p-4">Товар не найден</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{product.name}</h1>

      <Card>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Артикул">
            {product.sku || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Штрих-код">
            {product.barcode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Цена продажи">
            {formatPrice(product.sellingPrice)}
          </Descriptions.Item>
          <Descriptions.Item label="Закупочная цена">
            {formatPrice(product.purchasePrice)}
          </Descriptions.Item>
          <Descriptions.Item label="Текущий остаток">
            <span
              className={
                product.quantity <= product.minQuantity ? 'text-red-500' : ''
              }
            >
              {product.quantity}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Минимальный остаток">
            {product.minQuantity}
          </Descriptions.Item>
          <Descriptions.Item label="Статус" span={2}>
            <Tag color={product.isActive ? 'green' : 'red'}>
              {product.isActive ? 'Активен' : 'Неактивен'}
            </Tag>
          </Descriptions.Item>
          {product.description && (
            <Descriptions.Item label="Описание" span={2}>
              {product.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
}

export default ProductDetailsPage;
