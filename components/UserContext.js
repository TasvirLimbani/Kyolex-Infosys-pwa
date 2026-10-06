'use client';
import { createContext, useContext } from 'react';

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);
export const canManage = (u) => u && (u.role === 'admin' || u.role === 'manager');
