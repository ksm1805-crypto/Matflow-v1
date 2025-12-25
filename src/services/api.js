/**
 * OLED Matflow v1.0
 * Copyright (c) 2025 Sun Min Kim. All rights reserved.
 */
import { VALID_KEYS } from '../constants';

export const STORAGE_KEY = 'oled_matflow_data';
export const LICENSE_KEY = 'oled_matflow_license';
export const USERS_DB_KEY = 'oled_users';
export const INVENTORY_DB_KEY = 'oled_global_inventory';

// 백엔드 기본 주소 (본인의 서버 IP로 수정하세요)
const BACKEND_URL = 'http://192.168.123.121:3000/api';

// 날짜 차이 계산 헬퍼
const getDaysDifference = (dateString) => {
    if (!dateString) return 9999; 
    const activationDate = new Date(dateString);
    if (isNaN(activationDate.getTime())) return 9999;
    const today = new Date();
    const diffTime = Math.abs(today - activationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// 백엔드 호출 공통 함수 (에러 발생 시 null 반환하여 로컬 저장 유도)
const fetchWithErrorHandling = async (url, options) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Server response not ok');
        return await response.json();
    } catch (e) {
        console.warn(`백엔드 서버 연결 실패(${url}), 로컬 모드로 전환합니다.`);
        return null;
    }
};

export const api = {
    users: {
        getAll: async () => {
            const data = await fetchWithErrorHandling(`${BACKEND_URL}/users`, { method: 'GET' });
            if (data) return data;
            // 서버 실패 시 로컬스토리지 사용
            try { return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]'); } 
            catch { return []; }
        },
        saveAll: async (data) => {
            const result = await fetchWithErrorHandling(`${BACKEND_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            // 서버 저장 성공 시 return, 실패 시 로컬스토리지 저장
            if (result) return result;
            return localStorage.setItem(USERS_DB_KEY, JSON.stringify(data));
        },
    },

    inventory: {
        getGlobal: async () => {
            const data = await fetchWithErrorHandling(`${BACKEND_URL}/inventory`, { method: 'GET' });
            if (data) return data;
            try { return JSON.parse(localStorage.getItem(INVENTORY_DB_KEY) || '[]'); }
            catch { return []; }
        },
        saveGlobal: async (data) => {
            const result = await fetchWithErrorHandling(`${BACKEND_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (result) return result;
            return localStorage.setItem(INVENTORY_DB_KEY, JSON.stringify(data));
        },
    },

    materials: {
        getAll: async () => {
            const data = await fetchWithErrorHandling(`${BACKEND_URL}/materials`, { method: 'GET' });
            if (data) return data;
            try {
                const localData = localStorage.getItem(STORAGE_KEY);
                return localData ? JSON.parse(localData) : [];
            } catch (e) {
                return [];
            }
        },
<<<<<<< HEAD
            saveAll: async (data) => {
    const response = await fetch('http://[서버IP]:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}
=======
        saveAll: async (data) => {
            const result = await fetchWithErrorHandling(`${BACKEND_URL}/materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (result) return result;
            
            // 서버 실패 시 로컬에 저장
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
>>>>>>> b0ad74a34279bd004346e10b1d89009268f0f422
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
