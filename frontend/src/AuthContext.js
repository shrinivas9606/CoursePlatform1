// frontend/src/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            api.get('/me/')
                .then(response => {
                    setUser(response.data);
                })
                .catch(error => {
                    console.error("Failed to fetch user", error);
                    // Handle invalid token, e.g., by logging out
                    localStorage.removeItem('token');
                    setUser(null);
                });
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};