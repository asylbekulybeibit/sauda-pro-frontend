import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LabelTemplate } from '@/types/label';
import { Product } from '@/types/product';
import { generateLabels } from '@/services/managerApi';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';

interface LabelGeneratorProps {
  template: LabelTemplate;
  products: Product[];
  onClose: () => void;
}

export function LabelGenerator({
  template,
  products,
  onClose,
}: LabelGeneratorProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [copies, setCopies] = useState<{ [key: string]: number }>({});

  const generateMutation = useMutation({
    mutationFn: generateLabels,
    onSuccess: (data) => {
      // Открываем PDF в новом окне
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Проверяем, что выбран хотя бы один товар
      if (selectedProducts.length === 0) {
        throw new Error('Выберите хотя бы один товар');
      }

      // Получаем shopId из URL или из контекста
      const shopId = window.location.pathname.split('/')[2];

      const data = {
        shopId,
        templateId: template.id.toString(),
        products: selectedProducts.map((productId) => ({
          productId,
          quantity: Math.max(1, copies[productId] || 1),
        })),
      };

      console.log('Sending data:', data);
      await generateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error generating labels:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при генерации этикеток'
      );
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCopiesChange = (productId: string, value: number) => {
    setCopies((prev) => ({
      ...prev,
      [productId]: Math.max(1, value),
    }));
  };

  const selectAll = () => {
    setSelectedProducts(products.map((p) => p.id.toString()));
  };

  const deselectAll = () => {
    setSelectedProducts([]);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Генерация этикеток
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Выберите товары
                </h3>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Выбрать все
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Снять выбор
                  </button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Выбор
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Название
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Штрих-код
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Количество копий
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(
                              product.id.toString()
                            )}
                            onChange={() =>
                              toggleProduct(product.id.toString())
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {product.barcode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={copies[product.id.toString()] || 1}
                            onChange={(e) =>
                              handleCopiesChange(
                                product.id.toString(),
                                parseInt(e.target.value)
                              )
                            }
                            className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={
                              !selectedProducts.includes(product.id.toString())
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={selectedProducts.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Сгенерировать
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
