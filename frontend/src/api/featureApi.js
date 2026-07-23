import axios from 'axios';
import { logout } from './authApi';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT and auto-refresh (same pattern as salesApi)
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) config.headers['Authorization'] = 'Bearer ' + user.token;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const originalConfig = err.config;
        if (err.response && (err.response.status === 401 || err.response.status === 403) && !originalConfig._retry) {
            originalConfig._retry = true;
            try {
                const rs = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
                const user = JSON.parse(localStorage.getItem('user'));
                user.token = rs.data.token;
                localStorage.setItem('user', JSON.stringify(user));
                api.defaults.headers.common['Authorization'] = 'Bearer ' + rs.data.token;
                return api(originalConfig);
            } catch (_err) {
                await logout();
                window.location.href = '/';
                return Promise.reject(_err);
            }
        }
        return Promise.reject(err);
    }
);

// ─── Subscription API ─────────────────────────────────────────────────────────

export const subscriptionApi = {
    getPlans: () => api.get('/api/subscriptions/plans'),
    getStatus: () => api.get('/api/subscriptions/status'),
    initiate: (planId) => api.post('/api/subscriptions/initiate', { planId }),
    submitUtr: (subscriptionId, utrNumber) =>
        api.post(`/api/subscriptions/${subscriptionId}/utr`, { utrNumber }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
    getPending: () => api.get('/api/admin/subscriptions/pending'),
    activate: (subscriptionId) => api.post(`/api/admin/subscriptions/${subscriptionId}/activate`),
    grantTrial: (businessId, durationDays, note) =>
        api.post('/api/admin/subscriptions/grant-trial', { businessId, durationDays, note }),
    getAuditLog: () => api.get('/api/admin/subscriptions/audit-log'),
};

// ─── Inventory API ────────────────────────────────────────────────────────────

export const inventoryApi = {
    getAll: () => api.get('/api/inventory'),
    search: (q) => api.get(`/api/inventory/search?q=${encodeURIComponent(q)}`),
    add: (data) => api.post('/api/inventory', data),
    update: (id, data) => api.put(`/api/inventory/${id}`, data),
    delete: (id) => api.delete(`/api/inventory/${id}`),
};

// ─── ITR API ──────────────────────────────────────────────────────────────────

export const itrApi = {
    getData: (year) => api.get(`/api/itr/data?financialYearStart=${year}`)
};
