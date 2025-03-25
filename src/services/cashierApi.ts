import { api } from './api';
import { CashRegister, Shift, ShiftStatus } from '@/types/cash-register';
import { handleApiError, showErrorMessage } from '@/utils/errorHandling';
import axios from 'axios';
import { createShiftRequest } from '@/models/CreateShiftData';

/**
 * Получение списка всех касс для конкретного магазина
 */
export const getCashRegisters = async (
  shopId: string
): Promise<CashRegister[]> => {
  try {
    console.log('[cashierApi] Getting cash registers for shop:', shopId);
    const { data } = await api.get(`/manager/${shopId}/cash-registers`);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error getting cash registers:', error);
    throw handleApiError(error, 'Не удалось загрузить список касс');
  }
};

/**
 * Получение информации о конкретной кассе
 */
export const getCashRegister = async (
  shopId: string,
  registerId: string
): Promise<CashRegister> => {
  try {
    console.log('[cashierApi] Getting cash register details:', {
      shopId,
      registerId,
    });
    const { data } = await api.get(
      `/manager/${shopId}/cash-registers/${registerId}`
    );
    return data;
  } catch (error) {
    console.error(
      `[cashierApi] Error getting cash register ${registerId}:`,
      error
    );
    throw handleApiError(error, 'Не удалось получить информацию о кассе');
  }
};

/**
 * Проверка наличия незакрытой смены для кассира
 */
export const checkUnclosedShift = async (
  shopId: string
): Promise<{ hasUnclosed: boolean; shiftId?: string; registerId?: string }> => {
  try {
    console.log('[cashierApi] Checking unclosed shifts for shop:', shopId);

    // Используем API для проверки текущих смен и находим если есть незакрытые
    const { data } = await api.get(`/manager/${shopId}/cash-shifts/current`);

    // Проверяем, есть ли незакрытые смены
    const hasUnclosed = Array.isArray(data) && data.length > 0;

    // Если есть незакрытая смена, возвращаем её ID и ID кассы
    if (hasUnclosed && data[0]) {
      console.log('[cashierApi] Found unclosed shift:', data[0].id);
      return {
        hasUnclosed: true,
        shiftId: data[0].id,
        registerId: data[0].cashRegisterId,
      };
    }

    console.log('[cashierApi] No unclosed shifts found');
    return { hasUnclosed: false };
  } catch (error) {
    console.error('[cashierApi] Error checking unclosed shifts:', error);
    throw handleApiError(error, 'Не удалось проверить наличие незакрытых смен');
  }
};

/**
 * Получение текущей активной смены кассира
 */
export const getCurrentShift = async (
  shopId: string
): Promise<Shift | null> => {
  try {
    console.log('[cashierApi] Getting current shift for shop:', shopId);

    const { data } = await api.get(`/manager/${shopId}/cash-shifts/current`);

    // Если есть активные смены, возвращаем первую (предполагается, что у кассира может быть только одна активная смена)
    if (Array.isArray(data) && data.length > 0) {
      console.log('[cashierApi] Found current shift:', data[0].id);
      return data[0];
    }

    console.log('[cashierApi] No current shift found');
    return null;
  } catch (error) {
    console.error('[cashierApi] Error getting current shift:', error);
    throw handleApiError(
      error,
      'Не удалось получить информацию о текущей смене'
    );
  }
};

/**
 * Открытие новой смены
 */
export const openShift = async (
  shopId: string,
  registerId: string,
  openData: { openingAmount?: number } = {}
): Promise<Shift> => {
  try {
    // Используем утилиту для создания и валидации данных запроса
    const createShiftData = createShiftRequest(shopId, registerId, 0);

    // Подробное логирование для отладки
    console.log('[cashierApi] openShift called with:', {
      shopId,
      registerId,
      shopIdType: typeof shopId,
      shopIdEmpty: !shopId,
      createShiftData,
    });

    console.log(
      '[cashierApi] Sending request with:',
      JSON.stringify(createShiftData)
    );
    console.log('[cashierApi] Request URL:', `/manager/${shopId}/cash-shifts`);

    const { data } = await api.post(
      `/manager/${shopId}/cash-shifts`,
      createShiftData
    );

    console.log('[cashierApi] Response received:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error opening shift:', error);

    // Дополнительное логирование ошибки
    if (axios.isAxiosError(error) && error.response) {
      console.error('[cashierApi] Response error data:', error.response.data);
      console.error('[cashierApi] Response status:', error.response.status);
      console.error(
        '[cashierApi] Request config:',
        JSON.stringify(error.config)
      );
    }

    throw handleApiError(error, 'Не удалось открыть смену');
  }
};

/**
 * Закрытие смены
 */
export const closeShift = async (
  shopId: string,
  shiftId: string,
  closeData: any = {}
): Promise<Shift> => {
  try {
    console.log('[cashierApi] Closing shift with:', {
      shopId,
      shiftId,
      closeData,
    });

    // Упрощенная версия с передачей ID магазина
    const { data } = await api.post(
      `/manager/${shopId}/cash-shifts/${shiftId}/close`,
      {
        shopId: shopId, // Добавляем ID магазина в запрос
        finalAmount: 0, // Отправляем 0 для finalAmount (заменено с closingAmount)
        comment: closeData.comment || '', // Добавляем комментарий из closeData
      }
    );

    console.log('[cashierApi] Shift closed successfully:', data);
    return data;
  } catch (error) {
    console.error(`[cashierApi] Error closing shift ${shiftId}:`, error);
    throw handleApiError(error, 'Не удалось закрыть смену');
  }
};

/**
 * Получение истории смен для магазина
 */
export const getShiftHistory = async (shopId: string): Promise<Shift[]> => {
  try {
    console.log(`[cashierApi] Getting shift history for shop: ${shopId}`);
    // const { data } = await api.get(`/manager/${shopId}/cash-shifts`);

    // Имитация задержки загрузки данных
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Тестовые данные для отображения истории смен
    const currentCashierId = 'current-cashier'; // Должно совпадать с временным ID в компоненте

    const mockShifts: Shift[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        shopId: shopId,
        registerId: '1',
        registerName: 'Основная касса',
        cashierId: currentCashierId, // ID текущего кассира
        cashierName: 'Иванов Иван',
        status: 'closed' as ShiftStatus,
        openedAt: '2023-07-15T08:30:00Z',
        closedAt: '2023-07-15T18:45:00Z',
        totalSales: 45600.75,
        totalRefunds: 1200.5,
        totalCash: 15000,
        totalNonCash: 30600.75,
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        shopId: shopId,
        registerId: '2',
        registerName: 'Мобильная касса',
        cashierId: currentCashierId, // ID текущего кассира
        cashierName: 'Иванов Иван',
        status: 'open' as ShiftStatus,
        openedAt: '2023-07-16T09:15:00Z',
        closedAt: undefined,
        totalSales: 12500.25,
        totalRefunds: 0,
        totalCash: 5000,
        totalNonCash: 7500.25,
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        shopId: shopId,
        registerId: '1',
        registerName: 'Основная касса',
        cashierId: 'another-cashier', // ID другого кассира - не должен отображаться
        cashierName: 'Смирнов Алексей',
        status: 'closed' as ShiftStatus,
        openedAt: '2023-07-14T08:00:00Z',
        closedAt: '2023-07-14T20:00:00Z',
        totalSales: 68200,
        totalRefunds: 2100,
        totalCash: 25000,
        totalNonCash: 43200,
      },
      {
        id: '423e4567-e89b-12d3-a456-426614174003',
        shopId: shopId,
        registerId: '3',
        registerName: 'Касса самообслуживания',
        cashierId: currentCashierId, // ID текущего кассира
        cashierName: 'Иванов Иван',
        status: 'closed' as ShiftStatus,
        openedAt: '2023-07-13T10:00:00Z',
        closedAt: '2023-07-13T19:30:00Z',
        totalSales: 35400.5,
        totalRefunds: 800,
        totalCash: 12000,
        totalNonCash: 23400.5,
      },
    ];

    console.log(
      '[cashierApi] Returning mock shift history with',
      mockShifts.length,
      'shifts (including other cashiers)'
    );
    return mockShifts;
  } catch (error) {
    console.error('Ошибка при получении истории смен:', error);
    return [];
  }
};

/**
 * Получение деталей смены
 */
export const getShiftDetails = async (
  shopId: string,
  shiftId: string
): Promise<Shift> => {
  try {
    console.log('[cashierApi] Getting shift details:', { shopId, shiftId });
    const { data } = await api.get(`/manager/${shopId}/cash-shifts/${shiftId}`);
    return data;
  } catch (error) {
    console.error(
      `[cashierApi] Error getting shift details for ${shiftId}:`,
      error
    );
    throw handleApiError(error, 'Не удалось загрузить детали смены');
  }
};

/**
 * Получение операций по смене
 */
export const getShiftOperations = async (
  shopId: string,
  shiftId: string
): Promise<any[]> => {
  try {
    // В реальном коде здесь будет запрос к API
    console.log('[cashierApi] Getting shift operations:', { shopId, shiftId });
    // const { data } = await api.get(
    //   `/manager/${shopId}/cash-shifts/${shiftId}/operations`
    // );

    // Имитация задержки загрузки данных
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Тестовые данные с информацией о услугах, клиентах и автомобилях
    const mockOperations = [
      {
        id: `${shiftId}-op1`,
        type: 'service',
        amount: 2500,
        time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 часа назад
        serviceType: 'Замена масла',
        clientName: 'Иванов Петр',
        vehicleInfo: 'Toyota Camry, А123БВ777',
        technicianName: 'Сидоров Алексей',
        paymentMethod: 'Наличные',
        shiftId: shiftId,
      },
      {
        id: `${shiftId}-op2`,
        type: 'service',
        amount: 5000,
        time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 часа назад
        serviceType: 'Диагностика ходовой',
        clientName: 'Петрова Мария',
        vehicleInfo: 'Volkswagen Polo, В456АС77',
        technicianName: 'Смирнов Иван',
        paymentMethod: 'Карта',
        shiftId: shiftId,
      },
      {
        id: `${shiftId}-op3`,
        type: 'product',
        amount: 1200,
        time: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(), // 1.5 часа назад
        serviceType: 'Моторное масло 5W-40',
        clientName: 'Сидоров Алексей',
        paymentMethod: 'Наличные',
        shiftId: shiftId,
      },
      {
        id: `${shiftId}-op4`,
        type: 'refund',
        amount: 450,
        time: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 час назад
        serviceType: 'Возврат: Тормозная жидкость',
        clientName: 'Иванов Петр',
        paymentMethod: 'Наличные',
        shiftId: shiftId,
      },
      {
        id: `${shiftId}-op5`,
        type: 'service',
        amount: 3500,
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 минут назад
        serviceType: 'Замена тормозных колодок',
        clientName: 'Кузнецов Дмитрий',
        vehicleInfo: 'Hyundai Solaris, К789МН99',
        technicianName: 'Иванов Алексей',
        paymentMethod: 'Карта',
        shiftId: shiftId,
      },
    ];

    return mockOperations;
  } catch (error) {
    console.error(
      `[cashierApi] Error getting shift operations for shift ${shiftId}:`,
      error
    );
    throw handleApiError(error, 'Не удалось загрузить операции смены');
  }
};

/**
 * Получение итоговых данных по смене
 */
export const getShiftSummary = async (
  shopId: string,
  shiftId: string
): Promise<any> => {
  try {
    const { data } = await api.get(
      `/manager/${shopId}/cashier/shift/${shiftId}/summary`
    );
    return data;
  } catch (error) {
    console.error(
      `[cashierApi] Error getting shift summary for shift ${shiftId}:`,
      error
    );
    throw handleApiError(error, 'Не удалось загрузить итоги смены');
  }
};

/**
 * Получение активных услуг
 */
export const getActiveServices = async (shopId: string): Promise<any[]> => {
  try {
    const { data } = await api.get(
      `/manager/${shopId}/cashier/services/active`
    );
    return data;
  } catch (error) {
    console.error('[cashierApi] Error getting active services:', error);
    throw handleApiError(error, 'Не удалось загрузить активные услуги');
  }
};

/**
 * Получение списка доступных услуг для создания
 */
export const getServices = async (shopId: string): Promise<any[]> => {
  try {
    console.log('[cashierApi] Getting services for shop:', shopId);
    console.log(
      '[cashierApi] Request URL:',
      `/manager/service-types/shop/${shopId}`
    );

    const response = await api.get(`/manager/service-types/shop/${shopId}`);
    console.log('[cashierApi] Response status:', response.status);
    console.log('[cashierApi] Response data:', response.data);

    return response.data;
  } catch (error) {
    console.error('[cashierApi] Error getting services:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось загрузить список услуг');
  }
};

/**
 * Получение списка клиентов
 */
export const getClients = async (shopId: string): Promise<any[]> => {
  try {
    console.log('[cashierApi] Getting clients for shop:', shopId);
    const { data } = await api.get(`/manager/clients/shop/${shopId}`);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error getting clients:', error);
    throw handleApiError(error, 'Не удалось загрузить список клиентов');
  }
};

/**
 * Получение автомобилей клиента
 */
export const getClientVehicles = async (
  clientId: string,
  shopId?: string
): Promise<any[]> => {
  try {
    console.log('[cashierApi] Getting vehicles for client:', clientId);

    // Проверяем, что shopId определен
    if (!shopId) {
      // Если shopId не передан, используем значение из localStorage или из URL
      const storedShopId = localStorage.getItem('currentShopId');
      shopId = storedShopId || window.location.pathname.split('/')[2];

      if (!shopId) {
        console.error(
          '[cashierApi] Shop ID not provided for getClientVehicles'
        );
      }
    }

    // Используем API для кассиров, а не для менеджеров
    console.log(
      '[cashierApi] Request URL:',
      `/manager/${shopId}/cashier/vehicles/client/${clientId}`
    );
    const { data } = await api.get(
      `/manager/${shopId}/cashier/vehicles/client/${clientId}`
    );

    console.log('[cashierApi] Retrieved vehicles:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error getting client vehicles:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(
      error,
      'Не удалось загрузить список автомобилей клиента'
    );
  }
};

/**
 * Создание новой услуги
 */
export const createService = async (serviceData: {
  shopId: string;
  clientId: string;
  vehicleId: string;
  serviceTypeId: string;
  originalPrice?: number;
  finalPrice?: number;
  discountPercent?: number;
  staffIds?: string[];
  comment?: string;
}): Promise<any> => {
  try {
    console.log(
      '[cashierApi] Creating service with original data:',
      serviceData
    );

    // Проверяем наличие shopId
    if (!serviceData.shopId) {
      throw new Error('shopId обязателен для создания услуги');
    }

    // Проверяем типы числовых полей
    if (
      serviceData.originalPrice !== undefined &&
      typeof serviceData.originalPrice !== 'number'
    ) {
      console.error(
        '[cashierApi] originalPrice is not a number:',
        serviceData.originalPrice,
        typeof serviceData.originalPrice
      );
      serviceData.originalPrice = Number(serviceData.originalPrice);
      console.log(
        '[cashierApi] Converted originalPrice to number:',
        serviceData.originalPrice
      );
    }

    if (
      serviceData.finalPrice !== undefined &&
      typeof serviceData.finalPrice !== 'number'
    ) {
      console.error(
        '[cashierApi] finalPrice is not a number:',
        serviceData.finalPrice,
        typeof serviceData.finalPrice
      );
      serviceData.finalPrice = Number(serviceData.finalPrice);
      console.log(
        '[cashierApi] Converted finalPrice to number:',
        serviceData.finalPrice
      );
    }

    if (
      serviceData.discountPercent !== undefined &&
      typeof serviceData.discountPercent !== 'number'
    ) {
      console.error(
        '[cashierApi] discountPercent is not a number:',
        serviceData.discountPercent,
        typeof serviceData.discountPercent
      );
      serviceData.discountPercent = Number(serviceData.discountPercent);
      console.log(
        '[cashierApi] Converted discountPercent to number:',
        serviceData.discountPercent
      );
    }

    // Форматируем данные для запроса
    const formattedData = {
      ...serviceData,
      // Убедимся, что staffIds всегда валидный массив UUID
      staffIds: Array.isArray(serviceData.staffIds) ? serviceData.staffIds : [],
    };

    console.log(
      '[cashierApi] Sending request with formatted data:',
      formattedData
    );
    console.log('[cashierApi] shopId in request:', formattedData.shopId);
    console.log('[cashierApi] Original price:', formattedData.originalPrice);
    console.log('[cashierApi] Final price:', formattedData.finalPrice);
    console.log(
      '[cashierApi] Discount percent:',
      formattedData.discountPercent
    );
    console.log('[cashierApi] staffIds in request:', formattedData.staffIds);

    // Формируем URL с учетом shopId
    const url = `/manager/${formattedData.shopId}/cashier/service/start`;
    console.log('[cashierApi] Request URL:', url);

    const response = await api.post(url, formattedData);
    console.log('[cashierApi] Service created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('[cashierApi] Error creating service:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось создать услугу');
  }
};

/**
 * Создание нового клиента
 */
export const createClient = async (
  shopId: string,
  clientData: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    discountPercent?: number;
  }
): Promise<any> => {
  try {
    console.log('[cashierApi] Creating new client:', clientData);
    console.log('[cashierApi] Request URL:', `/manager/clients/shop/${shopId}`);

    const { data } = await api.post(
      `/manager/clients/shop/${shopId}`,
      clientData
    );

    console.log('[cashierApi] Client created successfully:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error creating client:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось создать клиента');
  }
};

/**
 * Создание нового автомобиля для клиента
 */
export const createVehicleForClient = async (
  shopId: string,
  clientId: string,
  vehicleData: {
    make: string;
    model: string;
    licensePlate: string;
    year?: number;
    color?: string;
    vin?: string;
    bodyType: string;
    engineVolume?: number;
  }
): Promise<any> => {
  try {
    console.log('[cashierApi] Creating new vehicle for client:', {
      shopId,
      clientId,
      vehicleData,
    });
    console.log(
      '[cashierApi] Request URL:',
      `/manager/${shopId}/cashier/vehicles`
    );

    // Подготавливаем данные для API
    const dto = {
      ...vehicleData,
      clientId: clientId, // Устанавливаем ID клиента
    };

    const { data } = await api.post(`/manager/${shopId}/cashier/vehicles`, dto);
    console.log('[cashierApi] Vehicle created successfully:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error creating vehicle:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось создать автомобиль');
  }
};

/**
 * Создание нового автомобиля без привязки к клиенту
 */
export const createVehicle = async (
  shopId: string,
  vehicleData: {
    make: string;
    model: string;
    licensePlate: string;
    year?: number;
    color?: string;
    vin?: string;
    bodyType: string;
    engineVolume?: number;
  }
): Promise<any> => {
  try {
    console.log('[cashierApi] Creating new vehicle without client:', {
      shopId,
      vehicleData,
    });
    console.log(
      '[cashierApi] Request URL:',
      `/manager/${shopId}/cashier/vehicles`
    );

    const { data } = await api.post(
      `/manager/${shopId}/cashier/vehicles`,
      vehicleData
    );
    console.log('[cashierApi] Vehicle created successfully:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error creating vehicle:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось создать автомобиль');
  }
};

/**
 * Получение всех автомобилей магазина
 */
export const getAllVehicles = async (shopId: string): Promise<any[]> => {
  try {
    console.log('[cashierApi] Fetching all vehicles for shop:', shopId);
    console.log(
      '[cashierApi] Request URL:',
      `/manager/${shopId}/cashier/vehicles`
    );

    const { data } = await api.get(`/manager/${shopId}/cashier/vehicles`);
    console.log('[cashierApi] All vehicles fetched successfully:', data);

    // Преобразуем данные, чтобы добавить информацию о клиенте для отображения
    const vehiclesWithClientInfo = data.map((vehicle: any) => ({
      ...vehicle,
      clientName: vehicle.client
        ? `${vehicle.client.lastName} ${vehicle.client.firstName}`
        : undefined,
      clientId: vehicle.client ? vehicle.client.id : undefined, // Добавляем ID клиента если он есть
    }));

    return vehiclesWithClientInfo;
  } catch (error) {
    console.error('[cashierApi] Error fetching all vehicles:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
    }
    throw handleApiError(error, 'Не удалось получить список автомобилей');
  }
};

/**
 * Получение всех активных сотрудников-мастеров магазина для кассира
 */
export const getActiveTechnicians = async (shopId: string): Promise<any[]> => {
  try {
    if (!shopId) {
      throw new Error('shopId обязателен для получения списка мастеров');
    }

    console.log('[cashierApi] Getting active technicians for shop:', shopId);

    // Обновленный путь API для получения сотрудников магазина через кассирский эндпоинт
    const apiUrl = `/manager/${shopId}/cashier/technicians`;
    console.log('[cashierApi] Request URL:', apiUrl);

    const { data } = await api.get(apiUrl);

    console.log('[cashierApi] Retrieved technicians count:', data.length);
    console.log(
      '[cashierApi] First technician (sample):',
      data.length > 0 ? data[0] : 'No technicians found'
    );
    console.log(
      '[cashierApi] Technician fields:',
      data.length > 0 ? Object.keys(data[0]) : 'No fields available'
    );

    // Убедимся, что каждый технический специалист имеет валидный ID
    const formattedData = data.map((tech: any) => ({
      ...tech,
      id: tech.id, // Убедимся, что ID присутствует
    }));

    return formattedData;
  } catch (error) {
    console.error('[cashierApi] Error getting technicians:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
    }
    throw handleApiError(error, 'Не удалось получить список мастеров');
  }
};

/**
 * Завершение услуги
 */
export const completeService = async (
  shopId: string,
  completeData: {
    serviceId: string;
    finalPrice: number;
    paymentMethod: string;
  }
): Promise<any> => {
  try {
    // Валидация finalPrice перед отправкой на сервер
    if (
      typeof completeData.finalPrice !== 'number' ||
      isNaN(completeData.finalPrice)
    ) {
      completeData.finalPrice = Number(completeData.finalPrice);
      if (isNaN(completeData.finalPrice)) {
        throw new Error('Итоговая цена услуги должна быть числом');
      }
    }

    // Проверка на положительное значение
    if (completeData.finalPrice < 0) {
      throw new Error('Итоговая цена услуги не может быть отрицательной');
    }

    console.log('[cashierApi] Completing service with data:', completeData);
    console.log('[cashierApi] Shop ID:', shopId);

    const { data } = await api.post(
      `/manager/${shopId}/cashier/service/complete`,
      completeData
    );

    console.log('[cashierApi] Service completed successfully:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error completing service:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось завершить услугу');
  }
};

/**
 * Получение завершённых услуг
 */
export const getCompletedServices = async (shopId: string): Promise<any[]> => {
  try {
    console.log('[cashierApi] Getting completed services for shop:', shopId);
    const { data } = await api.get(
      `/manager/${shopId}/cashier/services/completed`
    );
    console.log('[cashierApi] Retrieved completed services:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error getting completed services:', error);
    throw handleApiError(error, 'Не удалось загрузить завершенные услуги');
  }
};

/**
 * Отмена услуги
 */
export const cancelService = async (
  shopId: string,
  serviceId: string,
  reason: string
): Promise<any> => {
  try {
    console.log('[cashierApi] Cancelling service with data:', {
      shopId,
      serviceId,
      reason,
    });

    // Исправляем URL для использования эндпоинта менеджера для отмены услуги
    const { data } = await api.post(
      `/manager/services/shop/${shopId}/${serviceId}/cancel`,
      {
        notes: reason, // Сохраняем причину отмены в поле notes
      }
    );

    console.log('[cashierApi] Service cancelled successfully:', data);
    return data;
  } catch (error) {
    console.error('[cashierApi] Error cancelling service:', error);
    if (axios.isAxiosError(error)) {
      console.error('[cashierApi] Response status:', error.response?.status);
      console.error('[cashierApi] Response data:', error.response?.data);
      console.error('[cashierApi] Request config:', error.config);
    }
    throw handleApiError(error, 'Не удалось отменить услугу');
  }
};
