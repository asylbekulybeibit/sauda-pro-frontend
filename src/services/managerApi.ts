import { api } from './api';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { InventoryTransaction, TransactionType } from '@/types/inventory';
import { UserRoleDetails } from '@/types/role';
import { Invite } from '@/types/invite';
import { Report, ReportType, ReportFormat, ReportPeriod } from '@/types/report';
import { Promotion } from '@/types/promotion';
import { Supplier } from '@/types/supplier';
import { LabelTemplate } from '@/types/label';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import { RoleType } from '@/types/role';
import { Purchase } from '@/types/purchase';
import axios from 'axios';
import { Transfer } from '@/types/transfer';
import { Shop } from '@/types/shop';

interface ApiError {
  response: {
    data: {
      message: string;
      [key: string]: any;
    };
    status: number;
  };
}

interface GenerateLabelsRequest {
  shopId: string;
  templateId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface CreateTransferDto {
  fromShopId: string;
  toShopId: string;
  date: string;
  items: Array<{
    productId: number;
    quantity: number;
    comment?: string;
  }>;
  comment?: string;
}

// Методы для работы с товарами
export const getProducts = async (shopId: string): Promise<Product[]> => {
  try {
    const startTime = performance.now();
    console.log(
      `[${new Date().toISOString()}] Fetching products for shop ${shopId}`
    );

    // Добавляем уникальный идентификатор для отслеживания запроса
    const requestId = `prod-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    console.log(`Request ID: ${requestId}`);

    const response = await api.get(`/manager/products/shop/${shopId}`);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const count = response.data?.length || 0;

    console.log(
      `[${new Date().toISOString()}] Products fetched in ${duration}ms, count: ${count}, requestId: ${requestId}`
    );

    if (!response.data) {
      console.warn(
        `[${new Date().toISOString()}] No data received from products API, shopId: ${shopId}`
      );
      return [];
    }

    // Проверяем структуру полученных данных
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Проверяем наличие ключевых полей в первом элементе для диагностики
      const sampleProduct = response.data[0];
      console.log(
        `Sample product fields: id=${sampleProduct.id}, name=${sampleProduct.name}, quantity=${sampleProduct.quantity}`
      );
    }

    return response.data;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching products for shop ${shopId}:`,
      error
    );
    // Расширенная диагностика для axios ошибок
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.message}`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status text: ${error.response?.statusText}`);
      console.error(`Data:`, error.response?.data);
    }
    throw ApiErrorHandler.handle(error);
  }
};

export const createProduct = async (
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> => {
  try {
    const response = await api.post('/manager/products', data);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const updateProduct = async (
  id: string,
  data: Partial<Product>
): Promise<Product> => {
  try {
    const response = await api.patch(`/manager/products/${id}`, data);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/manager/products/${id}`);
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

// Методы для работы с категориями
export const getCategories = async (shopId: string): Promise<Category[]> => {
  try {
    const response = await api.get(`/manager/categories/shop/${shopId}`);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const createCategory = async (
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> => {
  try {
    const response = await api.post('/manager/categories', data);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const updateCategory = async (
  id: string,
  data: Partial<Category>
): Promise<Category> => {
  try {
    const response = await api.patch(`/manager/categories/${id}`, data);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await api.delete(`/manager/categories/${id}`);
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const getCategoryById = async (id: string): Promise<Category> => {
  try {
    const response = await api.get(`/manager/categories/${id}`);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

// Методы для работы со складом
export const getInventory = async (
  shopId: string
): Promise<InventoryTransaction[]> => {
  try {
    const startTime = performance.now();
    console.log(
      `[${new Date().toISOString()}] Fetching inventory transactions for shop ${shopId}`
    );

    // Добавляем уникальный идентификатор для отслеживания запроса
    const requestId = `inv-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    console.log(`Request ID: ${requestId}`);

    const response = await api.get(`/manager/inventory/transactions/${shopId}`);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const count = response.data?.length || 0;

    console.log(
      `[${new Date().toISOString()}] Inventory transactions fetched in ${duration}ms, count: ${count}, requestId: ${requestId}`
    );

    if (!response.data) {
      console.warn(
        `[${new Date().toISOString()}] No data received from inventory transactions API, shopId: ${shopId}`
      );
      return [];
    }

    // Проверяем структуру полученных данных для диагностики
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Если есть данные, проверяем наличие транзакций инвентаризации
      const adjustments = response.data.filter((t) => t.type === 'ADJUSTMENT');
      console.log(
        `Found ${adjustments.length} ADJUSTMENT transactions out of ${count} total`
      );

      // Выводим последние 3 транзакции для диагностики
      if (response.data.length > 0) {
        const recentTransactions = response.data.slice(0, 3);
        console.log(
          `Last 3 transactions types: ${recentTransactions
            .map((t) => t.type)
            .join(', ')}`
        );
      }
    }

    return response.data;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching inventory for shop ${shopId}:`,
      error
    );
    // Расширенная диагностика для axios ошибок
    if (axios.isAxiosError(error)) {
      console.error(`Axios error: ${error.message}`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status text: ${error.response?.statusText}`);
      console.error(`Data:`, error.response?.data);
    }
    throw ApiErrorHandler.handle(error);
  }
};

export const createInventoryTransaction = async (data: {
  shopId: string;
  type: TransactionType;
  productId: string;
  quantity: number;
  price?: number;
  note?: string;
  description?: string;
  comment?: string;
  metadata?: Record<string, any>;
}): Promise<InventoryTransaction> => {
  const response = await api.post('/manager/inventory/transactions', data);
  return response.data;
};

export const updateInventoryTransaction = async (
  id: string,
  data: Partial<InventoryTransaction>
): Promise<InventoryTransaction> => {
  try {
    const response = await api.patch(
      `/manager/inventory/transactions/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const deleteInventoryTransaction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/manager/inventory/transactions/${id}`);
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const getLowStockProducts = async (
  shopId: string
): Promise<Product[]> => {
  const response = await api.get(`/manager/inventory/low-stock/${shopId}`);
  return response.data;
};

// Методы для работы с персоналом
export const getStaff = async (shopId: string): Promise<UserRoleDetails[]> => {
  try {
    const response = await api.get(`/manager/staff/shop/${shopId}`);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const deactivateStaff = async (
  staffId: string,
  shopId: string
): Promise<void> => {
  try {
    await api.patch(
      `/manager/staff/shop/${shopId}/staff/${staffId}/deactivate`
    );
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

interface CreateInviteDto {
  phone: string;
  role: RoleType;
}

interface InviteStats {
  total: number;
  activeInvites: number;
  acceptedInvites: number;
  rejectedInvites: number;
  cancelledInvites: number;
  byStatus: Record<string, number>;
  byRole: Record<string, number>;
  averageAcceptanceTime: number | null;
}

// Обновленная функция для получения инвайтов по warehouse
export async function getInvites(warehouseId: string): Promise<Invite[]> {
  try {
    console.log('Getting invites for warehouse:', warehouseId);
    // URL должен запрашивать инвайты для склада, а не магазина
    const { data } = await api.get(
      `/manager/staff/warehouse/${warehouseId}/invites`
    );
    return data;
  } catch (error) {
    // Обработка ошибок, которые могут возникнуть, если API не найден
    console.error('Error getting invites:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Пробуем альтернативный URL, для обратной совместимости
      const { data } = await api.get(
        `/manager/warehouse/invites/${warehouseId}`
      );
      return data;
    }
    throw ApiErrorHandler.handle(error);
  }
}

export async function getInviteStats(
  warehouseId: string
): Promise<InviteStats> {
  try {
    const { data } = await api.get(
      `/manager/staff/warehouse/${warehouseId}/invites/stats`
    );
    return data;
  } catch (error) {
    // Обработка ошибок, которые могут возникнуть, если API не найден
    console.error('Error getting invite stats:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Пробуем альтернативный URL, для обратной совместимости
      const { data } = await api.get(
        `/manager/warehouse/invites/${warehouseId}/stats`
      );
      return data;
    }
    throw ApiErrorHandler.handle(error);
  }
}

export async function createInvite(
  warehouseId: string,
  dto: CreateInviteDto
): Promise<Invite> {
  try {
    console.log('Creating invite for warehouse:', warehouseId, dto);
    // URL должен создавать инвайты для склада, а не магазина
    const { data } = await api.post(
      `/manager/staff/warehouse/${warehouseId}/invites`,
      dto
    );
    return data;
  } catch (error) {
    // Обработка ошибок, которые могут возникнуть, если API не найден
    console.error('Error creating invite:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Пробуем альтернативный URL, для обратной совместимости
      const { data } = await api.post(
        `/manager/warehouse/invites/${warehouseId}`,
        dto
      );
      return data;
    }
    throw ApiErrorHandler.handle(error);
  }
}

export async function cancelInvite(
  warehouseId: string,
  inviteId: string
): Promise<Invite> {
  try {
    console.log('Cancelling invite:', inviteId, 'for warehouse:', warehouseId);
    // URL должен отменять инвайты для склада, а не магазина
    const { data } = await api.post(
      `/manager/staff/warehouse/${warehouseId}/invites/${inviteId}/cancel`
    );
    return data;
  } catch (error) {
    // Обработка ошибок, которые могут возникнуть, если API не найден
    console.error('Error cancelling invite:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Пробуем альтернативный URL, для обратной совместимости
      const { data } = await api.post(
        `/manager/warehouse/invites/${warehouseId}/${inviteId}/cancel`
      );
      return data;
    }
    throw ApiErrorHandler.handle(error);
  }
}

export async function resendInvite(
  warehouseId: string,
  inviteId: string
): Promise<Invite> {
  try {
    // URL должен повторно отправлять инвайты для склада, а не магазина
    const { data } = await api.post(
      `/manager/staff/warehouse/${warehouseId}/invites/${inviteId}/resend`
    );
    return data;
  } catch (error) {
    // Обработка ошибок, которые могут возникнуть, если API не найден
    console.error('Error resending invite:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Пробуем альтернативный URL, для обратной совместимости
      const { data } = await api.post(
        `/manager/warehouse/invites/${warehouseId}/${inviteId}/resend`
      );
      return data;
    }
    throw ApiErrorHandler.handle(error);
  }
}

// Методы для работы с отчетами
export const createReport = async (data: {
  shopId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  filters: {
    categories?: string[];
    products?: string[];
    staff?: string[];
    promotions?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}): Promise<Report> => {
  try {
    const response = await api.post('/manager/reports', data);
    return response.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

export const getReports = async (shopId: string): Promise<Report[]> => {
  const response = await api.get(`/manager/reports/shop/${shopId}`);
  return response.data;
};

export const updateReport = async (data: {
  id: string;
  shopId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  filters: {
    categories?: string[];
    products?: string[];
    staff?: string[];
    promotions?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}): Promise<Report> => {
  try {
    const { id, ...reportData } = data;
    const response = await api.patch(`/manager/reports/${id}`, reportData);
    return response.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

export const deleteReport = async (
  id: string,
  shopId: string
): Promise<void> => {
  await api.delete(`/manager/reports/${id}?shopId=${shopId}`);
};

export const downloadReport = async (
  id: string,
  shopId: string
): Promise<{
  data: Blob;
  type: string;
  filename: string;
}> => {
  const response = await api.get(
    `/manager/reports/${id}/download?shopId=${shopId}`,
    {
      responseType: 'blob',
    }
  );
  const contentType = response.headers['content-type'];
  const filename =
    response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/["']/g, '') || 'report';
  return {
    data: response.data,
    type: contentType,
    filename,
  };
};

export const getReportDetails = async (
  reportId: string
): Promise<{
  summary: Record<string, any>;
  details: Array<Record<string, any>>;
  [key: string]: any;
}> => {
  try {
    const response = await api.get(`/manager/reports/${reportId}/details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report details:', error);
    throw ApiErrorHandler.handle(error);
  }
};

// Методы для работы с акциями
export const getPromotions = async (shopId: string): Promise<Promotion[]> => {
  const response = await api.get(`/manager/promotions/shop/${shopId}`);
  return response.data;
};

export const createPromotion = async (data: any): Promise<Promotion> => {
  try {
    // Убедимся, что поле discount существует и имеет числовое значение
    const isPercentage = data.type === 'percentage';
    const discountValue = isPercentage ? Number(data.value) : 0;

    // Формируем правильный payload
    const payload = {
      name: data.name,
      description: data.description || '',
      value: Number(data.value),
      type: data.type,
      target: data.target,
      startDate: data.startDate,
      endDate: data.endDate,
      productIds: data.productIds || [],
      shopId: data.shopId,
      // Явно передаем discount отдельно
      discount: discountValue,
    };

    console.log(
      'API createPromotion payload:',
      JSON.stringify(payload, null, 2)
    );

    // Пробуем альтернативный эндпоинт (с /shop/{shopId})
    const url = `/manager/promotions`;
    const response = await api.post(url, payload);
    return response.data;
  } catch (error) {
    console.error('Error in createPromotion:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 500) {
        // Попытаемся отправить запрос специальным образом через query-параметры
        try {
          const payload = {
            ...data,
            value: Number(data.value),
            discount: Number(data.value), // Для совместимости устанавливаем discount = value
          };

          // Формируем специальный URL с параметрами
          const url = `/manager/promotions/create-with-discount`;
          console.log('Trying alternative endpoint:', url);

          const response = await api.post(url, payload);
          return response.data;
        } catch (fallbackError) {
          console.error('Alternative endpoint also failed:', fallbackError);
          throw fallbackError;
        }
      }
    }

    throw error;
  }
};

export const updatePromotion = async (
  id: string,
  data: Partial<Promotion>
): Promise<Promotion> => {
  // Убедимся, что поле discount существует и имеет числовое значение
  const isPercentage = data.type === 'percentage';

  // Явно задаем значение discount, чтобы не было NULL
  const discountValue = isPercentage ? Number(data.value || 0) : 0;

  const payload = {
    ...data,
    value: data.value !== undefined ? Number(data.value) : undefined, // Преобразуем в число если есть
    discount: discountValue, // Явно установим значение discount
  };

  console.log('API updatePromotion payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await api.patch(`/manager/promotions/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error in updatePromotion:', error);
    console.error('Request payload was:', JSON.stringify(payload, null, 2));
    throw error;
  }
};

export const deletePromotion = async (
  id: string,
  shopId?: string
): Promise<void> => {
  try {
    await api.delete(
      `/manager/promotions/${id}${shopId ? `?shopId=${shopId}` : ''}`
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as ApiError;
      throw new Error(
        apiError.response.data.message || 'Failed to delete promotion'
      );
    }
    throw new Error('An unexpected error occurred');
  }
};

// Методы для работы с поставщиками
export const getSuppliers = async (shopId: string): Promise<Supplier[]> => {
  try {
    console.log(`Fetching suppliers for shop ${shopId}`);
    // Используем формат URL, соответствующий бэкенду
    const url = `/manager/suppliers/shop/${shopId}`;
    console.log(`Request URL: ${url}`);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const createSupplier = async (
  data: any,
  shopId?: string
): Promise<Supplier> => {
  try {
    console.log(`Creating supplier in shop ${shopId}`);
    // Используем формат URL, соответствующий бэкенду
    const url = `/manager/suppliers`;
    console.log(`Request URL: ${url}`);
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const updateSupplier = async (
  id: string,
  data: Partial<Supplier>,
  shopId?: string
): Promise<Supplier> => {
  try {
    console.log(`Updating supplier ${id} in shop ${shopId}`);
    // Используем формат URL, соответствующий бэкенду
    const url = shopId
      ? `/manager/suppliers/shop/${shopId}/supplier/${id}`
      : `/manager/suppliers/${id}`;
    console.log(`Request URL: ${url}`);
    const response = await api.patch(url, data);
    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const deleteSupplier = async (
  id: string,
  shopId: string
): Promise<void> => {
  try {
    console.log(`Deleting supplier ${id} from shop ${shopId}`);
    // Используем формат URL, соответствующий бэкенду
    const url = `/manager/suppliers/shop/${shopId}/supplier/${id}`;
    console.log(`Request URL: ${url}`);
    await api.delete(url);
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getSupplierById = async (
  id: string,
  shopId: string
): Promise<Supplier> => {
  try {
    console.log(`Fetching supplier with id ${id} for shop ${shopId}`);
    // Используем формат URL, соответствующий бэкенду
    const response = await api.get(
      `/manager/suppliers/shop/${shopId}/supplier/${id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getSupplierProducts = async (
  supplierId: string,
  shopId?: string
): Promise<Product[]> => {
  try {
    console.log(
      `Fetching products for supplier ${supplierId} in shop ${shopId}`
    );

    // Используем формат URL, соответствующий бэкенду
    const url = `/manager/suppliers/${supplierId}/products?shopId=${shopId}`;

    console.log(`Request URL: ${url}`);
    const response = await api.get(url);

    // Обрабатываем данные, чтобы убедиться, что цены - это числа
    const products = response.data.map((product: any) => {
      if (product.price !== undefined) {
        // Преобразуем цену в число, если она не является числом
        const price =
          typeof product.price === 'string'
            ? parseFloat(product.price)
            : typeof product.price === 'number'
            ? product.price
            : 0;

        return {
          ...product,
          price,
        };
      }
      return product;
    });

    console.log('Processed products:', products);

    return products;
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const addProductToSupplier = async (
  supplierId: string,
  productId: string,
  data: { price: number; minimumOrder?: number },
  shopId?: string
): Promise<void> => {
  try {
    console.log(
      `Adding product ${productId} to supplier ${supplierId} in shop ${shopId}`
    );

    // Убедимся, что цена - это число
    const processedData = {
      ...data,
      price:
        typeof data.price === 'string' ? parseFloat(data.price) : data.price,
    };

    console.log('Processed data:', processedData);
    console.log('Price type:', typeof processedData.price);

    // Используем формат URL, соответствующий бэкенду
    const url = `/manager/suppliers/${supplierId}/products/${productId}?shopId=${shopId}`;

    console.log(`Request URL: ${url}`);
    await api.post(url, processedData);
  } catch (error) {
    console.error('Error adding product to supplier:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const removeProductFromSupplier = async (
  supplierId: string,
  productId: string,
  shopId?: string
): Promise<void> => {
  try {
    console.log(
      `Removing product ${productId} from supplier ${supplierId} in shop ${shopId}`
    );

    // Используем формат URL, соответствующий бэкенду
    const url = `/manager/suppliers/${supplierId}/products/${productId}?shopId=${shopId}`;

    console.log(`Request URL: ${url}`);
    await api.delete(url);
  } catch (error) {
    console.error('Error removing product from supplier:', error);
    throw ApiErrorHandler.handle(error);
  }
};

// Методы для работы с этикетками
export const getLabelTemplates = async (
  shopId: string
): Promise<LabelTemplate[]> => {
  try {
    const response = await api.get(
      `/manager/labels/templates?shopId=${shopId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting label templates:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const createLabelTemplate = async (
  data: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LabelTemplate> => {
  try {
    const response = await api.post('/manager/labels/templates', data);
    return response.data;
  } catch (error) {
    console.error('Error creating label template:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const updateLabelTemplate = async (
  id: string,
  data: Partial<LabelTemplate>
): Promise<LabelTemplate> => {
  try {
    const response = await api.patch(`/manager/labels/templates/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating label template:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const deleteLabelTemplate = async (id: string): Promise<void> => {
  try {
    await api.delete(`/manager/labels/templates/${id}`);
  } catch (error) {
    console.error('Error deleting label template:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const generateLabels = async (
  data: GenerateLabelsRequest
): Promise<Blob> => {
  try {
    const response = await api.post('/manager/labels/generate', data, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error generating labels:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const previewLabel = async (
  templateId: string,
  productId: string
): Promise<Blob> => {
  try {
    // Получаем shopId из URL
    const shopId = window.location.pathname.split('/')[2];

    const response = await api.get(
      `/manager/labels/preview?shopId=${shopId}&templateId=${templateId}&productId=${productId}`,
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error('Error previewing label:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getDefaultLabelTemplates = async (): Promise<LabelTemplate[]> => {
  try {
    const response = await api.get('/manager/labels/default-templates');
    return response.data;
  } catch (error) {
    console.error('Error getting default label templates:', error);
    throw ApiErrorHandler.handle(error);
  }
};

// Методы для работы с историей цен
export const getPriceHistory = async (
  productId: string,
  startDate?: string,
  endDate?: string,
  shopId?: string
): Promise<PriceHistory[]> => {
  console.log('getPriceHistory called with:', {
    productId,
    startDate,
    endDate,
    shopId,
  });
  try {
    const url = shopId
      ? `/manager/price-history/shop/${shopId}`
      : `/manager/price-history/product/${productId}`;
    const params = {
      ...(startDate && endDate ? { startDate, endDate } : {}),
      ...(shopId && { productId }),
    };
    console.log('getPriceHistory request:', { url, params });

    const response = await api.get(url, { params });
    console.log('getPriceHistory response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getPriceHistory error:', error);
    throw error;
  }
};

export const addPriceChange = async (
  data: Omit<PriceHistory, 'id' | 'createdAt'>
): Promise<PriceHistory> => {
  try {
    // Проверяем данные перед отправкой
    console.log('addPriceChange - данные запроса:', data);

    // Убедимся, что oldPrice и newPrice - числа
    const payload = {
      ...data,
      oldPrice: Number(data.oldPrice),
      newPrice: Number(data.newPrice),
    };

    console.log('addPriceChange - payload после преобразования:', payload);

    const response = await api.post('/manager/price-history', payload);
    return response.data;
  } catch (error) {
    console.error('Error adding price change:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw ApiErrorHandler.handle(error);
  }
};

export const getPriceChangesReport = async (
  shopId: string,
  startDate?: string,
  endDate?: string
): Promise<PriceHistory[]> => {
  try {
    console.log('[managerApi] getPriceChangesReport called with:', {
      shopId,
      startDate,
      endDate,
    });

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/manager/price-history/report/${shopId}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    console.log('[managerApi] Making request to:', url);

    const response = await api.get(url);
    console.log('[managerApi] getPriceChangesReport response:', {
      status: response.status,
      dataLength: response.data?.length,
      firstRecord: response.data?.[0],
    });

    return response.data;
  } catch (error) {
    console.error('[managerApi] Error in getPriceChangesReport:', error);
    throw ApiErrorHandler.handle(error);
  }
};

// Хелпер для проверки ошибок
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  );
};

export interface CreatePurchaseRequest {
  warehouseId: string;
  supplierId?: string | null;
  invoiceNumber?: string | null;
  date: string;
  comment?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    partialQuantity?: number;
    serialNumber?: string;
    expiryDate?: string;
    comment?: string;
  }>;
  updatePrices?: boolean;
  updatePurchasePrices?: boolean;
  createLabels?: boolean;
  checkDuplicates?: boolean;
  markup?: number;
  markupType?: 'percentage' | 'fixed';
  status?: 'draft' | 'completed' | 'cancelled';
}

export interface PurchaseResponse {
  id: number;
  date: string;
  invoiceNumber: string;
  supplier: {
    name: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  comment?: string;
}

export const createPurchase = async (
  data: CreatePurchaseRequest
): Promise<PurchaseResponse> => {
  console.log(
    '[CREATE PURCHASE] Запрос на создание прихода:',
    JSON.stringify(data, null, 2)
  );

  // Создаем копию данных для возможной модификации
  const purchaseData = { ...data };

  // Обязательно проверим и установим warehouseId
  if (!data.warehouseId) {
    console.error('[CREATE PURCHASE] ОШИБКА: Отсутствует warehouseId');
    throw new Error('Не указан ID склада (warehouseId)');
  }

  // Если для товаров не указаны цены, добавим их
  if (
    Array.isArray(purchaseData.items) &&
    purchaseData.items.length > 0 &&
    !purchaseData.items.every((item) => item.price !== undefined)
  ) {
    console.log('[CREATE PURCHASE] Установка недостающих цен для товаров');
    purchaseData.items = purchaseData.items.map((item) => ({
      ...item,
      price: item.price ?? 0,
    }));
  }

  // Дополнительное логирование для отладки
  console.log('[CREATE PURCHASE] Подготовленные данные:', {
    warehouseId: purchaseData.warehouseId,
    supplierId: purchaseData.supplierId,
    invoiceNumber: purchaseData.invoiceNumber,
    date: purchaseData.date,
    itemsCount: purchaseData.items?.length || 0,
  });

  // Массив возможных URL для запроса
  const possibleUrls = [
    '/manager/purchases', // Сначала пробуем основной маршрут
    `/manager/purchases/${purchaseData.warehouseId}`,
    `/manager/purchases/warehouse/${purchaseData.warehouseId}`,
    `/manager/warehouse/purchases`,
    `/manager/warehouse/purchases/${purchaseData.warehouseId}`,
    `/manager/warehouses/${purchaseData.warehouseId}/purchases`,
    `/manager/purchases/create`,
    '/manager/purchases/no-supplier', // Последним пробуем специальный маршрут для прихода без поставщика
  ];

  // Варианты данных в порядке уменьшения полноты
  const dataVariants = [
    purchaseData, // Полные данные

    // Без поставщика
    {
      ...purchaseData,
      supplierId: null,
    },

    // Без поставщика и номера накладной
    {
      ...purchaseData,
      supplierId: null,
      invoiceNumber: null,
    },

    // Без дополнительных опций
    {
      warehouseId: purchaseData.warehouseId,
      supplierId: purchaseData.supplierId,
      invoiceNumber: purchaseData.invoiceNumber,
      date: purchaseData.date,
      comment: purchaseData.comment,
      items: purchaseData.items,
    },

    // Только основные данные
    {
      warehouseId: purchaseData.warehouseId,
      date: purchaseData.date,
      items: purchaseData.items,
    },

    // Без товаров, только обязательные поля
    {
      warehouseId: purchaseData.warehouseId,
      date: purchaseData.date,
      status: 'draft',
    },

    // Абсолютный минимум
    {
      warehouseId: purchaseData.warehouseId,
    },
  ];

  // Попробуем все комбинации URL и данных
  let lastError = null;
  for (const url of possibleUrls) {
    for (const dataVariant of dataVariants) {
      try {
        console.log(
          `[CREATE PURCHASE] Trying URL: ${url} with data variant:`,
          dataVariant
        );
        const response = await api.post(url, dataVariant);
        console.log('[CREATE PURCHASE] Success response:', response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        console.log(`[CREATE PURCHASE] Error with URL ${url}:`, error);
        // Продолжаем со следующим вариантом
      }
    }
  }

  // Если все попытки не удались, выбрасываем ошибку с информацией
  console.error(
    '[CREATE PURCHASE] All attempts failed. Last error:',
    lastError
  );

  throw new Error(
    `Не удалось создать приход. Проверьте соединение с сервером и правильность данных склада (warehouseId: ${purchaseData.warehouseId})`
  );
};

export async function createPurchaseDraft(data: {
  shopId: string;
  supplierId?: string;
  invoiceNumber?: string;
  date?: string;
  comment?: string;
  items: any[];
  updatePrices?: boolean;
  updatePurchasePrices?: boolean;
  createLabels?: boolean;
  status: string;
}) {
  console.log('Сохранение черновика:', data);
  try {
    // Если дата не предоставлена или неполная, используем текущую дату и время
    const purchaseData = {
      ...data,
      date: data.date || new Date().toISOString(), // Используем полный ISO формат
      status: 'draft', // Всегда устанавливаем статус draft при создании черновика
    };

    const response = await api.post('/manager/purchases', purchaseData);
    console.log('Ответ от сервера при создании черновика:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании черновика:', error);
    throw ApiErrorHandler.handle(error);
  }
}

export async function updatePurchaseDraft(
  id: string,
  data: {
    shopId: string;
    supplierId?: string;
    invoiceNumber?: string;
    date?: string;
    comment?: string;
    items: any[];
    updatePrices?: boolean;
    updatePurchasePrices?: boolean;
    createLabels?: boolean;
    status: string;
  }
) {
  console.log('=== НАЧАЛО ОБНОВЛЕНИЯ ЧЕРНОВИКА В API ===');
  console.log('ID черновика для обновления:', id);
  console.log('Входящие данные:', JSON.stringify(data, null, 2));

  try {
    // Проверяем наличие обязательных полей
    if (!data.shopId) {
      console.error('Отсутствует обязательное поле shopId');
      throw new Error('shopId is required');
    }

    if (!id) {
      console.error('Отсутствует ID черновика');
      throw new Error('Draft ID is required');
    }

    // Формируем данные для отправки
    const payload = {
      ...data,
      status: 'draft', // Всегда сохраняем как черновик при обновлении
      // Убеждаемся что все поля имеют правильный формат
      supplierId: data.supplierId || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      date: data.date || undefined,
      items: Array.isArray(data.items) ? data.items : [],
    };

    console.log(
      'Подготовленные данные для отправки:',
      JSON.stringify(payload, null, 2)
    );

    // Формируем URL для запроса
    const url = `/manager/purchases/${data.shopId}/${id}/draft`;
    console.log('URL для обновления:', url);

    // Отправляем запрос
    console.log('Отправка PATCH запроса...');
    const response = await api.patch(url, payload);
    console.log('Ответ от сервера:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('=== ОШИБКА ПРИ ОБНОВЛЕНИИ ЧЕРНОВИКА В API ===');
    if (axios.isAxiosError(error)) {
      console.error('Тип ошибки: AxiosError');
      console.error('Статус ответа:', error.response?.status);
      console.error('Данные ответа:', error.response?.data);
      console.error('URL запроса:', error.config?.url);
      console.error('Данные запроса:', error.config?.data);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    } else {
      console.error('Тип ошибки:', typeof error);
      console.error('Содержимое ошибки:', error);
    }
    throw ApiErrorHandler.handle(error);
  } finally {
    console.log('=== ЗАВЕРШЕНИЕ ОБНОВЛЕНИЯ ЧЕРНОВИКА В API ===');
  }
}

export async function completePurchaseDraft(id: string) {
  console.log('Завершение черновика:', id);
  try {
    const response = await api.patch(`/manager/purchases/${id}/status`, {
      status: 'completed',
    });
    console.log('Ответ от сервера при завершении черновика:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при завершении черновика:', error);
    throw ApiErrorHandler.handle(error);
  }
}

export const updatePurchaseStatus = async (
  shopId: string,
  purchaseId: string,
  status: 'draft' | 'completed' | 'cancelled'
): Promise<Purchase> => {
  try {
    const response = await api.patch(
      `/manager/purchases/${shopId}/${purchaseId}/status`,
      {
        status,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating purchase status:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getPurchaseById = async (
  id: string,
  warehouseId?: string
): Promise<Purchase> => {
  console.log('[getPurchaseById] ID:', id, 'warehouseId:', warehouseId);

  if (!id) {
    console.error('[getPurchaseById] Missing required purchase ID');
    throw new Error('Missing required purchase ID');
  }

  // Если warehouseId не передан, выбрасываем ошибку
  if (!warehouseId) {
    console.error('[getPurchaseById] Missing required warehouseId');
    throw new Error('Missing required warehouseId parameter');
  }

  // Массив возможных форматов URL для запроса
  const possibleUrls = [
    // Основной формат маршрута из App.tsx
    `/manager/${warehouseId}/warehouse/purchases/${id}`,
    // Альтернативные форматы для совместимости с API
    `/manager/purchases/${id}?warehouseId=${warehouseId}`,
    `/manager/purchases/warehouse/${warehouseId}/purchase/${id}`,
    `/manager/warehouses/${warehouseId}/purchases/${id}`,
    `/manager/purchases/${warehouseId}/${id}`,
    `/manager/warehouse/purchases/${warehouseId}/${id}`,
  ];

  let lastError = null;

  // Пробуем каждый формат URL по очереди
  for (const url of possibleUrls) {
    try {
      console.log(`[getPurchaseById] Trying URL: ${url}`);
      const { data } = await api.get(url);
      console.log(
        '[getPurchaseById] Purchase loaded successfully with URL:',
        url
      );
      return data;
    } catch (error) {
      console.log(`[getPurchaseById] Error with URL ${url}:`, error);
      lastError = error;
      // Продолжаем со следующим URL
    }
  }

  // Если все попытки не удались, выбрасываем последнюю ошибку
  console.error(
    '[getPurchaseById] All attempts to fetch purchase failed:',
    lastError
  );
  throw ApiErrorHandler.handle(lastError);
};

export const getPurchases = async (
  warehouseId: string
): Promise<Purchase[]> => {
  try {
    console.log('Fetching purchases for warehouse ID:', warehouseId);

    if (!warehouseId) {
      console.error('Missing warehouse ID for getPurchases call');
      throw new Error('Missing warehouse ID for getPurchases call');
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(warehouseId)) {
      console.error('Invalid warehouse ID format:', warehouseId);
      throw new Error('Invalid warehouse ID format');
    }

    const url = `/manager/purchases/${warehouseId}`;
    console.log('Purchases API request URL:', url);

    const response = await api.get(url);
    console.log(
      'Purchases data fetched successfully, count:',
      response.data?.length || 0
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const deletePurchase = async (
  warehouseId: string,
  purchaseId: string
): Promise<void> => {
  try {
    await api.delete(`/manager/purchases/${warehouseId}/${purchaseId}`);
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const getTransfers = async (shopId: string): Promise<Transfer[]> => {
  const response = await api.get(`/manager/transfers/${shopId}`);
  return response.data;
};

export const createTransfer = async (
  data: CreateTransferDto
): Promise<Transfer> => {
  const response = await api.post('/manager/transfers', data);
  return response.data;
};

export const updateTransferStatus = async (
  id: number,
  status: Transfer['status']
): Promise<Transfer> => {
  const response = await api.patch(`/manager/transfers/${id}/status`, {
    status,
  });
  return response.data;
};

export const deleteTransfer = async (id: number): Promise<void> => {
  await api.delete(`/manager/transfers/${id}`);
};

export const getSales = async (warehouseId: string) => {
  const response = await api.get<InventoryTransaction[]>(
    `/manager/inventory/sales/${warehouseId}`
  );
  return response.data;
};

export const getReturns = async (warehouseId: string) => {
  const response = await api.get<InventoryTransaction[]>(
    `/manager/inventory/returns/${warehouseId}`
  );
  return response.data;
};

export const getWriteOffs = async (
  warehouseId: string
): Promise<InventoryTransaction[]> => {
  console.log('Calling getWriteOffs with warehouseId:', warehouseId);
  try {
    const response = await api.get<InventoryTransaction[]>(
      `/manager/inventory/write-offs/${warehouseId}`
    );
    console.log('Write-offs API response:', response);
    return response.data;
  } catch (error) {
    console.error('Error in getWriteOffs:', error);
    throw error;
  }
};

// Методы для работы с магазином
export const getManagerShop = async (shopId: string): Promise<Shop> => {
  try {
    if (!shopId) {
      console.error('getManagerShop вызван без ID магазина');
      throw new Error('Missing shop ID');
    }

    // Валидация формата UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(shopId)) {
      console.error(
        'getManagerShop вызван с некорректным ID магазина:',
        shopId
      );
      throw new Error('Invalid shop ID format');
    }

    console.log('Fetching shop data for ID:', shopId);
    try {
      const response = await api.get(`/manager/shops/${shopId}`);
      console.log('Shop data fetched successfully:', response.data);

      // Создаем минимальный объект Shop на основе данных, полученных от сервера
      // Менеджер получает доступ только к своему складу, а не ко всему магазину
      return {
        id: shopId,
        name: response.data.shopName || 'Неизвестный магазин',
        warehouse: response.data.warehouse || null,
        // Добавляем остальные поля с значениями по умолчанию или из данных
        type: '',
        address: '',
        isActive: true,
      };
    } catch (error) {
      console.error('Error in API request for shop data:', error);

      // Запрашиваем данные о складе менеджера напрямую
      console.log('Falling back to warehouse data fetch');

      // Попробуем получить данные текущего склада из роли менеджера
      const roleResponse = await api.get('/profile');
      const managerRole = roleResponse.data.roles.find(
        (r) => r.type === 'manager' && r.isActive
      );

      if (managerRole && managerRole.warehouse) {
        console.log(
          'Found manager warehouse from profile:',
          managerRole.warehouse
        );

        // Используем данные склада из профиля
        return {
          id: shopId, // Используем переданный ID магазина
          name: managerRole.shop?.name || 'Магазин',
          warehouse: {
            id: managerRole.warehouse.id,
            name: managerRole.warehouse.name,
            address: managerRole.warehouse.address,
          },
          type: '',
          address: '',
          isActive: true,
        };
      }

      // Если все методы не сработали, возвращаем базовый объект
      return {
        id: shopId,
        name: 'Магазин',
        warehouse: null,
        type: '',
        address: '',
        isActive: true,
      };
    }
  } catch (error) {
    console.error('Error in getManagerShop:', error);

    // Вместо выбрасывания ошибки возвращаем заглушку
    return {
      id: shopId,
      name: 'Магазин',
      warehouse: null,
      type: '',
      address: '',
      isActive: true,
    };
  }
};

// Специальная функция для создания прихода без поставщика
export const createPurchaseWithoutSupplier = async (
  data: Omit<CreatePurchaseRequest, 'supplierId'>
): Promise<PurchaseResponse> => {
  console.log(
    '[CREATE PURCHASE WITHOUT SUPPLIER] Запрос на создание прихода без поставщика:',
    data
  );

  // Убедимся, что warehouseId указан
  if (!data.warehouseId) {
    console.error(
      '[CREATE PURCHASE WITHOUT SUPPLIER] ОШИБКА: Отсутствует warehouseId'
    );
    throw new Error('Не указан ID склада (warehouseId)');
  }

  // Создаем модифицированные данные без поставщика
  const modifiedData: CreatePurchaseRequest = {
    ...data,
    supplierId: null, // Явно указываем null для supplierId
  };

  // Используем существующую функцию createPurchase
  return createPurchase(modifiedData);
};

// Employees (Service Staff) API
export const getEmployees = async (shopId: string) => {
  const { data } = await api.get(`/manager/employees/shop/${shopId}`);
  return data;
};

export const getActiveEmployees = async (shopId: string) => {
  const { data } = await api.get(`/manager/employees/shop/${shopId}/active`);
  return data;
};

export const getEmployee = async (shopId: string, employeeId: string) => {
  const { data } = await api.get(
    `/manager/employees/shop/${shopId}/${employeeId}`
  );
  return data;
};

export const createEmployee = async (shopId: string, employeeData: any) => {
  const { data } = await api.post(
    `/manager/employees/shop/${shopId}`,
    employeeData
  );
  return data;
};

export const updateEmployee = async (
  shopId: string,
  employeeId: string,
  employeeData: any
) => {
  const { data } = await api.patch(
    `/manager/employees/shop/${shopId}/${employeeId}`,
    employeeData
  );
  return data;
};

export const removeEmployee = async (shopId: string, employeeId: string) => {
  const { data } = await api.delete(
    `/manager/employees/shop/${shopId}/${employeeId}`
  );
  return data;
};

// Clients API
export const getClients = async (shopId: string) => {
  const { data } = await api.get(`/manager/clients/shop/${shopId}`);
  return data;
};

export const getActiveClients = async (shopId: string) => {
  const { data } = await api.get(`/manager/clients/shop/${shopId}/active`);
  return data;
};

export const getClient = async (shopId: string, clientId: string) => {
  const { data } = await api.get(`/manager/clients/shop/${shopId}/${clientId}`);
  return data;
};

export const createClient = async (shopId: string, clientData: any) => {
  const { data } = await api.post(
    `/manager/clients/shop/${shopId}`,
    clientData
  );
  return data;
};

export const updateClient = async (
  shopId: string,
  clientId: string,
  clientData: any
) => {
  const { data } = await api.patch(
    `/manager/clients/shop/${shopId}/${clientId}`,
    clientData
  );
  return data;
};

export const removeClient = async (shopId: string, clientId: string) => {
  const { data } = await api.delete(
    `/manager/clients/shop/${shopId}/${clientId}`
  );
  return data;
};

// Добавляем функцию для получения списка складов магазина
export const getWarehouses = async (shopId: string) => {
  try {
    console.log(
      '[GET WAREHOUSES] Запрос на получение списка складов для магазина:',
      shopId
    );

    // Проверка на api перед запросом
    if (!api) {
      console.error('[GET WAREHOUSES] КРИТИЧЕСКАЯ ОШИБКА: api не определен');
      return [];
    }

    // Проверка на наличие shopId
    if (!shopId) {
      console.error('[GET WAREHOUSES] ОШИБКА: Отсутствует shopId');
      return [];
    }

    const data = await api.get(`/warehouses/shop/${shopId}`);
    console.log('[GET WAREHOUSES] Получены данные:', data);
    return data;
  } catch (error) {
    console.error('[GET WAREHOUSES] Ошибка:', error);
    throw error;
  }
};
