import { message } from 'antd';
import axios, { AxiosError } from 'axios';

/**
 * Обработчик API ошибок, который преобразует ошибки Axios в понятные пользовательские сообщения
 * @param error Ошибка от API запроса
 * @param fallbackMessage Сообщение по умолчанию, если не удалось определить тип ошибки
 * @returns Объект с текстом ошибки и статус-кодом (если есть)
 */
export const handleApiError = (
  error: unknown,
  fallbackMessage = 'Произошла ошибка при обращении к серверу'
): { message: string; statusCode?: number } => {
  // Проверяем, является ли ошибка ошибкой Axios
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Проверяем наличие ответа от сервера
    if (axiosError.response) {
      const statusCode = axiosError.response.status;
      const data = axiosError.response.data as any;

      // Обрабатываем разные статус-коды
      switch (statusCode) {
        case 400:
          return {
            message: data?.message || 'Неверный запрос',
            statusCode: 400,
          };
        case 401:
          return {
            message: 'Требуется авторизация',
            statusCode: 401,
          };
        case 403:
          return {
            message: 'Доступ запрещен',
            statusCode: 403,
          };
        case 404:
          return {
            message: 'Запрашиваемый ресурс не найден',
            statusCode: 404,
          };
        case 409:
          return {
            message: data?.message || 'Конфликт при выполнении запроса',
            statusCode: 409,
          };
        case 422:
          return {
            message: data?.message || 'Ошибка валидации данных',
            statusCode: 422,
          };
        case 500:
          return {
            message: 'Внутренняя ошибка сервера',
            statusCode: 500,
          };
        default:
          return {
            message: `Ошибка (${statusCode}): ${
              data?.message || 'Неизвестная ошибка'
            }`,
            statusCode,
          };
      }
    }

    // Ошибка сети (нет соединения с сервером)
    if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
      return {
        message:
          'Не удалось соединиться с сервером. Проверьте подключение к интернету.',
      };
    }
  }

  // Если это не ошибка Axios или неизвестная ошибка
  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
    };
  }

  // Для неизвестных типов ошибок
  return {
    message: fallbackMessage,
  };
};

/**
 * Показывает уведомление об ошибке с помощью Ant Design Message
 * @param error Ошибка для обработки
 * @param fallbackMessage Сообщение по умолчанию
 */
export const showErrorMessage = (
  error: unknown,
  fallbackMessage?: string
): void => {
  const { message: errorMessage } = handleApiError(error, fallbackMessage);
  message.error(errorMessage);
};

export default {
  handleApiError,
  showErrorMessage,
};
