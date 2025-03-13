import { api } from './api';
import { ApiErrorHandler } from '@/utils/error-handler';

export interface BulkProductOperation {
  operation: 'create' | 'update';
  products: Array<{
    name: string;
    sku: string;
    price: number;
    quantity: number;
    category?: string;
    description?: string;
  }>;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    index: number;
    sku: string;
    message: string;
  }>;
}

export const bulkOperationsApi = {
  uploadProducts: async (
    shopId: string,
    data: BulkProductOperation
  ): Promise<BulkOperationResult> => {
    try {
      const response = await api.post(
        `/bulk-operations/${shopId}/products`,
        data
      );
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },

  downloadTemplate: async (type: string): Promise<Blob> => {
    try {
      const response = await api.get(`/bulk-operations/templates/${type}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },

  getBulkOperationStatus: async (
    operationId: string
  ): Promise<BulkOperationResult> => {
    try {
      const response = await api.get(`/bulk-operations/status/${operationId}`);
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handle(error);
    }
  },
};
