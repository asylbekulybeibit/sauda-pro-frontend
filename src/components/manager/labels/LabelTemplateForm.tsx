import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LabelTemplate,
  LabelType,
  LabelSize,
  LabelElement,
} from '@/types/label';
import {
  createLabelTemplate,
  updateLabelTemplate,
} from '@/services/managerApi';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';

interface LabelTemplateFormProps {
  template?: LabelTemplate;
  onClose: () => void;
}

export function LabelTemplateForm({
  template,
  onClose,
}: LabelTemplateFormProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || LabelType.PRICE_TAG,
    size: template?.size || LabelSize.SMALL,
    width: template?.width || 58,
    height: template?.height || 40,
    elements: template?.elements || [],
    isActive: template?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: createLabelTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-templates'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LabelTemplate> }) =>
      updateLabelTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-templates'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      shopId: parseInt(shopId!),
    };

    if (template) {
      await updateMutation.mutateAsync({
        id: template.id.toString(),
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addElement = (type: LabelElement['type']) => {
    const newElement: LabelElement = {
      type,
      x: 0,
      y: 0,
      value: '',
      style: {},
    };
    setFormData((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
  };

  const updateElement = (index: number, updates: Partial<LabelElement>) => {
    setFormData((prev) => ({
      ...prev,
      elements: prev.elements.map((el, i) =>
        i === index ? { ...el, ...updates } : el
      ),
    }));
  };

  const removeElement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      elements: prev.elements.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Редактировать шаблон' : 'Создать шаблон'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Название
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Тип
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {Object.values(LabelType).map((type) => (
                    <option key={type} value={type}>
                      {type === LabelType.PRICE_TAG && 'Ценник'}
                      {type === LabelType.BARCODE && 'Штрих-код'}
                      {type === LabelType.INFO && 'Информация'}
                      {type === LabelType.SHELF && 'Полочный'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Размер
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {Object.values(LabelSize).map((size) => (
                    <option key={size} value={size}>
                      {size === LabelSize.SMALL && '58x40 мм'}
                      {size === LabelSize.MEDIUM && '58x60 мм'}
                      {size === LabelSize.LARGE && '58x80 мм'}
                      {size === LabelSize.CUSTOM && 'Свой размер'}
                    </option>
                  ))}
                </select>
              </div>

              {formData.size === LabelSize.CUSTOM && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ширина (мм)
                    </label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Высота (мм)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Элементы
              </label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => addElement('text')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Добавить текст
                </button>
                <button
                  type="button"
                  onClick={() => addElement('barcode')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Добавить штрих-код
                </button>
                <button
                  type="button"
                  onClick={() => addElement('qr')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Добавить QR-код
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {formData.elements.map((element, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={element.value}
                        onChange={(e) =>
                          updateElement(index, { value: e.target.value })
                        }
                        placeholder={
                          element.type === 'text'
                            ? 'Текст'
                            : element.type === 'barcode'
                            ? '{barcode}'
                            : '{url}'
                        }
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={element.x}
                        onChange={(e) =>
                          updateElement(index, { x: parseInt(e.target.value) })
                        }
                        placeholder="X"
                        className="w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <input
                        type="number"
                        value={element.y}
                        onChange={(e) =>
                          updateElement(index, { y: parseInt(e.target.value) })
                        }
                        placeholder="Y"
                        className="w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeElement(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">Активен</span>
              </label>
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {template ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
