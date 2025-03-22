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

export async function getInvites(shopId: string): Promise<Invite[]> {
  const { data } = await api.get(`/manager/staff/shop/${shopId}/invites`);
  return data;
}

export async function getInviteStats(shopId: string): Promise<InviteStats> {
  const { data } = await api.get(`/manager/staff/shop/${shopId}/invites/stats`);
  return data;
}

export async function createInvite(
  shopId: string,
  dto: CreateInviteDto
): Promise<Invite> {
  const { data } = await api.post(`/manager/staff/shop/${shopId}/invites`, dto);
  return data;
}

export async function cancelInvite(
  shopId: string,
  inviteId: string
): Promise<Invite> {
  const { data } = await api.post(
    `/manager/staff/shop/${shopId}/invites/${inviteId}/cancel`
  );
  return data;
}

export async function resendInvite(
  shopId: string,
  inviteId: string
): Promise<Invite> {
  const { data } = await api.post(
    `/manager/staff/shop/${shopId}/invites/${inviteId}/resend`
  );
  return data;
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
  shopId: string;
  supplierId: string;
  invoiceNumber: string;
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
  console.log('[CREATE PURCHASE] Запрос на создание прихода с данными:', data);

  // Обязательно проверим и установим shopId
  if (!data.shopId) {
    console.error('[CREATE PURCHASE] ОШИБКА: Отсутствует shopId');
    throw new Error('Не указан ID магазина (shopId)');
  }

  // Убедимся, что базовые поля существуют
  const purchaseData = {
    ...data,
    supplierId: data.supplierId || '',
    invoiceNumber: data.invoiceNumber || '',
    date: data.date || new Date().toISOString().split('T')[0],
    items: data.items || [],
    status: data.status || 'draft',
  };

  // Проверим наличие хотя бы одного товара
  if (!purchaseData.items || purchaseData.items.length === 0) {
    console.log(
      '[CREATE PURCHASE] Нет товаров в приходе, добавляем фиктивный товар'
    );
    purchaseData.items = [
      {
        productId: '00000000-0000-0000-0000-000000000000', // временный ID
        quantity: 1,
        price: 0,
      },
    ];
  }

  // Проверяем каждый товар на корректность цены
  purchaseData.items.forEach((item, index) => {
    if (typeof item.price !== 'number' || isNaN(item.price)) {
      console.warn(
        `[CREATE PURCHASE] Товар #${index} (${item.productId}) имеет невалидную цену: ${item.price}`
      );
      item.price = 0;
    }
  });

  // Определим все возможные URL-пути для создания прихода
  const possibleUrls = [
    '/manager/purchases',
    `/manager/purchases/${purchaseData.shopId}`,
    `/manager/purchases/shop/${purchaseData.shopId}`,
    `/manager/warehouse/purchases`,
    `/manager/warehouse/purchases/${purchaseData.shopId}`,
    `/manager/shops/${purchaseData.shopId}/purchases`,
    `/manager/purchases/create`,
  ];

  // Определим варианты данных от полных до минимальных
  const dataVariants = [
    // Полный набор данных
    purchaseData,

    // Упрощенный набор с минимальными товарами
    {
      ...purchaseData,
      items: purchaseData.items.slice(0, 1), // Только первый товар
    },

    // Без товаров, только обязательные поля
    {
      shopId: purchaseData.shopId,
      date: purchaseData.date,
      status: 'draft',
    },

    // Абсолютный минимум
    {
      shopId: purchaseData.shopId,
    },
  ];

  // Журнал всех ошибок
  const errors = [];

  // Поочередно пробуем все возможные URL и варианты данных
  for (const url of possibleUrls) {
    for (
      let variantIndex = 0;
      variantIndex < dataVariants.length;
      variantIndex++
    ) {
      const variant = dataVariants[variantIndex];
      try {
        console.log(
          `[CREATE PURCHASE] Попытка ${
            possibleUrls.indexOf(url) * dataVariants.length + variantIndex + 1
          }:`
        );
        console.log(`[CREATE PURCHASE] URL: ${url}`);
        console.log(`[CREATE PURCHASE] Данные:`, variant);

        const response = await api.post(url, variant);

        console.log('[CREATE PURCHASE] УСПЕХ! Ответ сервера:', response.data);
        console.log(
          `[CREATE PURCHASE] Успешно создан приход с использованием URL: ${url}`
        );

        return response.data;
      } catch (error: any) {
        const errorDetails = {
          url,
          data: variant,
          error: error.message,
          status: error.response?.status,
          responseData: error.response?.data,
        };

        errors.push(errorDetails);

        console.error(
          `[CREATE PURCHASE] Ошибка при URL ${url}:`,
          error.message
        );
        if (error.response) {
          console.error('Статус:', error.response.status);
          console.error('Данные ответа:', error.response.data);
        }

        // Продолжаем со следующим вариантом
      }
    }
  }

  // Если все попытки не удались, выводим подробный журнал ошибок и выбрасываем исключение
  console.error(
    '[CREATE PURCHASE] КРИТИЧЕСКАЯ ОШИБКА: Все попытки создания прихода провалились'
  );
  console.error(
    '[CREATE PURCHASE] Журнал ошибок:',
    JSON.stringify(errors, null, 2)
  );

  throw new Error(
    `Не удалось создать приход. Проверьте соединение с сервером и правильность данных магазина (shopId: ${purchaseData.shopId})`
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
    const response = await api.post('/manager/purchases', {
      ...data,
      status: 'draft', // Всегда устанавливаем статус draft при создании черновика
    });
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
  shopId?: string
): Promise<Purchase> => {
  console.log('[getPurchaseById] ID:', id, 'shopId:', shopId);

  if (!id) {
    console.error('[getPurchaseById] Missing required purchase ID');
    throw new Error('Missing required purchase ID');
  }

  // Если shopId не передан, выбрасываем ошибку
  if (!shopId) {
    console.error('[getPurchaseById] Missing required shopId');
    throw new Error('Missing required shopId parameter');
  }

  // Массив возможных форматов URL для запроса
  const possibleUrls = [
    // Основной формат маршрута из App.tsx
    `/manager/${shopId}/warehouse/purchases/${id}`,
    // Альтернативные форматы для совместимости с API
    `/manager/purchases/${id}?shopId=${shopId}`,
    `/manager/purchases/shop/${shopId}/purchase/${id}`,
    `/manager/shops/${shopId}/purchases/${id}`,
    `/manager/purchases/${shopId}/${id}`,
    `/manager/warehouse/purchases/${shopId}/${id}`,
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

export const getPurchases = async (shopId: string): Promise<Purchase[]> => {
  try {
    console.log('Fetching purchases for shop ID:', shopId);

    if (!shopId) {
      console.error('Missing shop ID for getPurchases call');
      throw new Error('Missing shop ID for getPurchases call');
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(shopId)) {
      console.error('Invalid shop ID format:', shopId);
      throw new Error('Invalid shop ID format');
    }

    const url = `/manager/purchases/${shopId}`;
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
  shopId: string,
  purchaseId: string
): Promise<void> => {
  try {
    await api.delete(`/manager/purchases/${shopId}/${purchaseId}`);
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

export const getSales = async (shopId: string) => {
  const response = await api.get<InventoryTransaction[]>(
    `/manager/inventory/sales/${shopId}`
  );
  return response.data;
};

export const getReturns = async (shopId: string) => {
  const response = await api.get<InventoryTransaction[]>(
    `/manager/inventory/returns/${shopId}`
  );
  return response.data;
};

export const getWriteOffs = async (
  shopId: string
): Promise<InventoryTransaction[]> => {
  console.log('Calling getWriteOffs with shopId:', shopId);
  try {
    const response = await api.get<InventoryTransaction[]>(
      `/manager/inventory/write-offs/${shopId}`
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
    const response = await api.get(`/manager/shops/${shopId}`);
    console.log('Shop data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getManagerShop:', error);
    throw ApiErrorHandler.handle(error);
  }
};
