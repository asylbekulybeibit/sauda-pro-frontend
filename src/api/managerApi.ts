import axios from 'axios';
import { Purchase, PurchaseItem, PurchaseSummary } from '../types/purchase';
import { Product } from '../types/product';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Получение токена авторизации
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Создание экземпляра axios с базовыми настройками
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление токена в заголовки запросов
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API для работы с товарами
export const fetchProducts = async (shopId?: string): Promise<Product[]> => {
  try {
    const params = shopId ? { shopId } : {};
    const response = await apiClient.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const createProduct = async (
  productData: Partial<Product>
): Promise<Product> => {
  try {
    const response = await apiClient.post('/products', productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (
  productId: string,
  productData: Partial<Product>
): Promise<Product> => {
  try {
    const response = await apiClient.put(`/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// API для работы с приходами
export const fetchPurchases = async (
  shopId?: string
): Promise<PurchaseSummary[]> => {
  try {
    const params = shopId ? { shopId } : {};
    const response = await apiClient.get('/purchases', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

export const fetchPurchaseById = async (
  purchaseId: string
): Promise<Purchase> => {
  try {
    const response = await apiClient.get(`/purchases/${purchaseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase with ID ${purchaseId}:`, error);
    throw error;
  }
};

export const createPurchase = async (
  purchaseData: Partial<Purchase>
): Promise<Purchase> => {
  try {
    const response = await apiClient.post('/purchases', purchaseData);
    return response.data;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
};

export const updatePurchase = async (
  purchaseId: string,
  purchaseData: Partial<Purchase>
): Promise<Purchase> => {
  try {
    const response = await apiClient.put(
      `/purchases/${purchaseId}`,
      purchaseData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating purchase with ID ${purchaseId}:`, error);
    throw error;
  }
};

export const deletePurchase = async (purchaseId: string): Promise<void> => {
  try {
    await apiClient.delete(`/purchases/${purchaseId}`);
  } catch (error) {
    console.error(`Error deleting purchase with ID ${purchaseId}:`, error);
    throw error;
  }
};

// API для работы с поставщиками
export const fetchSuppliers = async (
  shopId?: string
): Promise<{ id: string; name: string }[]> => {
  try {
    const params = shopId ? { shopId } : {};
    const response = await apiClient.get('/suppliers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

export const createSupplier = async (supplierData: {
  name: string;
  shopId?: string;
}): Promise<{ id: string; name: string }> => {
  try {
    const response = await apiClient.post('/suppliers', supplierData);
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

// API для работы с магазинами
export const fetchShops = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await apiClient.get('/shops');
    return response.data;
  } catch (error) {
    console.error('Error fetching shops:', error);
    throw error;
  }
};
