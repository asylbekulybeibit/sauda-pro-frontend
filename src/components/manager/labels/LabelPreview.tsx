import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LabelTemplate } from '@/types/label';
import { Product } from '@/types/product';
import { previewLabel } from '@/services/managerApi';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';

interface LabelPreviewProps {
  template: LabelTemplate;
  product?: Product;
  onClose: () => void;
}

export function LabelPreview({
  template,
  product,
  onClose,
}: LabelPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewMutation = useMutation({
    mutationFn: (params: {
      templateId: number;
      productId: number | undefined;
    }) =>
      previewLabel(
        params.templateId.toString(),
        params.productId?.toString() || ''
      ),
    onSuccess: (data) => {
      if (iframeRef.current) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        iframeRef.current.src = url;
        return () => URL.revokeObjectURL(url);
      }
    },
  });

  useEffect(() => {
    if (template && product?.id) {
      previewMutation.mutate({
        templateId: template.id,
        productId: product.id,
      });
    }
  }, [template, product]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Предварительный просмотр
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {previewMutation.isPending ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : previewMutation.isError ? (
              <div className="h-full flex items-center justify-center text-red-600">
                Ошибка при загрузке предварительного просмотра
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Label Preview"
              />
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
