import axios from 'axios';
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
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/shift/current`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Открытие кассовой смены
   */
  async openShift(
    warehouseId: string,
    data: { cashRegisterId: string; initialAmount: number }
  ) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/shift/open`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Закрытие кассовой смены
   */
  async closeShift(
    warehouseId: string,
    data: { shiftId: string; finalAmount: number; notes?: string }
  ) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/shift/close`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Создание нового чека
   */
  async createReceipt(
    warehouseId: string,
    data: { cashShiftId: string; cashRegisterId: string }
  ) {
    const response = await axios.post(
      `${API_URL}/manager/${warehouseId}/cashier/receipts`,
      data,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
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
      paymentMethod: string;
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
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/receipts`,
      {
        params: filters,
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },

  /**
   * Получение деталей чека
   */
  async getReceiptDetails(warehouseId: string, receiptId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/receipts/${receiptId}`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
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

  /**
   * Получение списка касс
   */
  async getCashRegisters(warehouseId: string) {
    const response = await axios.get(
      `${API_URL}/manager/${warehouseId}/cashier/registers`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },
};
