import { api } from './api';
import {
  ServiceType,
  CreateServiceTypeDto,
  UpdateServiceTypeDto,
} from '@/types/serviceType';

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
