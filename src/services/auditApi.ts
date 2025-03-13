import { api } from './api';
import {
  AuditLog,
  AuditSearchParams,
  AuditSearchResponse,
} from '../types/audit';

export const auditApi = {
  searchLogs: async (
    shopId: string,
    params: AuditSearchParams
  ): Promise<AuditSearchResponse> => {
    const { data } = await api.get(`/audit/shop/${shopId}`, { params });
    return data;
  },

  getRecentActivity: async (
    shopId: string,
    limit?: number
  ): Promise<AuditLog[]> => {
    const { data } = await api.get(`/audit/shop/${shopId}/recent`, {
      params: { limit },
    });
    return data;
  },

  getUserActivity: async (): Promise<AuditLog[]> => {
    const { data } = await api.get('/audit/user/activity');
    return data;
  },

  getEntityHistory: async (
    entityType: string,
    entityId: string,
    limit?: number
  ): Promise<AuditLog[]> => {
    const { data } = await api.get(`/audit/entity/${entityType}/${entityId}`, {
      params: { limit },
    });
    return data;
  },
};
