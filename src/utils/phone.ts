export const formatPhoneNumber = (value: string): string => {
  // Всегда начинаем с +7
  let formatted = '+7';

  // Добавляем скобку
  formatted += ' (';

  // Добавляем первые три цифры или подчеркивания
  if (value.length > 0) {
    formatted += value.slice(0, Math.min(3, value.length));
  }
  if (value.length < 3) {
    formatted += '_'.repeat(3 - value.length);
  }

  formatted += ') ';

  // Добавляем следующие три цифры или подчеркивания
  if (value.length > 3) {
    formatted += value.slice(3, Math.min(6, value.length));
  }
  if (value.length < 6) {
    formatted += '_'.repeat(Math.min(3, 6 - value.length));
  }

  formatted += '-';

  // Добавляем следующие две цифры или подчеркивания
  if (value.length > 6) {
    formatted += value.slice(6, Math.min(8, value.length));
  }
  if (value.length < 8) {
    formatted += '_'.repeat(Math.min(2, 8 - value.length));
  }

  formatted += '-';

  // Добавляем последние две цифры или подчеркивания
  if (value.length > 8) {
    formatted += value.slice(8, Math.min(10, value.length));
  }
  if (value.length < 10) {
    formatted += '_'.repeat(Math.min(2, 10 - value.length));
  }

  return formatted;
};

export const normalizePhoneNumber = (phone: string): string => {
  // Получаем только цифры
  const digits = phone.replace(/\D/g, '');

  // Если длина меньше 10 цифр, возвращаем ошибку
  if (digits.length < 10) {
    throw new Error('Номер телефона должен содержать минимум 10 цифр');
  }

  // Если номер начинается с 8 или 7, убираем эту цифру
  let lastTenDigits = digits;
  if (
    digits.length === 11 &&
    (digits.startsWith('8') || digits.startsWith('7'))
  ) {
    lastTenDigits = digits.slice(1);
  } else {
    // Берем последние 10 цифр
    lastTenDigits = digits.slice(-10);
  }

  // Возвращаем номер в формате +7XXXXXXXXXX
  return '+7' + lastTenDigits;
};
