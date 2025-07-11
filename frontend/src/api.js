// frontend/src/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000') + '/api/'
});

// Use an interceptor to add the auth token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export default api;