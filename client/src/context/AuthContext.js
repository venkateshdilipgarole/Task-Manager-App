// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api'; // Centralized Axios instance

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token'),
    user: null,
    loading: true,
  });

  useEffect(() => {
    const loadUser = async () => {
      if (auth.token) {
        try {
          // Fetch user data from backend
          const response = await api.get('https://task-manager-backend-0kn7.onrender.com/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${auth.token}`
            }
          });
          setAuth(prevAuth => ({
            ...prevAuth,
            user: response.data,
            loading: false
          }));
        } catch (err) {
          console.error('Error fetching user:', err.response?.data || err.message);
          localStorage.removeItem('token');
          setAuth({
            token: null,
            user: null,
            loading: false
          });
        }
      } else {
        setAuth(prevAuth => ({ ...prevAuth, loading: false }));
      }
    };

    loadUser();
  }, [auth.token]); // Added auth.token as a dependency

  const login = (token) => {
    localStorage.setItem('token', token);
    setAuth(prevAuth => ({ ...prevAuth, token, loading: true }));
    // User data will be fetched by useEffect when auth.token changes
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth({
      token: null,
      user: null,
      loading: false
    });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
