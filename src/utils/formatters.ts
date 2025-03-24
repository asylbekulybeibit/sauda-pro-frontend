/**
 * Функции форматирования данных для отображения в интерфейсе
 */

/**
 * Форматирует дату в читаемый формат
 * @param dateString Строка с датой или объект Date
 * @param options Опции форматирования
 * @returns Отформатированная строка с датой и временем
 */
export const formatDate = (
  dateString: string | Date | undefined,
  options: {
    showTime?: boolean;
    showSeconds?: boolean;
    showDate?: boolean;
  } = {
    showTime: true,
    showSeconds: false,
    showDate: true,
  }
): string => {
  if (!dateString) return 'Н/Д';

  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Проверка на валидность даты
    if (isNaN(date.getTime())) {
      return 'Некорректная дата';
    }

    const { showTime, showSeconds, showDate } = options;

    // Форматирование даты
    const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
      year: showDate ? 'numeric' : undefined,
      month: showDate ? 'long' : undefined,
      day: showDate ? 'numeric' : undefined,
      hour: showTime ? '2-digit' : undefined,
      minute: showTime ? '2-digit' : undefined,
      second: showTime && showSeconds ? '2-digit' : undefined,
    });

    return dateFormatter.format(date);
  } catch (error) {
    console.error('Ошибка при форматировании даты:', error);
    return 'Ошибка форматирования';
  }
};

/**
 * Форматирует число в денежный формат
 * @param amount Сумма для форматирования
 * @param currency Валюта (по умолчанию RUB)
 * @returns Отформатированная строка с суммой
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency: string = 'RUB'
): string => {
  if (amount === undefined || amount === null) {
    return 'Н/Д';
  }

  try {
    // Форматирование валюты
    const formatter = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Ошибка при форматировании валюты:', error);
    return `${amount} руб.`;
  }
};

/**
 * Форматирует число с разделителями разрядов
 * @param number Число для форматирования
 * @returns Отформатированная строка
 */
export const formatNumber = (number: number | undefined | null): string => {
  if (number === undefined || number === null) {
    return 'Н/Д';
  }

  try {
    return new Intl.NumberFormat('ru-RU').format(number);
  } catch (error) {
    console.error('Ошибка при форматировании числа:', error);
    return number.toString();
  }
};
