// frontend/src/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://course-platform-api.onrender.com/api/'
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