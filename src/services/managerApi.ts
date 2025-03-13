import { api } from './api';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { InventoryTransaction } from '@/types/inventory';
import { UserRoleDetails } from '@/types/role';
import { Invite } from '@/types/invite';
import { Report } from '@/types/report';
import { Promotion } from '@/types/promotion';
import { Supplier } from '@/types/supplier';
import { LabelTemplate, GenerateLabelsRequest } from '@/types/label';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler, ApiError } from '@/utils/error-handler';

// Методы для работы с товарами
export const getProducts = async (shopId: string): Promise<Product[]> => {
  try {
    const response = await api.get(`/manager/products/shop/${shopId}`);
    return response.data;
  } catch (error) {
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
  const response = await api.get(`/manager/inventory/transactions/${shopId}`);
  return response.data;
};

export const createInventoryTransaction = async (
  data: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InventoryTransaction> => {
  try {
    const response = await api.post('/manager/inventory/transactions', data);
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
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
  const response = await api.get(`/manager/staff/${shopId}`);
  return response.data;
};

export const createStaffInvite = async (data: any): Promise<Invite> => {
  const response = await api.post('/manager/staff/invite', data);
  return response.data;
};

export const deactivateStaff = async (staffId: string): Promise<void> => {
  await api.patch(`/manager/staff/${staffId}/deactivate`);
};

// Методы для работы с отчетами
export const createReport = async (data: any): Promise<Report> => {
  const response = await api.post('/manager/reports', data);
  return response.data;
};

export const getReports = async (shopId: string): Promise<Report[]> => {
  const response = await api.get(`/manager/reports/shop/${shopId}`);
  return response.data;
};

export const updateReport = async (data: {
  id: string;
  shopId: number;
  name: string;
  type: string;
  format: string;
  startDate: string;
  endDate: string;
}): Promise<Report> => {
  const { id, ...updateData } = data;
  const response = await api.patch(`/manager/reports/${id}`, updateData);
  return response.data;
};

export const deleteReport = async (id: string): Promise<void> => {
  await api.delete(`/manager/reports/${id}`);
};

export const downloadReport = async (
  id: string
): Promise<{
  data: Blob;
  type: string;
  filename: string;
}> => {
  const response = await api.get(`/manager/reports/${id}/download`, {
    responseType: 'blob',
  });
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

// Методы для работы с акциями
export const getPromotions = async (shopId: string): Promise<Promotion[]> => {
  const response = await api.get(`/manager/promotions/shop/${shopId}`);
  return response.data;
};

export const createPromotion = async (data: any): Promise<Promotion> => {
  const response = await api.post('/manager/promotions', data);
  return response.data;
};

export const updatePromotion = async (
  id: string,
  data: Partial<Promotion>
): Promise<Promotion> => {
  const response = await api.patch(`/manager/promotions/${id}`, data);
  return response.data;
};

export const deletePromotion = async (id: string): Promise<void> => {
  await api.delete(`/manager/promotions/${id}`);
};

// Методы для работы с поставщиками
export const getSuppliers = async (shopId: string): Promise<Supplier[]> => {
  const response = await api.get(`/manager/suppliers/shop/${shopId}`);
  return response.data;
};

export const createSupplier = async (data: any): Promise<Supplier> => {
  const response = await api.post('/manager/suppliers', data);
  return response.data;
};

export const updateSupplier = async (
  id: string,
  data: Partial<Supplier>
): Promise<Supplier> => {
  const response = await api.patch(`/manager/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await api.delete(`/manager/suppliers/${id}`);
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
  const response = await api.get(`/manager/suppliers/${id}`);
  return response.data;
};

export const getSupplierProducts = async (
  supplierId: string
): Promise<Product[]> => {
  const response = await api.get(`/manager/suppliers/${supplierId}/products`);
  return response.data;
};

export const addProductToSupplier = async (
  supplierId: string,
  productId: string,
  data: { price: number; minimumOrder?: number }
): Promise<void> => {
  await api.post(
    `/manager/suppliers/${supplierId}/products/${productId}`,
    data
  );
};

export const removeProductFromSupplier = async (
  supplierId: string,
  productId: string
): Promise<void> => {
  await api.delete(`/manager/suppliers/${supplierId}/products/${productId}`);
};

// Методы для работы с этикетками
export const getLabelTemplates = async (
  shopId: string
): Promise<LabelTemplate[]> => {
  const response = await api.get(`/manager/labels/templates/${shopId}`);
  return response.data;
};

export const createLabelTemplate = async (
  data: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LabelTemplate> => {
  const response = await api.post('/manager/labels/templates', data);
  return response.data;
};

export const updateLabelTemplate = async (
  id: string,
  data: Partial<LabelTemplate>
): Promise<LabelTemplate> => {
  const response = await api.patch(`/manager/labels/templates/${id}`, data);
  return response.data;
};

export const deleteLabelTemplate = async (id: string): Promise<void> => {
  await api.delete(`/manager/labels/templates/${id}`);
};

export const generateLabels = async (
  data: GenerateLabelsRequest
): Promise<Blob> => {
  const response = await api.post('/manager/labels/generate', data, {
    responseType: 'blob',
  });
  return response.data;
};

export const previewLabel = async (
  templateId: string,
  productId: string
): Promise<Blob> => {
  const response = await api.get(
    `/manager/labels/preview/${templateId}/${productId}`,
    { responseType: 'blob' }
  );
  return response.data;
};

// Методы для работы с историей цен
export const getPriceHistory = async (
  productId: string,
  startDate?: string,
  endDate?: string
): Promise<PriceHistory[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(
      `/manager/price-history/${productId}?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw ApiErrorHandler.handle(error);
  }
};

export const addPriceChange = async (
  data: Omit<PriceHistory, 'id' | 'createdAt'>
): Promise<PriceHistory> => {
  const response = await api.post('/manager/price-history', data);
  return response.data;
};

export const getPriceChangesReport = async (
  shopId: string,
  startDate: string,
  endDate: string
): Promise<PriceHistory[]> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await api.get(
    `/manager/price-history/report/${shopId}?${params.toString()}`
  );
  return response.data;
};

// Хелпер для проверки ошибок
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error && 'code' in error && 'status' in error;
};
