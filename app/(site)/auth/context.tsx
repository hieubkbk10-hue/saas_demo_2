'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LoginPromptModal } from '@/components/site/auth/LoginPromptModal';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type CustomerAuthContextType = {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionVerified: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

const CUSTOMER_TOKEN_KEY = 'customer_auth_token';
const CUSTOMER_COOKIE_KEY = 'customer_auth_token';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {return null;}
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') {return;}
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') {return;}
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {return null;}
    return localStorage.getItem(CUSTOMER_TOKEN_KEY) ?? getCookieValue(CUSTOMER_COOKIE_KEY);
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loginMutation = useMutation(api.auth.verifyCustomerLogin);
  const registerMutation = useMutation(api.auth.registerCustomer);
  const logoutMutation = useMutation(api.auth.logoutCustomer);

  const sessionResult = useQuery(
    api.auth.verifyCustomerSession,
    token ? { token } : 'skip'
  );

  const activeToken = sessionResult?.valid === false ? null : token;
  const isSessionVerified = !activeToken || sessionResult !== undefined;
  const isAuthenticated = Boolean(activeToken) && sessionResult?.valid === true;
  const isLoading = Boolean(activeToken) && sessionResult === undefined;

  const customer = sessionResult?.customer
    ? {
        email: sessionResult.customer.email,
        id: sessionResult.customer.id,
        name: sessionResult.customer.name,
        phone: sessionResult.customer.phone,
      }
    : null;

  useEffect(() => {
    if (token && sessionResult && !sessionResult.valid) {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      clearCookie(CUSTOMER_COOKIE_KEY);
    }
  }, [token, sessionResult]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginMutation({ email, password });
      if (result.success && result.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
        setCookie(CUSTOMER_COOKIE_KEY, result.token, 30);
        setToken(result.token);
      }
      return { message: result.message, success: result.success };
    } catch {
      return { message: 'Có lỗi xảy ra khi đăng nhập', success: false };
    }
  }, [loginMutation]);

  const register = useCallback(async (payload: { name: string; email: string; phone: string; password: string }) => {
    try {
      const result = await registerMutation(payload);
      if (result.success && result.token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
        setCookie(CUSTOMER_COOKIE_KEY, result.token, 30);
        setToken(result.token);
      }
      return { message: result.message, success: result.success };
    } catch {
      return { message: 'Có lỗi xảy ra khi đăng ký', success: false };
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
    }
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    clearCookie(CUSTOMER_COOKIE_KEY);
    setToken(null);
  }, [token, logoutMutation]);

  const openLoginModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ customer, isAuthenticated, isLoading, isSessionVerified, login, logout, openLoginModal, register }}>
      {children}
      <LoginPromptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return context;
}
