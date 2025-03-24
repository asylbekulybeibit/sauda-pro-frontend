/**
 * Модель данных для создания новой смены
 * Соответствует структуре CreateCashShiftDto на бэкенде
 */
export interface CreateShiftData {
  // ID магазина - обязательное поле
  shopId: string;

  // ID кассы - обязательное поле
  cashRegisterId: string;

  // Начальная сумма наличных - опциональное поле, по умолчанию 0
  initialAmount?: number;

  // Комментарий - опциональное поле
  comment?: string;
}

/**
 * Возвращает объект запроса для создания смены с проверкой данных
 * @param shopId ID магазина
 * @param cashRegisterId ID кассы
 * @param initialAmount Начальная сумма наличных (опционально)
 * @param comment Комментарий (опционально)
 * @returns Валидный объект для запроса на создание смены
 */
export function createShiftRequest(
  shopId: string,
  cashRegisterId: string,
  initialAmount: number = 0,
  comment?: string
): CreateShiftData {
  // Проверка на пустой shopId
  if (!shopId || shopId.trim() === '') {
    throw new Error('ID магазина не может быть пустым');
  }

  // Проверка на пустой cashRegisterId
  if (!cashRegisterId || cashRegisterId.trim() === '') {
    throw new Error('ID кассы не может быть пустым');
  }

  return {
    shopId,
    cashRegisterId,
    initialAmount,
    ...(comment && { comment }),
  };
}
