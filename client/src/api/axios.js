import axios from 'axios';
import { SERVER_URL } from '../config';

const API = axios.create({
    baseURL: `${SERVER_URL}/api`,
});

// Add a request interceptor to attach JWT token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
