import { useState } from 'react';
import { LabelTemplate, LabelType, LabelSize } from '@/types/label';
import { LabelTemplateForm } from './LabelTemplateForm';
import { LabelGenerator } from './LabelGenerator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLabelTemplate } from '@/services/managerApi';
import { PencilIcon, TrashIcon, PrinterIcon } from '@heroicons/react/outline';
import { formatDate } from '@/utils/format';

interface LabelTemplateListProps {
  templates: LabelTemplate[];
}

export function LabelTemplateList({ templates }: LabelTemplateListProps) {
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(
    null
  );
  const [generatingTemplate, setGeneratingTemplate] =
    useState<LabelTemplate | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteLabelTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-templates'] });
    },
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      await deleteMutation.mutateAsync(id.toString());
    }
  };

  const getLabelTypeText = (type: LabelType) => {
    const types = {
      [LabelType.PRICE_TAG]: 'Ценник',
      [LabelType.BARCODE]: 'Штрих-код',
      [LabelType.INFO]: 'Информация',
      [LabelType.SHELF]: 'Полочный',
    };
    return types[type];
  };

  const getLabelSizeText = (size: LabelSize) => {
    const sizes = {
      [LabelSize.SMALL]: '58x40 мм',
      [LabelSize.MEDIUM]: '58x60 мм',
      [LabelSize.LARGE]: '58x80 мм',
      [LabelSize.CUSTOM]: 'Свой размер',
    };
    return sizes[size];
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Размер
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Создан
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {template.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getLabelTypeText(template.type)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getLabelSizeText(template.size)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(template.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      template.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {template.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setGeneratingTemplate(template)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <PrinterIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTemplate && (
        <LabelTemplateForm
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {generatingTemplate && (
        <LabelGenerator
          template={generatingTemplate}
          onClose={() => setGeneratingTemplate(null)}
        />
      )}
    </div>
  );
}
