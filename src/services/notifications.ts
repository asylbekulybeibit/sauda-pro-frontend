import { api } from './api';

export interface NotificationBase {
  id: string;
  isEnabled: boolean;
  notifyVia: string[];
  shopId: string;
}

export interface InventoryNotification extends NotificationBase {
  warehouseProductId: string;
  warehouseId: string;
  minQuantity: number;
}

export interface VehicleNotification extends NotificationBase {
  serviceType: string;
  mileageInterval: number;
  monthsInterval: number;
}

export interface CreateInventoryNotificationDto {
  warehouseProductId: string;
  warehouseId: string;
  minQuantity: number;
  notifyVia: string[];
  isEnabled?: boolean;
}

export interface CreateVehicleNotificationDto {
  serviceType: string;
  mileageInterval: number;
  monthsInterval: number;
  notifyVia: string[];
  isEnabled?: boolean;
}

// API для складских уведомлений
export const inventoryNotificationsApi = {
  getAll: async (shopId: string, warehouseId: string) => {
    const response = await api.get<InventoryNotification[]>(
      `/shops/${shopId}/notifications/inventory`,
      { params: { warehouseId } }
    );
    return response.data;
  },

  create: async (shopId: string, data: CreateInventoryNotificationDto) => {
    const response = await api.post<InventoryNotification>(
      `/shops/${shopId}/notifications/inventory`,
      data
    );
    return response.data;
  },

  update: async (
    shopId: string,
    id: string,
    data: Partial<CreateInventoryNotificationDto>
  ) => {
    const response = await api.patch<InventoryNotification>(
      `/shops/${shopId}/notifications/inventory/${id}`,
      data
    );
    return response.data;
  },

  delete: async (shopId: string, id: string) => {
    await api.delete(`/shops/${shopId}/notifications/inventory/${id}`);
  },
};

// API для автомобильных уведомлений
export const vehicleNotificationsApi = {
  getAll: async (shopId: string) => {
    const response = await api.get<VehicleNotification[]>(
      `/shops/${shopId}/notifications/vehicles`
    );
    return response.data;
  },

  create: async (shopId: string, data: CreateVehicleNotificationDto) => {
    const response = await api.post<VehicleNotification>(
      `/shops/${shopId}/notifications/vehicles`,
      data
    );
    return response.data;
  },

  update: async (
    shopId: string,
    id: string,
    data: Partial<CreateVehicleNotificationDto>
  ) => {
    const response = await api.patch<VehicleNotification>(
      `/shops/${shopId}/notifications/vehicles/${id}`,
      data
    );
    return response.data;
  },

  delete: async (shopId: string, id: string) => {
    await api.delete(`/shops/${shopId}/notifications/vehicles/${id}`);
  },
};
