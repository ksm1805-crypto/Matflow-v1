export const ROLES = {
    ADMIN: { id: 'ADMIN', name: 'Administrator', canEdit: true, manageUsers: true, restrictedTabs: [] },
    RESEARCHER: { id: 'RESEARCHER', name: 'Researcher', canEdit: true, manageUsers: false, restrictedTabs: [] },
    GUEST: { id: 'GUEST', name: 'Guest Viewer', canEdit: false, manageUsers: false, restrictedTabs: ['specification', 'analysis', 'thermal', 'cost', 'impurity', 'regression'] }
};

export const PROJECT_STAGES = {
    DEV: { id: 'DEV', name: 'Development', color: 'text-amber-600 border-amber-200 bg-amber-50' },
    PRE_MASS: { id: 'PRE_MASS', name: 'Pre-Mass', color: 'text-blue-600 border-blue-200 bg-blue-50' },
    MASS: { id: 'MASS', name: 'Mass Production', color: 'text-emerald-600 border-emerald-200 bg-emerald-50' }
};

export const STANDARD_METALS = ['Fe', 'Na', 'K', 'Ca', 'Cr', 'Ni', 'Mg', 'Cu'];
export const VALID_KEYS = [
    "SONG-DAEH-OITC-HEM1", "MANA-RECO-PRIN-CE82", "OLED-FORE-EVER-2026",
    "OLED-2025-USER-0001", "SAMS-UNGD-ISPL-2025", "LGDI-SPLA-YCOR-2025"
    // ... (필요 시 기존 HTML의 키 목록 전체 복사)
];