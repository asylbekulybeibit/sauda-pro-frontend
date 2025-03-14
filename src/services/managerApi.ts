import { api } from './api';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { InventoryTransaction, TransactionType } from '@/types/inventory';
import { UserRoleDetails } from '@/types/role';
import { Invite } from '@/types/invite';
import { Report } from '@/types/report';
import { Promotion } from '@/types/promotion';
import { Supplier } from '@/types/supplier';
import { LabelTemplate } from '@/types/label';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler, ApiError } from '@/utils/error-handler';
import { RoleType } from '@/types/role';
import { Purchase } from '@/types/purchase';
import axios from 'axios';
import { Transfer } from '@/types/transfer';

interface GenerateLabelsRequest {
  templateId: number;
  products: Array<{
    productId: number;
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

export const createInventoryTransaction = async (data: {
  shopId: string;
  type: TransactionType;
  productId: string;
  quantity: number;
  price?: number;
  note?: string;
  description?: string;
  comment?: string;
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
  const response = await api.get(`/manager/labels/templates?shopId=${shopId}`);
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
  }>;
  updatePrices?: boolean;
  createLabels?: boolean;
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

export const fetchProducts = async (shopId: string): Promise<Product[]> => {
  const response = await fetch(`/api/shops/${shopId}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await fetch('/api/suppliers');
  if (!response.ok) {
    throw new Error('Failed to fetch suppliers');
  }
  return response.json();
};

export const createPurchase = async (
  data: CreatePurchaseRequest
): Promise<PurchaseResponse> => {
  const response = await fetch('/api/purchases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create purchase');
  }

  return response.json();
};

export const getPurchaseById = async (id: string): Promise<Purchase> => {
  const response = await api.get(`/manager/inventory/purchases/${id}`);
  return response.data;
};

export const getPurchases = async (shopId: string): Promise<Purchase[]> => {
  try {
    const response = await axios.get(`/manager/shops/${shopId}/purchases`);
    return response.data;
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
