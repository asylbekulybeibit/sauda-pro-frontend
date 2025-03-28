export const generateBarcode = (prefix: string = ''): string => {
  // Генерируем случайное 12-значное число
  const random = Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, '0');

  // Добавляем префикс, если он указан
  const code = prefix + random;

  // Вычисляем контрольную цифру
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  // Возвращаем полный штрихкод с контрольной цифрой
  return code + checkDigit;
};
