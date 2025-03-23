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
