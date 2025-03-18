import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  LabelTemplate,
  LabelType,
  LabelSize,
  LabelElement,
} from '@/types/label';
import {
  createLabelTemplate,
  updateLabelTemplate,
  getDefaultLabelTemplates,
} from '@/services/managerApi';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';
import { LabelTypeSelector } from './LabelTypeSelector';
import {
  TagIcon,
  QrCodeIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

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
    width: template?.template?.width || 58,
    height: template?.template?.height || 40,
    elements: template?.template?.elements || [],
    isActive: template?.isActive ?? true,
  });

  // Запрос предустановленных шаблонов
  const { data: defaultTemplates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['default-label-templates'],
    queryFn: getDefaultLabelTemplates,
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
    try {
      // Проверяем, что все поля заполнены корректно
      if (!formData.name.trim()) {
        throw new Error('Название шаблона не может быть пустым');
      }

      // Создаем структуру данных для отправки на сервер
      const data = {
        name: formData.name,
        type: formData.type,
        size: formData.size,
        template: {
          width: formData.width,
          height: formData.height,
          elements: formData.elements.map((element) => ({
            type: element.type,
            x: Number(element.x) || 0,
            y: Number(element.y) || 0,
            value: element.value || '',
            style: element.style || {},
          })),
        },
        isActive: formData.isActive,
        shopId: shopId!,
      };

      console.log('Отправляемые данные:', data);

      if (template) {
        await updateMutation.mutateAsync({
          id: template.id.toString(),
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error submitting template:', error);
      // Показываем ошибку пользователю
      alert(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при сохранении шаблона'
      );
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

  // Обработчик для выбора типа этикетки из селектора
  const handleTypeChange = (type: LabelType) => {
    setFormData((prev) => ({
      ...prev,
      type,
    }));
  };

  // Обработчик для выбора предустановленного шаблона
  const selectDefaultTemplate = (templateName: string) => {
    if (!defaultTemplates) return;

    const selectedTemplate = defaultTemplates.find(
      (t) => t.name === templateName
    );
    if (!selectedTemplate) return;

    setFormData({
      ...formData,
      name: `${selectedTemplate.name} (копия)`,
      type: selectedTemplate.type,
      size: selectedTemplate.size,
      width: selectedTemplate.template.width,
      height: selectedTemplate.template.height,
      elements: selectedTemplate.template.elements,
    });
  };

  // Функция для расчета позиций элементов
  const calculateElementPosition = (
    type: LabelElement['type']
  ): { x: number; y: number } => {
    const margin = 2; // отступ от краев и между элементами
    const elements = formData.elements;

    // Определяем размеры для разных типов элементов
    const getElementHeight = (type: LabelElement['type']) => {
      switch (type) {
        case 'text':
          return 10;
        case 'barcode':
          return 15;
        case 'qr':
          return 20;
        default:
          return 10;
      }
    };

    if (elements.length === 0) {
      // Первый элемент всегда в левом верхнем углу с отступом
      return { x: margin, y: margin };
    }

    // Находим последний элемент
    const lastElement = elements[elements.length - 1];
    const lastElementHeight = getElementHeight(lastElement.type);

    // Определяем доступное пространство
    const maxWidth = formData.width - margin * 2;
    const maxHeight = formData.height - margin * 2;

    // Рассчитываем новую позицию
    let newY = lastElement.y + lastElementHeight + margin;
    let newX = margin;

    // Если выходим за пределы высоты, пробуем разместить справа
    if (newY + getElementHeight(type) > maxHeight) {
      newY = margin;
      // Находим самый правый элемент
      const rightmostElement = elements.reduce((max, el) => {
        const elementWidth =
          el.type === 'qr' ? 20 : el.type === 'barcode' ? 54 : 25;
        return Math.max(max, el.x + elementWidth);
      }, 0);
      newX = rightmostElement + margin;
    }

    // Если и справа не помещается, начинаем сначала с предупреждением
    if (newX + (type === 'barcode' ? 54 : type === 'qr' ? 20 : 25) > maxWidth) {
      alert(
        'Внимание: этикетка может быть переполнена. Рекомендуется использовать больший размер.'
      );
      return { x: margin, y: margin };
    }

    return { x: newX, y: newY };
  };

  const addElement = (type: LabelElement['type']) => {
    const { x, y } = calculateElementPosition(type);

    // Определяем стиль в зависимости от типа элемента
    const style =
      type === 'text'
        ? { fontSize: 12, bold: formData.elements.length === 0 } // первый текстовый элемент жирный
        : type === 'barcode'
        ? { width: 54, height: 15 }
        : { width: 20, height: 20 }; // для QR-кода

    const newElement: LabelElement = {
      type,
      x,
      y,
      value: '',
      style,
    };

    setFormData((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
  };

  // Обновляем обработчик изменения размера этикетки
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value as LabelSize;
    let newWidth = formData.width;
    let newHeight = formData.height;

    // Устанавливаем стандартные размеры при выборе предустановленного размера
    switch (newSize) {
      case LabelSize.SMALL:
        newWidth = 58;
        newHeight = 40;
        break;
      case LabelSize.MEDIUM:
        newWidth = 58;
        newHeight = 60;
        break;
      case LabelSize.LARGE:
        newWidth = 58;
        newHeight = 80;
        break;
    }

    // Пересчитываем позиции всех элементов
    let updatedElements = [];
    let currentY = 2;
    let currentX = 2;
    const margin = 2;

    for (const element of formData.elements) {
      const elementHeight =
        element.type === 'text' ? 10 : element.type === 'barcode' ? 15 : 20;
      const elementWidth =
        element.type === 'barcode' ? 54 : element.type === 'qr' ? 20 : 25;

      // Если элемент не помещается по высоте, переносим его на следующую "колонку"
      if (currentY + elementHeight > newHeight - margin) {
        currentY = margin;
        currentX += elementWidth + margin;
      }

      // Если элемент не помещается по ширине, начинаем сначала
      if (currentX + elementWidth > newWidth - margin) {
        currentX = margin;
        currentY = margin;
      }

      updatedElements.push({
        ...element,
        x: currentX,
        y: currentY,
      });

      currentY += elementHeight + margin;
    }

    setFormData((prev) => ({
      ...prev,
      size: newSize,
      width: newWidth,
      height: newHeight,
      elements: updatedElements,
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
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col"
        style={{ height: 'calc(100vh - 80px)' }}
      >
        {/* Заголовок модального окна */}
        <div className="p-4 border-b flex justify-between items-center shrink-0">
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

        {/* Основное содержимое без скролла */}
        <div className="flex-1 p-4 flex flex-col overflow-hidden">
          {!template && defaultTemplates && defaultTemplates.length > 0 && (
            <div className="mb-4 shrink-0">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Использовать готовый шаблон:
              </h3>
              <div className="flex flex-wrap gap-2">
                {defaultTemplates.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => selectDefaultTemplate(tpl.name)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Название
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Например: Стандартный ценник для продуктов"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Размер
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleSizeChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {Object.values(LabelSize).map((size) => (
                    <option key={size} value={size}>
                      {size === LabelSize.SMALL && '58x40 мм (стандартный)'}
                      {size === LabelSize.MEDIUM && '58x60 мм (средний)'}
                      {size === LabelSize.LARGE && '58x80 мм (большой)'}
                      {size === LabelSize.CUSTOM && 'Свой размер'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                        placeholder="58"
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
                        placeholder="40"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
              {/* Типы этикеток */}
              <div className="w-1/3 h-full overflow-hidden">
                <div className="border rounded-lg p-3 h-full overflow-hidden flex flex-col">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 shrink-0">
                    Выберите тип этикетки:
                  </h3>
                  <div className="flex-1 overflow-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          type: LabelType.PRICE_TAG,
                          name: 'Ценник',
                          description: 'С названием товара и ценой',
                          icon: <TagIcon className="h-5 w-5" />,
                        },
                        {
                          type: LabelType.BARCODE,
                          name: 'Штрих-код',
                          description: 'Для сканирования',
                          icon: <QrCodeIcon className="h-5 w-5" />,
                        },
                        {
                          type: LabelType.INFO,
                          name: 'Информация',
                          description: 'С подробным описанием',
                          icon: <InformationCircleIcon className="h-5 w-5" />,
                        },
                        {
                          type: LabelType.SHELF,
                          name: 'Полочный',
                          description: 'Для размещения на полке',
                          icon: <ShoppingBagIcon className="h-5 w-5" />,
                        },
                      ].map((labelType) => (
                        <div
                          key={labelType.type}
                          className={`border rounded-lg p-2 cursor-pointer transition-colors flex items-center ${
                            formData.type === labelType.type
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                          }`}
                          onClick={() => handleTypeChange(labelType.type)}
                        >
                          <div
                            className={`${
                              formData.type === labelType.type
                                ? 'text-indigo-600'
                                : 'text-gray-500'
                            } mr-2`}
                          >
                            {labelType.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {labelType.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {labelType.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Элементы этикетки */}
              <div className="w-2/3 flex flex-col min-h-0 overflow-hidden">
                {/* Панель инструментов */}
                <div className="border rounded-lg p-3 mb-2 shrink-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">
                      Элементы этикетки
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => addElement('text')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        + Текст
                      </button>
                      <button
                        type="button"
                        onClick={() => addElement('barcode')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        + Штрих-код
                      </button>
                      <button
                        type="button"
                        onClick={() => addElement('qr')}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        + QR-код
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    <p>
                      Координаты (в миллиметрах): координата X - горизонтальное
                      положение (слева направо), координата Y - вертикальное
                      положение (сверху вниз). Левый верхний угол имеет
                      координаты X=0, Y=0.
                    </p>
                  </div>
                </div>

                {/* Список элементов со скроллом */}
                <div className="border rounded-lg p-3 overflow-auto flex-1">
                  <div className="space-y-2">
                    {formData.elements.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Добавьте элементы для вашей этикетки
                      </div>
                    ) : (
                      <>
                        {formData.elements.map((element, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-2 border rounded-lg"
                          >
                            <div className="flex-1">
                              <select
                                value={element.value}
                                onChange={(e) =>
                                  updateElement(index, {
                                    value: e.target.value,
                                  })
                                }
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Выберите переменную</option>
                                {element.type === 'text' && (
                                  <>
                                    <option value="{{name}}">
                                      Название товара
                                    </option>
                                    <option value="{{category}}">
                                      Категория
                                    </option>
                                    <option value="Категория: {{category}}">
                                      Категория с подписью
                                    </option>
                                    <option value="{{price}} ₽">Цена</option>
                                    <option value="Цена: {{price}} ₽">
                                      Цена с подписью
                                    </option>
                                    <option value="{{description}}">
                                      Описание
                                    </option>
                                    <option value="Описание: {{description}}">
                                      Описание с подписью
                                    </option>
                                  </>
                                )}
                                {element.type === 'barcode' && (
                                  <option value="{{barcodes[0]}}">
                                    Штрих-код товара
                                  </option>
                                )}
                                {element.type === 'qr' && (
                                  <>
                                    <option value="https://shop.example.com/product/{{barcodes[0]}}">
                                      Ссылка на товар
                                    </option>
                                    <option value="https://shop.example.com/info/{{barcodes[0]}}">
                                      Ссылка на информацию
                                    </option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div className="flex space-x-1">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">
                                  Х
                                </label>
                                <input
                                  type="number"
                                  value={element.x}
                                  onChange={(e) =>
                                    updateElement(index, {
                                      x: parseInt(e.target.value),
                                    })
                                  }
                                  placeholder="2"
                                  className="w-14 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">
                                  Y
                                </label>
                                <input
                                  type="number"
                                  value={element.y}
                                  onChange={(e) =>
                                    updateElement(index, {
                                      y: parseInt(e.target.value),
                                    })
                                  }
                                  placeholder="2"
                                  className="w-14 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeElement(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Нижняя панель с кнопками */}
        <div className="p-4 border-t shrink-0 flex justify-between items-center">
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

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {template ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
