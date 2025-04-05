import axios from 'axios';
import { ShiftClosingData } from '../types/cashier';
// Локальное определение API_URL для кассирского API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Получаем токен авторизации из localStorage
// Проверяем разные возможные ключи, которые могут использоваться в приложении
const getAuthHeader = () => {
  // Проверяем несколько вариантов ключей, которые могут содержать токен
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwtToken');

  // Логируем для отладки
  console.log(
    '🔑 Используемый токен для кассирского API:',
    token ? 'Токен найден' : 'Токен не найден'
  );

  // Если токен найден, добавляем его в заголовок
  if (token) {
    console.log(
      '🔐 Авторизация для кассирского API:',
      `Bearer ${token.substring(0, 10)}...`
    );
    return { Authorization: `Bearer ${token}` };
  } else {
    // Проверяем все ключи в localStorage для отладки
    console.log('📦 Все ключи в localStorage:', Object.keys(localStorage));
    console.error(
      '⚠️ Токен авторизации не найден! Пользователь не авторизован'
    );

    // Перенаправляем на страницу логина если в контексте браузера
    if (typeof window !== 'undefined') {
      console.log('🔄 Перенаправление на страницу логина');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }

    return {};
  }
};

export const cashierApi = {
  /**
   * Получение информации о текущем пользователе
   */
  async getCurrentUserProfile() {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Поиск товаров по штрихкоду или названию
   */
  async searchProducts(warehouseId: string, query: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/products/search`,
      {
        params: { query },
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение информации о текущей смене
   */
  async getCurrentShift(warehouseId: string) {
    console.log('API: Запрос текущей смены для warehouseId:', warehouseId);
    try {
      const response = await axios.get(
        `${API_URL}/manager/${warehouseId}/cashier/shift/current`,
        {
          headers: getAuthHeader(),
        }
      );
      console.log('API: Ответ API по текущей смене:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Ошибка при получении текущей смены:', error);
      throw error;
    }
  },

  /**
   * Открытие кассовой смены
   */
  async openShift(
    warehouseId: string,
    data: { cashRegisterId: string; initialAmount: number }
  ) {
    console.log('API: Запрос на открытие смены:', { warehouseId, data });
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/shift/open`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    console.log('API: Ответ API на открытие смены:', response.data);
    return response.data;
  },

  /**
   * Закрытие кассовой смены
   */
  async closeShift(
    warehouseId: string,
    data: { shiftId: string; finalAmount: number; notes?: string }
  ): Promise<ShiftClosingData> {
    console.log('API: Запрос на закрытие смены:', { warehouseId, data });
    try {
      const response = await axios.post<any>(
        `${API_URL}/manager/${warehouseId}/cashier/shift/close`,
        data,
        {
          headers: getAuthHeader(),
        }
      );
      console.log('API: Ответ на закрытие смены:', response.data);

      // Проверяем наличие необходимых полей
      if (
        !response.data.warehouse ||
        !response.data.cashRegister ||
        !response.data.cashier
      ) {
        console.error('API: Неполные данные в ответе:', response.data);
        throw new Error('Получены неполные данные от сервера');
      }

      // Преобразуем данные в правильный формат
      const transformedData: ShiftClosingData = {
        ...response.data,
        initialAmount: Number(response.data.initialAmount),
        finalAmount: Number(response.data.finalAmount),
        totalSales: Number(response.data.totalSales),
        totalReturns: Math.abs(Number(response.data.totalReturns)),
        totalNet: Number(response.data.totalNet),
        paymentMethods: response.data.paymentMethods.map((method: any) => ({
          methodId: method.methodId,
          methodName: method.methodName,
          sales: Number(method.sales),
          returns: Number(method.returns),
          total: Number(method.total),
          operationType: method.operationType,
        })),
      };

      console.log('API: Преобразованные данные:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('API: Ошибка при закрытии смены:', error);
      throw error;
    }
  },

  /**
   * Печать отчета о закрытии смены
   */
  async printShiftReport(warehouseId: string, shiftId: string): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/manager/${warehouseId}/cashier/shift/${shiftId}/print-report`,
        {},
        {
          headers: getAuthHeader(),
        }
      );
    } catch (error) {
      console.error('API: Ошибка при печати отчета о смене:', error);
      throw error;
    }
  },

  /**
   * Создание нового чека
   */
  async createReceipt(
    warehouseId: string,
    data: { cashShiftId: string; cashRegisterId: string }
  ) {
    console.log('API: Запрос на создание нового чека:', { warehouseId, data });
    try {
      const response = await axios.post(
        `${API_URL}/manager/${warehouseId}/cashier/receipts`,
        data,
        {
          headers: getAuthHeader(),
        }
      );
      console.log('API: Чек успешно создан. Ответ:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API: Ошибка при создании чека:', error);

      // Детализация ошибки для отладки
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API: Ответ сервера с ошибкой:', {
            status: error.response.status,
            data: error.response.data,
          });

          // Если смена не открыта, логируем это специально
          if (
            error.response.status === 404 ||
            (error.response.data?.message &&
              error.response.data.message.includes('shift'))
          ) {
            console.error('API: Возможно, смена не открыта или не найдена');
          }
        } else if (error.request) {
          console.error('API: Запрос был отправлен, но ответ не получен');
        } else {
          console.error('API: Ошибка при настройке запроса:', error.message);
        }
      }

      throw error; // Пробрасываем ошибку дальше для обработки в компоненте
    }
  },

  /**
   * Добавление товара в чек
   */
  async addItemToReceipt(
    warehouseId: string,
    receiptId: string,
    data: {
      warehouseProductId: string;
      quantity: number;
      price: number;
      discountPercent?: number;
    }
  ) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/items`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Оплата чека
   */
  async payReceipt(
    warehouseId: string,
    receiptId: string,
    data: {
      paymentMethodId: string;
      amount: number;
    }
  ) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/pay`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Отмена чека
   */
  async cancelReceipt(warehouseId: string, receiptId: string) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/cancel`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Удаление товара из чека
   */
  async removeItemFromReceipt(
    warehouseId: string,
    receiptId: string,
    itemId: string
  ) {
    const response = await axios.delete(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/items/${itemId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение списка чеков
   */
  async getReceipts(warehouseId: string, filters?: { date?: string }) {
    try {
      // Создаем URL с параметрами вручную, чтобы предотвратить автоматический показ ошибок в консоли
      let url = `${API_URL}/manager/${warehouseId}/cashier/receipts`;

      // Добавляем параметры запроса, если они есть
      if (filters?.date) {
        url += `?date=${encodeURIComponent(filters.date)}`;
      }

      console.log('API: Начало запроса чеков');
      console.log('API: URL запроса:', url);
      console.log('API: warehouseId:', warehouseId);
      console.log('API: Заголовки:', getAuthHeader());

      const response = await axios.get(url, {
        headers: getAuthHeader(),
        // Если нужно предотвратить логирование ошибок 404 в консоли:
        validateStatus: function (status) {
          return status === 200 || status === 404; // 404 также считаем успешным ответом
        },
      });

      console.log('API: Статус ответа:', response.status);
      console.log('API: Тело ответа:', response.data);

      // Проверяем статус ответа
      if (response.status === 404) {
        console.log(
          'API: Чеки не найдены (статус 404), возвращаем пустой массив'
        );
        return [];
      }

      console.log('API: Получен ответ со списком чеков:', response.data);
      return response.data;
    } catch (error: any) {
      // Эта часть выполнится только для реальных проблем, кроме 404
      console.error('API: Ошибка при получении списка чеков:', error);
      console.error('API: Детали ошибки:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      return [];
    }
  },

  /**
   * Получение деталей чека
   */
  async getReceiptDetails(warehouseId: string, receiptId: string) {
    try {
      console.log('API: Запрос деталей чека:', { warehouseId, receiptId });

      const response = await axios.get(
        `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}`,
        {
          headers: getAuthHeader(),
          // Если нужно предотвратить логирование ошибок 404 в консоли:
          validateStatus: function (status) {
            return status === 200 || status === 404; // 404 также считаем успешным ответом
          },
        }
      );

      // Проверяем статус ответа
      if (response.status === 404) {
        console.log(
          'API: Детали чека не найдены (статус 404), возвращаем пустой объект'
        );
        return { items: [] };
      }

      console.log('API: Получен ответ с деталями чека:', response.data);
      return response.data;
    } catch (error) {
      // Эта часть выполнится только для реальных проблем, кроме 404
      console.error('API: Ошибка при получении деталей чека:', error);
      return { items: [] };
    }
  },

  /**
   * Оформление возврата товаров
   */
  async createReturn(
    warehouseId: string,
    receiptId: string,
    data: {
      items: Array<{
        receiptItemId: string;
        quantity: number;
      }>;
      reason: string;
      paymentMethodId: string;
    }
  ) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/return`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  async createReturnWithoutReceipt(
    warehouseId: string,
    data: {
      items: Array<{
        productId: string;
        quantity: number;
        price: number;
      }>;
      reason: string;
    }
  ) {
    console.log('Creating return without receipt:', {
      warehouseId,
      data,
      itemsValid: data.items.every(
        (item) =>
          item.productId &&
          typeof item.quantity === 'number' &&
          item.quantity > 0 &&
          typeof item.price === 'number' &&
          item.price > 0
      ),
      formattedItems: data.items.map((item) => ({
        ...item,
        price: Number(Number(item.price).toFixed(2)),
        quantity: Number(item.quantity),
      })),
    });

    // Форматируем данные перед отправкой
    const formattedData = {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        price: Number(Number(item.price).toFixed(2)),
        quantity: Number(item.quantity),
      })),
    };

    console.log('Sending formatted data:', {
      url: `${API_URL}/manager/${warehouseId}/cashier/returns/without-receipt`,
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: formattedData,
    });

    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/returns/without-receipt`,
      formattedData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Получение списка касс
   */
  async getCashRegisters(warehouseId: string) {
    try {
      // Получаем кассы через стандартный эндпоинт
      const response = await axios.get(
        `${API_URL}/manager/${warehouseId}/cash-registers`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении кассовых аппаратов:', error);
      throw error; // Пробрасываем ошибку дальше для обработки в компоненте
    }
  },

  /**
   * Получение списка отложенных чеков
   */
  async getPostponedReceipts(warehouseId: string) {
    try {
      const response = await axios.get(
        `${API_URL}/manager/${warehouseId}/cashier/receipts/postponed`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('API: Ошибка при получении отложенных чеков:', error);
      return [];
    }
  },

  /**
   * Отложить чек
   */
  async postponeReceipt(warehouseId: string, receiptId: string) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/postpone`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Восстановить отложенный чек
   */
  async restorePostponedReceipt(warehouseId: string, receiptId: string) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/restore`,
      {},
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Удаление пустого чека
   */
  async deleteReceipt(warehouseId: string, receiptId: string) {
    const response = await axios.delete(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение методов оплаты для текущей кассы
   */
  async getPaymentMethods(warehouseId: string, cashRegisterId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cash-registers/payment-methods`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data.filter(
      (method: { isShared: boolean; cashRegisterId: string }) =>
        method.isShared || method.cashRegisterId === cashRegisterId
    );
  },

  /**
   * Получение текущего чека
   */
  async getCurrentReceipt(warehouseId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/current`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Поиск чеков по номеру
   */
  async searchReceipts(warehouseId: string, receiptNumber: string) {
    console.log('API: Поиск чеков по номеру:', { warehouseId, receiptNumber });
    try {
      const response = await axios.get(
        `${API_URL}/manager/${warehouseId}/cashier/receipts/search?receiptNumber=${encodeURIComponent(
          receiptNumber
        )}`,
        {
          headers: getAuthHeader(),
          validateStatus: function (status) {
            return status === 200 || status === 404;
          },
        }
      );

      console.log('API: Статус ответа:', response.status);
      console.log('API: Тело ответа:', response.data);

      if (response.status === 404) {
        console.log(
          'API: Чеки не найдены (статус 404), возвращаем пустой массив'
        );
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('API: Ошибка при поиске чеков:', error);
      return [];
    }
  },

  /**
   * Получение списка чеков для истории продаж
   */
  async getSalesHistory(warehouseId: string, params: { shiftId?: string }) {
    try {
      let url = `${API_URL}/manager/${warehouseId}/cashier/receipts`;
      if (params.shiftId) {
        url += `?shiftId=${encodeURIComponent(params.shiftId)}`;
      }

      const response = await axios.get(url, {
        headers: getAuthHeader(),
        validateStatus: function (status) {
          return status === 200 || status === 404;
        },
      });

      if (response.status === 404) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('API: Ошибка при получении истории продаж:', error);
      return [];
    }
  },

  /**
   * Печать чека
   */
  async printReceipt(warehouseId: string, receiptId: string) {
    try {
      const response = await axios.post(
        `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}/print`,
        {},
        {
          headers: getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('API: Ошибка при печати чека:', error);
      throw error;
    }
  },

  /**
   * Получение детальной информации о чеке
   */
  async getSalesReceiptDetails(warehouseId: string, receiptId: string) {
    try {
      const response = await axios.get(
        `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}`,
        {
          headers: getAuthHeader(),
          validateStatus: function (status) {
            return status === 200 || status === 404;
          },
        }
      );

      if (response.status === 404) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('API: Ошибка при получении деталей чека:', error);
      return null;
    }
  },

  /**
   * Поиск клиентов
   */
  async searchClients(warehouseId: string, query: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/clients`,
      {
        params: { search: query },
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение информации о клиенте
   */
  async getClientDetails(warehouseId: string, clientId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/clients/${clientId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Поиск автомобилей
   */
  async searchVehicles(warehouseId: string, query: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/vehicles`,
      {
        params: { search: query },
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение информации об автомобиле
   */
  async getVehicleDetails(warehouseId: string, vehicleId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/vehicles/${vehicleId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение автомобилей клиента
   */
  async getClientVehicles(warehouseId: string, clientId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/clients/${clientId}/vehicles`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },
};
