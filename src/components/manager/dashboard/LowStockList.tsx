import { Product } from '@/types/product';
import { ExclamationTriangleIcon as ExclamationIcon } from '@heroicons/react/24/outline';
import { Link, useParams } from 'react-router-dom';

interface LowStockListProps {
  products: Product[];
}

export function LowStockList({ products }: LowStockListProps) {
  const { shopId } = useParams<{ shopId: string }>();

  // Фильтруем товары с низким остатком (меньше минимального количества)
  const lowStockProducts = products
    .filter((product) => product.quantity <= product.minQuantity)
    .sort((a, b) => a.quantity - b.quantity);

  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Товары с низким остатком
        </h3>
        <div className="text-gray-500 text-center py-4">
          Нет товаров с низким остатком
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Товары с низким остатком
        </h3>
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200">
            {lowStockProducts.map((product) => (
              <li key={product.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <ExclamationIcon
                      className="h-6 w-6 text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Остаток: {product.quantity} (мин: {product.minQuantity})
                    </p>
                  </div>
                  <div>
                    <Link
                      to={`/manager/${shopId}/warehouse/products/${product.id}`}
                      className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Просмотр
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
