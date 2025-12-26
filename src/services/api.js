/**
 * OLED Matflow v1.0
 * Copyright (c) 2025 Sun Min Kim. All rights reserved.
 */
import { VALID_KEYS } from '../constants';

export const STORAGE_KEY = 'oled_matflow_data';
export const LICENSE_KEY = 'oled_matflow_license';
export const USERS_DB_KEY = 'oled_users';
export const INVENTORY_DB_KEY = 'oled_global_inventory';

// 백엔드 기본 주소
const BACKEND_URL = 'http://192.168.123.121:5000/api';

// 날짜 차이 계산 헬퍼
const getDaysDifference = (dateString) => {
    if (!dateString) return 9999; 
    const activationDate = new Date(dateString);
    if (isNaN(activationDate.getTime())) return 9999;
    const today = new Date();
    const diffTime = Math.abs(today - activationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

/**
 * [핵심] 서버 상태를 2초 안에 체크하는 함수
 */
const checkServerHealth = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2초 타임아웃
        const response = await fetch(`${BACKEND_URL}/materials`, { 
            method: 'GET', 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (e) {
        return false;
    }
};

/**
 * 공통 Fetch 함수
 */
const fetchWithErrorHandling = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Server response not ok');
        return await response.json();
    } catch (e) {
        console.warn(`⚠️ 서버 통신 실패: ${url}`);
        return null;
    }
};

export const api = {
    users: {
        getAll: async () => {
            const isAlive = await checkServerHealth();
            if (isAlive) {
                const data = await fetchWithErrorHandling(`${BACKEND_URL}/users`, { method: 'GET' });
                if (data) return data;
            }
            return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
        },
        saveAll: async (data) => {
            const isAlive = await checkServerHealth();
            if (isAlive) {
                await fetchWithErrorHandling(`${BACKEND_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            return localStorage.setItem(USERS_DB_KEY, JSON.stringify(data));
        },
    },

    inventory: {
        getGlobal: async () => {
            const isAlive = await checkServerHealth();
            if (isAlive) {
                const data = await fetchWithErrorHandling(`${BACKEND_URL}/inventory`, { method: 'GET' });
                if (data) return data;
            }
            return JSON.parse(localStorage.getItem(INVENTORY_DB_KEY) || '[]');
        },
        saveGlobal: async (data) => {
            const isAlive = await checkServerHealth();
            if (isAlive) {
                await fetchWithErrorHandling(`${BACKEND_URL}/inventory`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            return localStorage.setItem(INVENTORY_DB_KEY, JSON.stringify(data));
        },
    },

    materials: {
        getAll: async () => {
            const isAlive = await checkServerHealth();
            if (isAlive) {
                const data = await fetchWithErrorHandling(`${BACKEND_URL}/materials`, { method: 'GET' });
                if (data) return data;
            }
            const localData = localStorage.getItem(STORAGE_KEY);
            return localData ? JSON.parse(localData) : [];
        },
        saveAll: async (data) => {
            const isAlive = await checkServerHealth();
            if (isAlive) {
                await fetchWithErrorHandling(`${BACKEND_URL}/materials`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            // 서버 저장 여부와 상관없이 로컬에 항상 최신본 유지 (하이브리드 핵심)
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
                const { key, activationDate } = parsed;
                if (!VALID_KEYS.includes(key)) return { isValid: false, isExpired: false };
                const daysPassed = getDaysDifference(activationDate);
                const isExpired = daysPassed > 365;
                return { 
                    isValid: true, isExpired: isExpired, 
                    daysLeft: 365 - daysPassed, activationDate 
                };
            } catch (e) {
                localStorage.removeItem(LICENSE_KEY);
                return { isValid: false, isExpired: false };
            }
        },
        activate: async (key) => {
            if (VALID_KEYS.includes(key)) {
                const data = { key: key, activationDate: new Date().toISOString() };
                localStorage.setItem(LICENSE_KEY, JSON.stringify(data));
                return { success: true };
            }
            return { success: false };
        }
    }
};