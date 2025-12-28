/**
 * src/constants.js
 * 앱 전역에서 사용하는 상수 정의
 */

// 사용자 권한 정의
export const ROLES = {
    ADMIN: { 
        name: 'Admin', 
        canEdit: true, 
        manageUsers: true, 
        restrictedTabs: [] 
    },
    RESEARCHER: { 
        name: 'Researcher', 
        canEdit: true, 
        manageUsers: false, 
        restrictedTabs: ['master'] 
    }, 
    USER: { 
        name: 'User', 
        canEdit: true, 
        manageUsers: false, 
        restrictedTabs: [] 
    },
    GUEST: { 
        name: 'Guest', 
        canEdit: false, 
        manageUsers: false, 
        restrictedTabs: ['cost', 'master'] 
    }
};

// 프로젝트 진행 단계 정의
export const PROJECT_STAGES = {
    LAB_TEST: { id: 'LAB_TEST', name: 'Lab Test', color: 'border-slate-200 text-slate-600' },
    PRE_MASS: { id: 'PRE_MASS', name: 'Pre-Mass', color: 'border-blue-200 text-blue-600' },
    MASS_PROD: { id: 'MASS_PROD', name: 'Mass Production', color: 'border-green-200 text-green-600' },
    HOLD: { id: 'HOLD', name: 'On Hold', color: 'border-orange-200 text-orange-600' },
    DROP: { id: 'DROP', name: 'Dropped', color: 'border-red-200 text-red-600' }
};

// [추가] 금속 불순물 분석 항목 (분석 탭에서 사용)
export const STANDARD_METALS = [
    'Fe', 'Na', 'K', 'Ca', 'Cr', 'Ni', 'Mg', 'Cu'
];

// [추가] 할로겐 원소 (필요 시 사용)
export const HALOGENS = [
    'F', 'Cl', 'Br', 'I'
];