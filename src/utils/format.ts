export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
  }).format(price);
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatNumber = (number: number) => {
  return new Intl.NumberFormat('ru-RU').format(number);
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
