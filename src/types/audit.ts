import { User } from './user';

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum AuditEntityType {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  ORDER = 'ORDER',
  SHOP = 'SHOP',
  INVENTORY = 'INVENTORY',
  STAFF = 'STAFF',
}

export interface AuditLog {
  id: string;
  action: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  description: string;
  userId: string;
  user?: User;
  shopId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditSearchParams {
  startDate?: string;
  endDate?: string;
  action?: AuditActionType;
  entityType?: AuditEntityType;
  entityId?: string;
  userId?: string;
  skip?: number;
  take?: number;
}

export interface AuditSearchResponse {
  items: AuditLog[];
  total: number;
}
