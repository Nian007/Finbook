import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/auth`;

export const signup = async (businessData) => {
    const response = await axios.post(`${API_URL}/signup`, businessData);
    return response.data;
};

export const login = async (phone, password) => {
    const response = await axios.post(`${API_URL}/login`, { phone, password });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = async () => {
    try {
        await axios.post(`${API_URL}/logout`);
    } catch (e) {
        console.error("Logout error", e);
    }
    localStorage.removeItem('user');
};

export const forgotPassword = async (phone) => {
    const response = await axios.post(`${API_URL}/forgot-password`, { phone });
    return response.data;
};

export const resetPassword = async (phone, otp, newPassword) => {
    const response = await axios.post(`${API_URL}/reset-password`, { phone, otp, newPassword });
    return response.data;
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
};
