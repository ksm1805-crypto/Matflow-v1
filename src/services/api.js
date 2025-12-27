/**
 * OLED Matflow v1.0
 * Copyright (c) 2025 Sun Min Kim. All rights reserved.
 */
import { VALID_KEYS } from '../constants';

export const STORAGE_KEY = 'oled_matflow_data';
export const LICENSE_KEY = 'oled_matflow_license';
export const USERS_DB_KEY = 'oled_users';
export const INVENTORY_DB_KEY = 'oled_global_inventory';

// [중요] 실제 백엔드가 없으므로, 타임아웃을 아주 짧게 잡거나 로컬우선으로 변경
const BACKEND_URL = 'http://127.0.0.1:5000/api'; // 로컬호스트로 변경 (안전)

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
 * 서버 상태 체크 (백엔드 없으면 무조건 false 반환하여 로컬 모드로 전환)
 */
const checkServerHealth = async () => {
    // 백엔드 서버가 준비되기 전까지는 무조건 false(오프라인 모드)로 리턴하여
    // 불필요한 "Connection Failed" 에러를 방지합니다.
    return false; 

    /* 나중에 백엔드 연결 시 아래 주석 해제
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const response = await fetch(`${BACKEND_URL}/materials`, { 
            method: 'GET', 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (e) {
        return false;
    }
    */
};

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
                
                // 저장된 키 검증 (공백 제거)
                if (!key || !VALID_KEYS.includes(key.trim())) {
                    return { isValid: false, isExpired: false };
                }

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

        // [핵심 수정] 무조건 로컬에서만 검증 (네트워크 타임아웃 방지)
        activate: async (inputKey) => {
            // 1. 공백 제거 (사용자가 복붙할 때 생긴 공백 해결)
            const cleanKey = inputKey ? inputKey.toString().trim() : '';

            console.log(`Trying to activate with key: '${cleanKey}'`); // 디버깅용

            // 2. Constants 파일의 키 목록과 비교
            if (VALID_KEYS.includes(cleanKey)) {
                const data = { key: cleanKey, activationDate: new Date().toISOString() };
                localStorage.setItem(LICENSE_KEY, JSON.stringify(data));
                return { success: true };
            }
            
            // 3. 실패 시 명확히 false 리턴
            console.warn('Activation failed: Key not found in VALID_KEYS');
            return { success: false, message: 'Invalid License Key' };
        }
    }
};