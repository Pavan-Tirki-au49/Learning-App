import axios from "axios";
import { config as appConfig } from "./config";
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${appConfig.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
        useAuthStore.getState().setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        window.location.href = "/auth/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
