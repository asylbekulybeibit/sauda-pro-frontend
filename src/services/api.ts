import axios from 'axios';
import { UserRoleDetails } from '@/types/role';
import { Shop, CreateShopDto, UpdateShopDto } from '@/types/shop';
import {
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from '@/types/warehouse';
import { Invite, CreateInviteDto } from '@/types/invite';
import { User, UpdateUserDto } from '@/types/user';
import { DashboardStats } from '@/types/dashboard';
import { useAuthStore } from '@/store/authStore';
import { cleanFormData } from '@/utils/form';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для логирования запросов
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Отправка запроса:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
    });
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Токен из localStorage:', token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        '🔒 Добавлен заголовок Authorization:',
        config.headers.Authorization
      );
    } else {
      console.warn('⚠️ Токен не найден в localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Ошибка при отправке запроса:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для логирования ответов
api.interceptors.response.use(
  (response) => {
    console.log('✅ Получен ответ:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Ошибка ответа:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      // Очищаем токен и состояние авторизации
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      useAuthStore.getState().logout();

      // Перенаправляем на страницу логина
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Интерфейсы для аутентификации
interface GenerateOTPResponse {
  message: string;
}

interface VerifyOTPResponse {
  accessToken: string;
  message: string;
}

interface Profile {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isSuperAdmin: boolean;
  roles: UserRoleDetails[];
}

// Методы аутентификации
export const generateOTP = async (
  phone: string
): Promise<GenerateOTPResponse> => {
  console.log('Отправляем запрос на генерацию OTP:', {
    phone,
    phoneLength: phone.length,
    phoneFormat: phone.match(/^\+7\d{10}$/) ? 'Правильный' : 'Неправильный',
  });

  // Проверяем формат номера перед отправкой
  if (!phone.match(/^\+7\d{10}$/)) {
    throw new Error(
      `Неверный формат номера: ${phone}. Ожидается: +7XXXXXXXXXX`
    );
  }

  const response = await api.post('/auth/otp/generate', { phone });
  return response.data;
};

export const verifyOTP = async (
  phone: string,
  code: string
): Promise<VerifyOTPResponse> => {
  const response = await api.post('/auth/otp/verify', { phone, code });
  return response.data;
};

// Методы для работы с профилем
export const updateProfile = async (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<Profile> => {
  const response = await api.patch('/profile', data);
  return response.data;
};

export const getProfile = async (): Promise<Profile> => {
  const response = await api.get('/profile');
  return response.data;
};

// Методы для работы с проектами
export const getShops = async (): Promise<Shop[]> => {
  const response = await api.get('/shops');
  return response.data;
};

export const getShop = async (id: string): Promise<Shop> => {
  const response = await api.get(`/shops/${id}`);
  return response.data;
};

export const createShop = async (data: CreateShopDto): Promise<Shop> => {
  const response = await api.post('/shops', data);
  return response.data;
};

export const updateShop = async (
  id: string,
  data: UpdateShopDto
): Promise<Shop> => {
  const response = await api.patch(`/shops/${id}`, data);
  return response.data;
};

export const deleteShop = async (id: string): Promise<void> => {
  await api.delete(`/shops/${id}`);
};

// Методы для работы со складами
export const getWarehouses = async (): Promise<Warehouse[]> => {
  const response = await api.get('/warehouses');
  return response.data;
};

export const getWarehouse = async (id: string): Promise<Warehouse> => {
  const response = await api.get(`/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (
  data: CreateWarehouseDto
): Promise<Warehouse> => {
  const response = await api.post('/warehouses', data);
  return response.data;
};

export const updateWarehouse = async (
  id: string,
  data: UpdateWarehouseDto
): Promise<Warehouse> => {
  const response = await api.patch(`/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await api.delete(`/warehouses/${id}`);
};

// Методы для работы с инвайтами
export const getInvites = async (): Promise<Invite[]> => {
  const response = await api.get('/invites');
  return response.data;
};

export const createInvite = async (data: CreateInviteDto): Promise<Invite> => {
  const cleanedData = cleanFormData(data);
  const response = await api.post('/invites', cleanedData);
  return response.data;
};

export const acceptInvite = async (id: string): Promise<Invite> => {
  const response = await api.post(`/invites/${id}/accept`);
  return response.data;
};

export const cancelInvite = async (id: string): Promise<void> => {
  await api.patch(`/invites/${id}/cancel`);
};

// Получение списка ожидающих инвайтов для текущего пользователя
export const getPendingInvites = async (): Promise<Invite[]> => {
  const response = await api.get('/invites/pending');
  return response.data;
};

// Отклонение инвайта
export const rejectInvite = async (inviteId: string): Promise<void> => {
  await api.post(`/invites/${inviteId}/reject`);
};

// Методы для работы с пользователями
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUserDto
): Promise<User> => {
  const response = await api.patch(`/admin/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

// Методы для работы со статистикой
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

// Методы для работы с сотрудниками
export const getShopStaff = async (): Promise<UserRoleDetails[]> => {
  const response = await api.get('/users/staff');
  return response.data;
};

export const removeStaffMember = async (staffId: string): Promise<void> => {
  await api.patch(`/users/staff/${staffId}/deactivate`);
};
