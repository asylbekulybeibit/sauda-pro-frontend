import { Promotion } from '@/types/promotion';
import { TagIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/date';

interface ActivePromotionsProps {
  promotions: Promotion[];
}

export function ActivePromotions({ promotions }: ActivePromotionsProps) {
  // Фильтруем только активные акции
  const activePromotions = promotions
    .filter((promotion) => {
      const now = new Date();
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);
      return startDate <= now && now <= endDate;
    })
    .sort(
      (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    );

  if (activePromotions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Активные акции
        </h3>
        <div className="text-gray-500 text-center py-4">Нет активных акций</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Активные акции
        </h3>
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200">
            {activePromotions.map((promotion) => (
              <li key={promotion.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <TagIcon
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {promotion.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      До {formatDate(promotion.endDate)}
                    </p>
                    {promotion.discount && (
                      <p className="text-sm text-green-600">
                        Скидка: {promotion.discount}%
                      </p>
                    )}
                  </div>
                  <div>
                    <Link
                      to={`/manager/promotions/${promotion.id}`}
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
