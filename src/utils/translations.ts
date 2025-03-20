/**
 * Утилиты для перевода терминов в приложении
 */

/**
 * Переводит причины изменения цен с английского на русский
 * @param reason Причина изменения цены на английском
 * @returns Причина изменения цены на русском
 */
export const translatePriceChangeReason = (reason?: string): string => {
  if (!reason) return 'Не указана';

  // Таблица соответствий для перевода
  const translations: Record<string, string> = {
    'Initial selling price': 'Начальная цена продажи',
    'Initial purchase price': 'Начальная закупочная цена',
    'Selling price update': 'Обновление цены продажи',
    'Purchase price update': 'Обновление закупочной цены',
    'Price increase': 'Повышение цены',
    'Price decrease': 'Понижение цены',
    Promotion: 'Акция',
    'Season change': 'Сезонное изменение',
    'Market adjustment': 'Рыночная корректировка',
    'Supplier price change': 'Изменение цены поставщика',
    'Competition response': 'Ответ на конкуренцию',
    'Inventory clearance': 'Распродажа остатков',
    'Cost increase': 'Увеличение себестоимости',
    'New product introduction': 'Введение нового продукта',
    'Quality improvement': 'Улучшение качества',
    Discount: 'Скидка',
    'Special offer': 'Специальное предложение',
    'Holiday pricing': 'Праздничная цена',
    'Wholesale pricing': 'Оптовая цена',
    'Bulk discount': 'Скидка за объем',
    'End of season': 'Конец сезона',
    Liquidation: 'Ликвидация',
    Clearance: 'Распродажа',
  };

  // Проверяем, есть ли точное соответствие
  if (translations[reason]) {
    return translations[reason];
  }

  // Если точного соответствия нет, возвращаем исходный текст
  return reason;
};
