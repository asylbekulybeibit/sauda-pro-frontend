import { api } from './api';
import {
  ServiceType,
  CreateServiceTypeDto,
  UpdateServiceTypeDto,
} from '@/types/serviceType';
import { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '@/types/vehicle';
import {
  ServiceHistory,
  CreateServiceHistoryDto,
  UpdateServiceHistoryDto,
} from '@/types/serviceHistory';
import { handleApiError } from '@/utils/errorHandling';

// API для типов услуг
export const getServiceTypes = async (
  shopId: string
): Promise<ServiceType[]> => {
  const { data } = await api.get(`/manager/service-types/shop/${shopId}`);
  return data;
};

export const getActiveServiceTypes = async (
  shopId: string
): Promise<ServiceType[]> => {
  const { data } = await api.get(
    `/manager/service-types/shop/${shopId}/active`
  );
  return data;
};

export const getServiceType = async (
  shopId: string,
  id: string
): Promise<ServiceType> => {
  const { data } = await api.get(`/manager/service-types/shop/${shopId}/${id}`);
  return data;
};

export const createServiceType = async (
  shopId: string,
  dto: CreateServiceTypeDto
): Promise<ServiceType> => {
  const { data } = await api.post(`/manager/service-types/shop/${shopId}`, dto);
  return data;
};

export const updateServiceType = async (
  shopId: string,
  id: string,
  dto: UpdateServiceTypeDto
): Promise<ServiceType> => {
  const { data } = await api.patch(
    `/manager/service-types/shop/${shopId}/${id}`,
    dto
  );
  return data;
};

export const removeServiceType = async (
  shopId: string,
  id: string
): Promise<void> => {
  const { data } = await api.delete(
    `/manager/service-types/shop/${shopId}/${id}`
  );
  return data;
};

// API для автомобилей клиентов
export const getVehicles = async (shopId: string): Promise<Vehicle[]> => {
  const { data } = await api.get(`/manager/vehicles/shop/${shopId}`);
  return data;
};

export const getVehiclesByClient = async (
  shopId: string,
  clientId: string
): Promise<Vehicle[]> => {
  const { data } = await api.get(
    `/manager/vehicles/shop/${shopId}/client/${clientId}`
  );
  return data;
};

export const getVehicle = async (
  shopId: string,
  id: string
): Promise<Vehicle> => {
  const { data } = await api.get(`/manager/vehicles/shop/${shopId}/${id}`);
  return data;
};

export const createVehicle = async (
  shopId: string,
  dto: CreateVehicleDto
): Promise<Vehicle> => {
  const { data } = await api.post(`/manager/vehicles/shop/${shopId}`, dto);
  return data;
};

export const updateVehicle = async (
  shopId: string,
  id: string,
  dto: UpdateVehicleDto
): Promise<Vehicle> => {
  const { data } = await api.patch(
    `/manager/vehicles/shop/${shopId}/${id}`,
    dto
  );
  return data;
};

export const removeVehicle = async (
  shopId: string,
  id: string
): Promise<void> => {
  const { data } = await api.patch(
    `/manager/vehicles/shop/${shopId}/${id}/soft-remove`
  );
  return data;
};

// API для истории услуг
export const getServiceHistory = async (
  shopId: string
): Promise<ServiceHistory[]> => {
  const { data } = await api.get(`/manager/services/shop/${shopId}`);
  return data;
};

export const getServiceHistoryById = async (
  shopId: string,
  id: string
): Promise<ServiceHistory> => {
  const { data } = await api.get(`/manager/services/shop/${shopId}/${id}`);
  return data;
};

export const getServiceHistoryByClient = async (
  shopId: string,
  clientId: string
): Promise<ServiceHistory[]> => {
  const { data } = await api.get(
    `/manager/services/shop/${shopId}/client/${clientId}`
  );
  return data;
};

export const getServiceHistoryByVehicle = async (
  shopId: string,
  vehicleId: string
): Promise<ServiceHistory[]> => {
  const { data } = await api.get(
    `/manager/services/shop/${shopId}/vehicle/${vehicleId}`
  );
  return data;
};

export const createServiceHistory = async (
  shopId: string,
  dto: CreateServiceHistoryDto
): Promise<ServiceHistory> => {
  const { data } = await api.post(`/manager/services/shop/${shopId}`, dto);
  return data;
};

export const updateServiceHistory = async (
  shopId: string,
  id: string,
  dto: UpdateServiceHistoryDto
): Promise<ServiceHistory> => {
  const { data } = await api.patch(
    `/manager/services/shop/${shopId}/${id}`,
    dto
  );
  return data;
};

export const removeServiceHistory = async (
  shopId: string,
  id: string
): Promise<void> => {
  const { data } = await api.delete(`/manager/services/shop/${shopId}/${id}`);
  return data;
};

export const getWarehouseServices = async (shopId: string): Promise<any[]> => {
  try {
    const { data } = await api.get(
      `/manager/warehouse-services/shop/${shopId}`
    );
    return data;
  } catch (error) {
    console.error('Error fetching warehouse services:', error);
    throw handleApiError(error, 'Не удалось загрузить услуги');
  }
};

export const createWarehouseService = async (
  serviceData: any
): Promise<any> => {
  try {
    const { data } = await api.post('/manager/warehouse-services', serviceData);
    return data;
  } catch (error) {
    console.error('Error creating warehouse service:', error);
    throw handleApiError(error, 'Не удалось создать услугу');
  }
};

export const updateWarehouseService = async ({
  id,
  ...serviceData
}: {
  id: string;
  [key: string]: any;
}): Promise<any> => {
  try {
    const { data } = await api.patch(
      `/manager/warehouse-services/${id}`,
      serviceData
    );
    return data;
  } catch (error) {
    console.error('Error updating warehouse service:', error);
    throw handleApiError(error, 'Не удалось обновить услугу');
  }
};

export const deleteWarehouseService = async (
  serviceId: string
): Promise<void> => {
  try {
    await api.delete(`/manager/warehouse-services/${serviceId}`);
  } catch (error) {
    console.error('Error deleting warehouse service:', error);
    throw handleApiError(error, 'Не удалось удалить услугу');
  }
};
