export const formatPrice = (price: number | string | null | undefined) => {
  // Проверка на null/undefined
  if (price === null || price === undefined) {
    return '—';
  }

  // Преобразуем строку в число при необходимости
  let numPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Проверка на NaN
  if (isNaN(numPrice)) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
  }).format(numPrice);
};

export const formatDate = (date: string | Date | null | undefined) => {
  if (date === null || date === undefined) {
    return '—';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Проверка на корректность даты
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
};

export const formatNumber = (number: number) => {
  return new Intl.NumberFormat('ru-RU').format(number);
};

/**
 * Форматирует число как денежное значение без указания валюты
 * @param value Число для форматирования
 * @returns Отформатированная строка с числом
 */
export const formatCurrency = (value: number | string | null | undefined) => {
  // Проверка на null/undefined
  if (value === null || value === undefined) {
    return '—';
  }

  // Преобразуем строку в число при необходимости
  let numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Проверка на NaN
  if (isNaN(numValue)) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

/**
 * Возвращает относительное время, прошедшее с указанной даты
 * @param date Дата для которой нужно вычислить относительное время
 * @returns Строка вида "2 дня назад", "только что", "3 месяца назад" и т.д.
 */
export const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const timeDate = typeof date === 'string' ? new Date(date) : date;

  // Разница в миллисекундах
  const diffMs = now.getTime() - timeDate.getTime();

  // Пересчитываем в нужные единицы
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  // Формируем читаемую строку
  if (diffSec < 60) {
    return 'только что';
  } else if (diffMin < 60) {
    return `${diffMin} ${pluralize(
      diffMin,
      'минуту',
      'минуты',
      'минут'
    )} назад`;
  } else if (diffHour < 24) {
    return `${diffHour} ${pluralize(diffHour, 'час', 'часа', 'часов')} назад`;
  } else if (diffDay < 30) {
    return `${diffDay} ${pluralize(diffDay, 'день', 'дня', 'дней')} назад`;
  } else if (diffMonth < 12) {
    return `${diffMonth} ${pluralize(
      diffMonth,
      'месяц',
      'месяца',
      'месяцев'
    )} назад`;
  } else {
    return `${diffYear} ${pluralize(diffYear, 'год', 'года', 'лет')} назад`;
  }
};

/**
 * Вспомогательная функция для склонения русских слов
 * @param number Число для которого нужно склонение
 * @param one Форма для 1
 * @param few Форма для 2-4
 * @param many Форма для 5-20
 * @returns Правильно склоненное слово
 */
function pluralize(
  number: number,
  one: string,
  few: string,
  many: string
): string {
  if (number % 10 === 1 && number % 100 !== 11) {
    return one;
  } else if (
    [2, 3, 4].includes(number % 10) &&
    ![12, 13, 14].includes(number % 100)
  ) {
    return few;
  } else {
    return many;
  }
}
