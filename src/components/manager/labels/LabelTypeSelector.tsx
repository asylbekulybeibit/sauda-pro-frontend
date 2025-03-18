import { LabelType } from '@/types/label';
import {
  TagIcon,
  QrCodeIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface LabelTypeSelectorProps {
  selectedType: LabelType;
  onChange: (type: LabelType) => void;
}

export function LabelTypeSelector({
  selectedType,
  onChange,
}: LabelTypeSelectorProps) {
  const labelTypes = [
    {
      type: LabelType.PRICE_TAG,
      name: 'Ценник',
      description: 'Обычный ценник с названием товара и ценой',
      icon: <TagIcon className="h-8 w-8" />,
    },
    {
      type: LabelType.BARCODE,
      name: 'Штрих-код',
      description: 'Этикетка со штрих-кодом для сканирования',
      icon: <QrCodeIcon className="h-8 w-8" />,
    },
    {
      type: LabelType.INFO,
      name: 'Информация',
      description: 'Информационная этикетка с подробным описанием',
      icon: <InformationCircleIcon className="h-8 w-8" />,
    },
    {
      type: LabelType.SHELF,
      name: 'Полочный',
      description: 'Большой ценник для размещения на полке',
      icon: <ShoppingBagIcon className="h-8 w-8" />,
    },
  ];

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Выберите тип этикетки:
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {labelTypes.map((labelType) => (
          <div
            key={labelType.type}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedType === labelType.type
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
            onClick={() => onChange(labelType.type)}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`${
                  selectedType === labelType.type
                    ? 'text-indigo-600'
                    : 'text-gray-500'
                } mb-2`}
              >
                {labelType.icon}
              </div>
              <h4 className="font-medium text-gray-900">{labelType.name}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {labelType.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
