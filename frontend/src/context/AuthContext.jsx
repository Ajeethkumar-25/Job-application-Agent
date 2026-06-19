import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, email, full_name }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while validating stored token on mount

  // ── Axios interceptor: attach token to every request ──────────────────────
  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      const t = localStorage.getItem('linkerai_token');
      if (t) config.headers['Authorization'] = `Bearer ${t}`;
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  // ── On mount: validate any stored token ───────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('linkerai_token');
    if (!stored) {
      setLoading(false);
      return;
    }
    axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` }
    })
      .then(res => {
        setToken(stored);
        setUser(res.data);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem('linkerai_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((tokenStr, userData) => {
    localStorage.setItem('linkerai_token', tokenStr);
    setToken(tokenStr);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('linkerai_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
