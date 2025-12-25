/**
 * OLED Matflow v1.0
 * Copyright (c) 2025 Sun Min Kim. All rights reserved.
 * * This source code is the intellectual property of Sun Min Kim.
 */
import { VALID_KEYS } from '../constants';

// [수정] 외부 export 추가
export const STORAGE_KEY = 'oled_matflow_data';
export const LICENSE_KEY = 'oled_matflow_license';
export const USERS_DB_KEY = 'oled_users';
export const INVENTORY_DB_KEY = 'oled_global_inventory';

// 날짜 차이 계산 헬퍼
const getDaysDifference = (dateString) => {
    if (!dateString) return 9999; 
    const activationDate = new Date(dateString);
    if (isNaN(activationDate.getTime())) return 9999;
    
    const today = new Date();
    const diffTime = Math.abs(today - activationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export const api = {
    users: {
        getAll: () => {
            try { return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]'); } 
            catch { return []; }
        },
        saveAll: (data) => localStorage.setItem(USERS_DB_KEY, JSON.stringify(data)),
    },
    inventory: {
        getGlobal: () => {
            try { return JSON.parse(localStorage.getItem(INVENTORY_DB_KEY) || '[]'); }
            catch { return []; }
        },
        saveGlobal: (data) => localStorage.setItem(INVENTORY_DB_KEY, JSON.stringify(data)),
    },
    materials: {
        getAll: async () => {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error("Data Parse Error", e);
                return [];
            }
        },
        saveAll: async (data) => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        }
    },
    
    license: {
        get: async () => {
            const stored = localStorage.getItem(LICENSE_KEY);
            if (!stored) return { isValid: false, isExpired: false };

            try {
                const parsed = JSON.parse(stored);
                if (!parsed || typeof parsed !== 'object' || !parsed.key) {
                    throw new Error("Invalid format");
                }

                const { key, activationDate } = parsed;
                
                if (!VALID_KEYS.includes(key)) return { isValid: false, isExpired: false };

                const daysPassed = getDaysDifference(activationDate);
                const isExpired = daysPassed > 365;

                return { 
                    isValid: true, 
                    isExpired: isExpired, 
                    daysLeft: 365 - daysPassed,
                    activationDate 
                };
            } catch (e) {
                localStorage.removeItem(LICENSE_KEY);
                return { isValid: false, isExpired: false };
            }
        },
        activate: async (key) => {
            if (VALID_KEYS.includes(key)) {
                const data = {
                    key: key,
                    activationDate: new Date().toISOString()
                };
                localStorage.setItem(LICENSE_KEY, JSON.stringify(data));
                return { success: true };
            }
            return { success: false };
        }
    }
};