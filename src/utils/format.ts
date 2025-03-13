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
