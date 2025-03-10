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
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8')) {
    return '+7' + digits.slice(1);
  }
  if (digits.startsWith('7')) {
    return '+' + digits;
  }
  return '+7' + digits;
};
