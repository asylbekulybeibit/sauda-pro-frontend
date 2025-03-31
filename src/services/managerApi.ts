import axios from 'axios';
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
import { Transfer } from '@/types/transfer';
import { Shop } from '@/types/shop';
import { RegisterPaymentMethod } from '@/types/cash-register';
import { Debt, DebtType, DebtStatus, DebtStatistics } from '@/types/debt';
import { useRoleStore } from '@/store/roleStore';

// Simple error handler for API requests
const handleApiError = (
  error: unknown,
  fallbackMessage = 'Ошибка при выполнении запроса'
) => {
  if (axios.isAxiosError(error) && error.response) {
    const message = error.response.data?.message || fallbackMessage;
    return { message, statusCode: error.response.status };
  }
  return { message: fallbackMessage };
};

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
export const getProducts = async (warehouseId: string): Promise<Product[]> => {
  try {
    const startTime = performance.now();
    console.log(
      `[${new Date().toISOString()}] Fetching warehouse products for warehouse ${warehouseId}`
    );

    // Добавляем уникальный идентификатор для отслеживания запроса
    const requestId = `prod-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    console.log(`Request ID: ${requestId}`);

    // Используем warehouseId как query параметр
    const response = await api.get(
      `/manager/warehouse-products/shop/${warehouseId}?warehouseId=${warehouseId}`
    );

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const count = response.data?.length || 0;

    console.log(
      `[${new Date().toISOString()}] Warehouse products fetched in ${duration}ms, count: ${count}, requestId: ${requestId}`
    );

    if (!response.data) {
      console.warn(
        `[${new Date().toISOString()}] No data received from warehouse products API, warehouseId: ${warehouseId}`
      );
      return [];
    }

    // Проверяем структуру полученных данных
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Проверяем наличие ключевых полей в первом элементе для диагностики
      const sampleProduct = response.data[0];
      console.log(
        `Sample product fields: id=${sampleProduct.id}, name=${sampleProduct.barcode?.productName}, quantity=${sampleProduct.quantity}`
      );
    }

    return response.data;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching warehouse products for warehouse ${warehouseId}:`,
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
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
    warehouseId?: string;
  }
): Promise<Product> => {
  try {
    // Проверяем наличие warehouseId и shopId
    if (!data.warehouseId) {
      console.warn('createProduct вызван без warehouseId!');
    }

    console.log('Creating product with data:', data);
    const response = await api.post(`/manager/warehouse-products`, data);
    return response.data;
  } catch (error) {
    console.error('Error in createProduct:', error);
    handleApiError(error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  data: Partial<Product>
): Promise<Product> => {
  try {
    const response = await api.patch(`/manager/warehouse-products/${id}`, data);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const updateProductBarcode = async (
  productId: string,
  barcode: string
): Promise<Product> => {
  try {
    console.log(`Updating barcode to ${barcode} for product ${productId}`);
    const response = await api.patch(`/manager/products/${productId}`, {
      barcode,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating product barcode:', error);
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

export const deleteWarehouseProduct = async (id: string): Promise<void> => {
  try {
    await api.patch(`/manager/warehouse-products/${id}`, { isActive: false });
  } catch (error) {
    handleApiError(error, 'Ошибка при удалении товара со склада');
  }
};

// Методы для работы с категориями
export const getCategories = async (shopId: string): Promise<Category[]> => {
  try {
    console.log(`Fetching categories for shop ${shopId}`);
    const response = await api.get(`/manager/shop/${shopId}/categories`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching categories for shop ${shopId}:`, error);
    throw ApiErrorHandler.handle(error);
  }
};

export const createCategory = async (
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> => {
  try {
    const response = await api.post(
      `/manager/shop/${data.shopId}/categories`,
      data
    );
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
    const response = await api.patch(
      `/manager/shop/${data.shopId}/categories/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const deleteCategory = async (
  id: string,
  shopId: string
): Promise<void> => {
  try {
    await api.delete(`/manager/shop/${shopId}/categories/${id}`);
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const getCategoryById = async (
  id: string,
  shopId: string
): Promise<Category> => {
  try {
    const response = await api.get(`/manager/shop/${shopId}/categories/${id}`);
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

    if (Array.isArray(response.data) && response.data.length > 0) {
      const adjustments = response.data.filter((t) => t.type === 'ADJUSTMENT');
      console.log(
        `Found ${adjustments.length} ADJUSTMENT transactions out of ${count} total`
      );

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
  warehouseId: string;
  type: TransactionType;
  warehouseProductId: string;
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
  warehouseId: string
): Promise<Product[]> => {
  const response = await api.get(`/manager/inventory/low-stock/${warehouseId}`);
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

// Метод для получения системных пользователей для конкретного склада
export const getStaffByWarehouse = async (
  shopId: string,
  warehouseId: string
): Promise<UserRoleDetails[]> => {
  try {
    const response = await api.get(
      `/manager/staff/shop/${shopId}/warehouse/${warehouseId}`
    );
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
    const { data } = await api.get(`/manager/shop/${shopId}/suppliers`);
    return data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw handleApiError(error);
  }
};

export const createSupplier = async (data: any): Promise<Supplier> => {
  try {
    console.log(`Creating supplier in shop ${data.shopId}, data:`, data);
    const { shopId } = data;
    const response = await api.post(`/manager/shop/${shopId}/suppliers`, data);
    console.log('Created supplier:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw handleApiError(error);
  }
};

export const updateSupplier = async (
  id: string,
  data: Partial<Supplier>,
  shopId: string
): Promise<Supplier> => {
  try {
    console.log(`Updating supplier ${id} in shop ${shopId}`);
    const response = await api.patch(
      `/manager/shop/${shopId}/suppliers/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw handleApiError(error);
  }
};

export const deleteSupplier = async (
  id: string,
  shopId: string
): Promise<void> => {
  try {
    console.log(`Deleting supplier ${id} from shop ${shopId}`);
    await api.delete(`/manager/shop/${shopId}/suppliers/${id}`);
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw handleApiError(error);
  }
};

export const getSupplierById = async (
  id: string,
  shopId: string
): Promise<Supplier> => {
  try {
    console.log(`Fetching supplier with id ${id} for shop ${shopId}`);
    const response = await api.get(`/manager/shop/${shopId}/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier:', error);
    throw handleApiError(error);
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

// Генерация случайного штрих-кода
export const generateBarcode = (prefix: string = ''): string => {
  // EAN-13 формат (13 цифр)
  const prefixLength = prefix.length;
  const randomPart = Math.floor(Math.random() * 10000000000000)
    .toString()
    .padStart(13 - prefixLength, '0');
  return prefix + randomPart;
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
  shopId?: string;
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
  payments?: Array<{
    paymentMethodId: string;
    amount: number;
    note?: string;
  }>;
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
  paidAmount: number;
  remainingAmount: number;
}

export const createPurchase = async (
  purchaseData: CreatePurchaseRequest
): Promise<PurchaseResponse> => {
  // Проверяем, что warehouseId указан
  if (!purchaseData.warehouseId) {
    console.error('[createPurchase] warehouseId is required');
    throw new Error('warehouseId is required to create a purchase');
  }

  try {
    console.log('[createPurchase] Starting purchase creation with data:', {
      warehouseId: purchaseData.warehouseId,
      shopId: purchaseData.shopId,
      supplierId: purchaseData.supplierId,
      itemsCount: purchaseData.items?.length,
      date: purchaseData.date,
    });

    // Определяем URL в зависимости от наличия поставщика
    const url = purchaseData.supplierId
      ? '/manager/purchases'
      : '/manager/purchases/no-supplier';

    console.log(`[createPurchase] Using URL: ${url}`);
    console.log('[createPurchase] Full request data:', purchaseData);

    const response = await api.post(url, purchaseData);

    console.log(
      `[createPurchase] Purchase created successfully:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error('[createPurchase] Error creating purchase:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      });
    }
    throw ApiErrorHandler.handle(error);
  }
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
  console.log(
    '[getPurchaseById] Trying URL:',
    `/manager/purchases/${warehouseId}/${id}`
  );
  const { data } = await api.get(`/manager/purchases/${warehouseId}/${id}`);
  return data;
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

    // Массив возможных URL для получения приходов
    const potentialUrls = [
      `/manager/purchases/${warehouseId}`,
      `/manager/inventory/purchases/${warehouseId}`,
      `/manager/warehouses/${warehouseId}/purchases`,
      `/manager/warehouse/purchases/${warehouseId}`,
    ];

    let lastError = null;

    // Перебираем все возможные URL и пробуем получить данные
    for (const url of potentialUrls) {
      try {
        console.log(`[getPurchases] Trying URL: ${url}`);
        const response = await api.get(url);
        console.log(
          `[getPurchases] Purchases data fetched successfully with URL ${url}, count:`,
          response.data?.length || 0
        );
        return response.data;
      } catch (error) {
        console.error(`[getPurchases] Failed with URL ${url}:`, error);
        lastError = error;
        // Продолжаем с следующим URL
      }
    }

    // Если все попытки не удались, выбрасываем ошибку
    console.error('[getPurchases] All attempts failed');
    throw ApiErrorHandler.handle(lastError);
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

      if (!response.data) {
        throw new Error('No data received from API');
      }

      // Создаем объект Shop на основе данных, полученных от сервера
      return {
        id: shopId,
        name: response.data.shopName || 'Неизвестный магазин',
        warehouse: response.data.warehouse || null,
        type: response.data.type || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString(),
        isActive: response.data.isActive ?? true,
      };
    } catch (error) {
      console.error('Error in API request for shop data:', error);

      // Запрашиваем данные о складе менеджера из профиля
      console.log('Attempting to fetch warehouse data from profile');
      const roleResponse = await api.get('/profile');

      if (!roleResponse.data?.roles) {
        throw new Error('No roles data in profile');
      }

      const managerRole = roleResponse.data.roles.find(
        (r: any) => r.type === 'manager' && r.isActive
      );

      if (!managerRole || !managerRole.warehouse) {
        throw new Error('No active manager role or warehouse found in profile');
      }

      console.log(
        'Found manager warehouse from profile:',
        managerRole.warehouse
      );

      return {
        id: shopId,
        name: managerRole.shop?.name || 'Магазин',
        warehouse: {
          id: managerRole.warehouse.id,
          name: managerRole.warehouse.name,
          address: managerRole.warehouse.address,
        },
        type: managerRole.shop?.type || '',
        address: managerRole.shop?.address || '',
        phone: managerRole.shop?.phone || '',
        email: managerRole.shop?.email || '',
        createdAt: managerRole.shop?.createdAt || new Date().toISOString(),
        updatedAt: managerRole.shop?.updatedAt || new Date().toISOString(),
        isActive: managerRole.shop?.isActive ?? true,
      };
    }
  } catch (error) {
    console.error('Error in getManagerShop:', error);
    throw error; // Пробрасываем ошибку вместо возврата заглушки
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

// Новый метод для создания клиента через конкретный склад (клиент будет доступен всем складам магазина)
export const createClientFromWarehouse = async (
  shopId: string,
  warehouseId: string,
  clientData: any
) => {
  console.log(
    `[managerApi.createClientFromWarehouse] Создание клиента. shopId=${shopId}, warehouseId=${warehouseId}`,
    clientData
  );
  try {
    // Используем стандартный эндпоинт для создания клиента, передавая shopId,
    // клиент будет создан для всего магазина, но инициирован из конкретного склада
    const response = await api.post(
      `/manager/clients/shop/${shopId}`,
      clientData
    );
    console.log(
      `[managerApi.createClientFromWarehouse] Клиент создан:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`[managerApi.createClientFromWarehouse] Ошибка:`, error);
    throw error;
  }
};

// Интерфейс для склада
export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isMain?: boolean;
  isActive?: boolean;
  shopId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Добавляем функцию для получения списка складов магазина
export const getWarehouses = async (shopId: string): Promise<Warehouse[]> => {
  try {
    const response = await api.get(`/manager/warehouses/shop/${shopId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Новые методы для получения сотрудников по warehouseId
export const getEmployeesByWarehouse = async (
  shopId: string,
  warehouseId: string
) => {
  console.log(
    `[managerApi.getEmployeesByWarehouse] Запрос сотрудников для склада. shopId=${shopId}, warehouseId=${warehouseId}`
  );
  try {
    const response = await api.get(
      `/manager/employees/shop/${shopId}/warehouse/${warehouseId}`
    );
    console.log(
      `[managerApi.getEmployeesByWarehouse] Получен ответ:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`[managerApi.getEmployeesByWarehouse] Ошибка:`, error);
    throw error;
  }
};

export const getActiveEmployeesByWarehouse = async (
  shopId: string,
  warehouseId: string
) => {
  console.log(
    `[managerApi.getActiveEmployeesByWarehouse] Запрос активных сотрудников для склада. shopId=${shopId}, warehouseId=${warehouseId}`
  );
  try {
    const response = await api.get(
      `/manager/employees/shop/${shopId}/warehouse/${warehouseId}/active`
    );
    console.log(
      `[managerApi.getActiveEmployeesByWarehouse] Получен ответ:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`[managerApi.getActiveEmployeesByWarehouse] Ошибка:`, error);
    throw error;
  }
};

// Метод для создания сотрудника для конкретного склада
export const createEmployeeForWarehouse = async (
  shopId: string,
  warehouseId: string,
  employeeData: any
) => {
  console.log(
    `[managerApi.createEmployeeForWarehouse] Создание сотрудника для склада. shopId=${shopId}, warehouseId=${warehouseId}`,
    employeeData
  );
  try {
    const response = await api.post(
      `/manager/employees/warehouse/${warehouseId}`,
      employeeData
    );
    console.log(
      `[managerApi.createEmployeeForWarehouse] Сотрудник создан:`,
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(`[managerApi.createEmployeeForWarehouse] Ошибка:`, error);
    throw error;
  }
};

// Функция для получения штрих-кодов (баркодов)
export const getBarcodes = async (
  shopId: string,
  isService: boolean = false
): Promise<any[]> => {
  try {
    const response = await api.get(
      `/manager/barcodes/shop/${shopId}?isService=${isService}`
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createBarcode = async (data: {
  code: string;
  productName: string;
  description?: string;
  categoryId?: string;
  isService: boolean;
  shopId: string;
}): Promise<any> => {
  try {
    const response = await api.post(
      `/manager/barcodes/shop/${data.shopId}`,
      data
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateBarcode = async (
  id: string,
  data: {
    productName: string;
    description?: string;
    categoryId?: string;
    isService: boolean;
    shopId: string;
  }
): Promise<any> => {
  try {
    const response = await api.patch(
      `/manager/barcodes/shop/${data.shopId}/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteBarcode = async (
  id: string,
  shopId: string
): Promise<void> => {
  try {
    await api.delete(`/manager/barcodes/shop/${shopId}/${id}`);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getWarehouse = async (warehouseId: string): Promise<Warehouse> => {
  try {
    const response = await api.get(`/manager/warehouses/${warehouseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getProductTransactions = async (
  productId: string
): Promise<InventoryTransaction[]> => {
  const response = await api.get<InventoryTransaction[]>(
    `/manager/inventory/products/${productId}/transactions`
  );
  return response.data;
};

export interface CreateServiceProductDto {
  barcodeId: string;
  warehouseId: string;
  sellingPrice: number;
  purchasePrice: number;
}

export const createServiceProduct = async (
  data: CreateServiceProductDto
): Promise<any> => {
  try {
    const response = await api.post(
      '/manager/warehouse-products/service',
      data
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Добавляем новые методы для работы с оплатами
export const addPurchasePayment = async (
  purchaseId: string,
  payment: {
    paymentMethodId: string;
    amount: number;
    note?: string;
  }
): Promise<PurchaseResponse> => {
  try {
    console.log('[addPurchasePayment] Adding payment:', {
      purchaseId,
      payment,
    });

    const response = await api.post(
      `/manager/purchases/${purchaseId}/payments`,
      payment
    );

    console.log(
      '[addPurchasePayment] Payment added successfully:',
      response.data
    );
    return response.data;
  } catch (error) {
    console.error('[addPurchasePayment] Error adding payment:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getPaymentMethods = async (
  shopId: string
): Promise<RegisterPaymentMethod[]> => {
  const response = await api.get(`/api/shops/${shopId}/payment-methods`);
  return response.data;
};

export const getDebts = async (warehouseId: string): Promise<Debt[]> => {
  console.log('[API] Getting debts for warehouse:', warehouseId);
  try {
    const { currentRole } = useRoleStore.getState();
    const shopId = (currentRole as UserRoleDetails)?.shop?.id;
    if (!shopId) {
      throw new Error('Shop ID not found in current role');
    }
    const response = await api.get(
      `/manager/${shopId}/warehouse/debts/${warehouseId}`
    );
    console.log('[API] Received debts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching debts:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getActiveDebts = async (warehouseId: string): Promise<Debt[]> => {
  console.log('[API] Getting active debts for warehouse:', warehouseId);
  try {
    const { currentRole } = useRoleStore.getState();
    const shopId = (currentRole as UserRoleDetails)?.shop?.id;
    if (!shopId) {
      throw new Error('Shop ID not found in current role');
    }
    const response = await api.get(
      `/manager/${shopId}/warehouse/debts/${warehouseId}/active`
    );
    console.log('[API] Received active debts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching active debts:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getDebtsStatistics = async (
  warehouseId: string
): Promise<DebtStatistics> => {
  console.log('[API] Getting debt statistics for warehouse:', warehouseId);
  try {
    const { currentRole } = useRoleStore.getState();
    const shopId = (currentRole as UserRoleDetails)?.shop?.id;
    if (!shopId) {
      throw new Error('Shop ID not found in current role');
    }
    const response = await api.get(
      `/manager/${shopId}/warehouse/debts/${warehouseId}/statistics`
    );
    console.log('[API] Received debt statistics response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error fetching debt statistics:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const getDebtsBySupplier = async (
  supplierId: string
): Promise<Debt[]> => {
  try {
    const response = await api.get(`/manager/debts/supplier/${supplierId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching supplier debts:', error);
    throw ApiErrorHandler.handle(error);
  }
};

export const createDebt = async (data: {
  warehouseId: string;
  type: DebtType;
  status?: DebtStatus;
  supplierId?: string;
  totalAmount: number;
  paidAmount?: number;
  dueDate?: string;
  purchaseId?: string;
  comment?: string;
}): Promise<Debt> => {
  const { currentRole } = useRoleStore.getState();
  const shopId = (currentRole as UserRoleDetails)?.shop?.id;
  if (!shopId) {
    throw new Error('Shop ID not found in current role');
  }
  const response = await api.post(`/manager/${shopId}/warehouse/debts`, data);
  return response.data;
};

export const addDebtPayment = async (
  debtId: string,
  payment: {
    paymentMethodId: string;
    amount: number;
    note?: string;
  }
): Promise<Debt> => {
  const { currentRole } = useRoleStore.getState();
  const shopId = (currentRole as UserRoleDetails)?.shop?.id;
  if (!shopId) {
    throw new Error('Shop ID not found in current role');
  }
  const response = await api.post(
    `/manager/${shopId}/warehouse/debts/${debtId}/payments`,
    payment
  );
  return response.data;
};

export const cancelDebt = async (debtId: string): Promise<Debt> => {
  const { currentRole } = useRoleStore.getState();
  const shopId = (currentRole as UserRoleDetails)?.shop?.id;
  if (!shopId) {
    throw new Error('Shop ID not found in current role');
  }
  const response = await api.post(
    `/manager/${shopId}/warehouse/debts/${debtId}/cancel`
  );
  return response.data;
};

export const getPurchasePayments = async (
  purchaseId: string,
  warehouseId: string
) => {
  const { data } = await api.get(
    `/manager/purchases/${warehouseId}/${purchaseId}/payments`
  );
  return data;
};
