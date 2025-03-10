import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const updateProfile = async (
  userId: string,
  data: UpdateProfileData
) => {
  const response = await api.patch(`/users/${userId}`, data);
  return response.data;
};

export const getProfile = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};
