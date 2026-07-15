import axios from 'axios';
import { logout } from './authApi';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/sales`;

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers['Authorization'] = 'Bearer ' + user.token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalConfig = err.config;

        if (err.response) {
            // Access Token was expired
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;

                try {
                    const rs = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
                    const { token } = rs.data;
                    
                    const user = JSON.parse(localStorage.getItem('user'));
                    user.token = token;
                    localStorage.setItem('user', JSON.stringify(user));

                    api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                    return api(originalConfig);
                } catch (_error) {
                    // Refresh token expired or invalid
                    await logout();
                    window.location.href = '/';
                    return Promise.reject(_error);
                }
            }
        }
        return Promise.reject(err);
    }
);

export const salesApi = {
  getAll: () => api.get(''),
  getById: (id) => api.get(`/${id}`),
  create: (data) => api.post('', data),
  delete: (id) => api.delete(`/${id}`),
  search: (query) => api.get(`/search?query=${encodeURIComponent(query)}`),
  getStats: () => api.get('/stats'),
  parseVoice: (transcript) => api.post('/voice-parse', { transcript })
};
