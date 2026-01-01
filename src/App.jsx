/**
 * OLED Matflow v1.25 - Cloud Edition
 * Features: Undo/Redo, Unsaved Warning (Navigation/Reload), No Demo
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './services/api'; 
import { ROLES, PROJECT_STAGES } from './constants';
import { Icon } from './components/ui/Icon';
import { sanitizeMaterial } from './utils/sanitize';
import { INITIAL_GLOBAL_INVENTORY } from './utils/initialData';
import { KetcherModal } from './components/ui/KetcherModal';

// Feature Components
import { AuthScreen } from './features/auth/AuthScreen';
import { AdminUserPanel } from './features/admin/AdminUserPanel';
import { MasterStockTab } from './features/inventory/MasterStockTab';
import { CostTab } from './features/cost/CostTab';
import { RegressionTab } from './features/regression/RegressionTab';
import { UnifiedAnalysisTab } from './features/analysis/UnifiedAnalysisTab';
import { AnalysisHistoryTab } from './features/analysis/AnalysisHistoryTab';
import { StockTab } from './features/inventory/StockTab';
import { ProductionCalendarTab } from './features/production/ProductionCalendarTab';

// src/utils/tenant.js (유틸리티 함수)
export const getTenantId = () => {
  const host = window.location.hostname; // 예: samsung.mat-flow.com
  const parts = host.split('.');

  // 로컬 테스트(localhost) 환경 처리
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'test-company'; 
  }

  // 서브도메인이 존재하는 경우 (part가 3개 이상: samsung.mat-flow.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== 'www') return subdomain;
  }

  return 'main'; // 서브도메인이 없는 경우 (mat-flow.com)
};

// [1] useUndoHistory Hook (안전한 변경 감지 적용)
const useUndoHistory = (initialState, onModify) => {
    const [state, setState] = useState({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    // 상태 변경 로직을 공통 함수로 분리하여 onModify 처리
    const applyStateChange = useCallback((updater) => {
        setState(curr => {
            const next = updater(curr);
            if (next !== curr && onModify) {
                // 렌더링 사이클 충돌 방지를 위해 비동기 호출
                setTimeout(onModify, 0);
            }
            return next;
        });
    }, [onModify]);

    const undo = useCallback(() => {
        applyStateChange((curr) => {
            if (curr.past.length === 0) return curr;
            const previous = curr.past[curr.past.length - 1];
            const newPast = curr.past.slice(0, curr.past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [curr.present, ...curr.future]
            };
        });
    }, [applyStateChange]);

    const redo = useCallback(() => {
        applyStateChange((curr) => {
            if (curr.future.length === 0) return curr;
            const next = curr.future[0];
            const newFuture = curr.future.slice(1);
            return {
                past: [...curr.past, curr.present],
                present: next,
                future: newFuture
            };
        });
    }, [applyStateChange]);

    const set = useCallback((newPresent) => {
        applyStateChange((curr) => {
            if (curr.present === newPresent) return curr;
            return {
                past: [...curr.past, curr.present],
                present: newPresent,
                future: []
            };
        });
    }, [applyStateChange]);

    // 초기화 (변경 감지 안함)
    const reset = useCallback((newPresent) => {
        setState({
            past: [],
            present: newPresent,
            future: []
        });
    }, []);

    return [state.present, set, undo, redo, canUndo, canRedo, reset];
};

// --- 다국어 정의 ---
const TRANSLATIONS = {
    ko: {
        app_version: "v1.25 Cloud Edition (KO)",
        copyright: "Copyright © 2025 Sun Min Kim.\nAll rights reserved.",
        user_mgmt: "사용자 관리",
        projects_header: "프로젝트 목록",
        add_project_tooltip: "새 프로젝트 추가",
        loading_data: "데이터 불러오는 중...",
        logout: "로그아웃",
        tab_history: "이력",
        tab_analysis: "분석",
        tab_cost: "원가",
        tab_stock: "제품 재고",
        tab_master: "마스터 재고",
        tab_production: "생산 일정",
        tab_regression: "회귀 분석",
        btn_save: "클라우드 저장",
        btn_saving: "저장 중...",
        btn_create_new: "새 프로젝트 생성",
        ph_project_name: "프로젝트 명",
        ph_year: "YYYY",
        alert_save_success: "✅ 모든 데이터가 저장되었습니다.",
        alert_save_fail: "저장 실패: ",
        confirm_delete: "정말 이 프로젝트를 삭제하시겠습니까?",
        prompt_year: "프로젝트 연도 입력 (YYYY):",
        msg_select_project: "프로젝트를 선택하거나 새로 생성하세요.",
        undo: "실행 취소",
        redo: "다시 실행",
        warn_unsaved: "저장되지 않은 변경사항이 있습니다.\n무시하고 이동하시겠습니까?", // [경고 메시지]
        msg_unsaved_short: "저장 안 됨"
    },
    en: {
        app_version: "v1.25 Cloud Edition (EN)",
        copyright: "Copyright © 2025 Sun Min Kim.\nAll rights reserved.",
        user_mgmt: "User Management",
        projects_header: "PROJECTS",
        add_project_tooltip: "Add New Project",
        loading_data: "Loading Cloud Data...",
        logout: "Logout",
        tab_history: "History",
        tab_analysis: "Analysis",
        tab_cost: "Cost",
        tab_stock: "Product Stock",
        tab_master: "Master Stock",
        tab_production: "Production",
        tab_regression: "Regression",
        btn_save: "Save to Cloud",
        btn_saving: "Saving...",
        btn_create_new: "Create New Project",
        ph_project_name: "Project Name",
        ph_year: "YYYY",
        alert_save_success: "✅ Saved successfully.",
        alert_save_fail: "Save failed: ",
        confirm_delete: "Delete this project?",
        prompt_year: "Enter Project Year (YYYY):",
        msg_select_project: "Select or create a project.",
        undo: "Undo",
        redo: "Redo",
        warn_unsaved: "You have unsaved changes.\nDo you want to discard them?",
        msg_unsaved_short: "Unsaved"
    },
    zh: {
        app_version: "v1.25 云端版 (CN)",
        copyright: "版权所有 © 2025 Sun Min Kim.\n保留所有权利。",
        user_mgmt: "用户管理",
        projects_header: "项目列表",
        add_project_tooltip: "新建项目",
        loading_data: "正在加载...",
        logout: "退出",
        tab_history: "历史",
        tab_analysis: "分析",
        tab_cost: "成本",
        tab_stock: "库存",
        tab_master: "原料",
        tab_production: "日程",
        tab_regression: "回归",
        btn_save: "保存",
        btn_saving: "保存中...",
        btn_create_new: "新建",
        ph_project_name: "项目名称",
        ph_year: "年份",
        alert_save_success: "✅ 保存成功。",
        alert_save_fail: "保存失败：",
        confirm_delete: "确定删除？",
        prompt_year: "输入年份 (YYYY):",
        msg_select_project: "请选择或新建项目。",
        undo: "撤销",
        redo: "重做",
        warn_unsaved: "您有未保存的更改。\n要放弃它们吗？",
        msg_unsaved_short: "未保存"
    }
};

const MainApp = ({ currentUser, onLogout, globalInventory, updateGlobalInventory }) => {
    const [lang, setLang] = useState('ko');
    const t = (key) => TRANSLATIONS[lang][key] || key;

    // [변경 감지 상태]
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const markAsDirty = useCallback(() => setHasUnsavedChanges(true), []);

    // [Hooks]
    const [materials, setMaterials, undoMaterials, redoMaterials, canUndo, canRedo, resetMaterials] = useUndoHistory([], markAsDirty);
    const [productionEvents, setProductionEvents] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTab, setActiveTab] = useState('history');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getStageValue = (stage) => (typeof stage === 'object' ? (stage.id || stage.name) : stage);
    const activeMat = materials.find(m => m.id === activeId);

    const activeProjectEvents = useMemo(() => {
        if (!activeMat) return [];
        return productionEvents.filter(e => e.projectId === activeMat.id);
    }, [productionEvents, activeMat]);

    const handleUpdateProjectEvents = (updatedEventsForProject) => {
        if (!activeMat) return;
        markAsDirty(); // 일정 변경 시에도 저장 경고 트리거
        setProductionEvents(prevGlobalEvents => {
            const otherEvents = prevGlobalEvents.filter(e => e.projectId !== activeMat.id);
            return [...otherEvents, ...updatedEventsForProject];
        });
    };

    // [경고 1] 브라우저 이탈 방지 (새로고침, 닫기)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Standard for Chrome
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // [경고 2] 안전한 로그아웃
    const handleSafeLogout = () => {
        if (hasUnsavedChanges && !window.confirm(t('warn_unsaved'))) return;
        onLogout();
    };

    // [경고 3] 안전한 프로젝트 전환 핸들러
    const handleProjectSwitch = (newId) => {
        if (activeId === newId) return;
        if (hasUnsavedChanges && !window.confirm(t('warn_unsaved'))) return;
        setActiveId(newId);
        setShowAdminPanel(false);
    };

    // 1. Load Data
    useEffect(() => {
        const load = async () => {
            setIsDataLoading(true);
            try {
                const [matData, prodData] = await Promise.all([
                    api.materials.getAll(),
                    api.production.getAll()
                ]);
                const safeData = matData.map(m => sanitizeMaterial(m));
                
                resetMaterials(safeData);
                setProductionEvents(prodData || []);
                setHasUnsavedChanges(false); // 초기 로드 직후에는 변경 없음

                if (safeData.length > 0) setActiveId(safeData[0].id);
            } catch (error) {
                console.error("Load failed:", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        load();
    }, [resetMaterials]);

    // 2. Save Data
    const saveToCloud = async () => {
        if (isSaving || isDataLoading) return;
        setIsSaving(true);
        try {
            await Promise.all([
                api.materials.saveAll(materials),
                api.production.saveAll(productionEvents), 
                api.inventory.saveGlobal(globalInventory) 
            ]);
            setHasUnsavedChanges(false); // 저장 성공 시 변경 상태 해제
            alert(t('alert_save_success'));
        } catch (error) {
            console.error("Save failed:", error);
            alert(t('alert_save_fail') + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    saveToCloud();
                }
                if (e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        if (canRedo) redoMaterials();
                    } else {
                        if (canUndo) undoMaterials();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveToCloud, undoMaterials, redoMaterials, canUndo, canRedo]);

    const updateActiveMat = (newMat) => {
        setMaterials(materials.map(m => m.id === newMat.id ? newMat : m));
    };

    const handleProjectStructureSave = (smiles, mol, svg) => {
        if (!activeMat) return;
        updateActiveMat({ ...activeMat, structureSmiles: smiles, structureMol: mol, structureSvg: svg });
        setIsStructureModalOpen(false);
    };

    const addMat = () => {
        const defaultYear = new Date().getFullYear();
        const inputYear = window.prompt(t('prompt_year'), defaultYear);
        if (inputYear === null) return;
        const year = parseInt(inputYear, 10) || defaultYear;

        const newId = Date.now();
        const newMat = sanitizeMaterial({
            id: newId,
            name: `New Project ${new Date().toISOString().slice(0,10)}`,
            year: year,
            stage: 'PRE_MASS',
            lots: []
        });
        setMaterials([newMat, ...materials]);
        setActiveId(newId);
    };

    const handleDeleteProject = (e, projectId) => {
        e.stopPropagation(); 
        if (isReadOnlyMode) return;
        if (window.confirm(t('confirm_delete'))) {
            const newMaterials = materials.filter(m => m.id !== projectId);
            setMaterials(newMaterials);
            setProductionEvents(prev => prev.filter(ev => ev.projectId !== projectId));
            if (activeId === projectId) setActiveId(newMaterials.length > 0 ? newMaterials[0].id : null);
        }
    };

    const userRole = ROLES[currentUser.roleId] || ROLES.GUEST;
    const isReadOnlyMode = !userRole.canEdit;

    const materialsByYear = useMemo(() => {
        const groups = {};
        materials.forEach(m => {
            const y = m.year || new Date().getFullYear();
            if (!groups[y]) groups[y] = [];
            groups[y].push(m);
        });
        return Object.entries(groups).sort((a, b) => b[0] - a[0]);
    }, [materials]);

    const TABS = [
        { id: 'history', label: t('tab_history') },
        { id: 'analysis', label: t('tab_analysis') },
        { id: 'cost', label: t('tab_cost') },
        { id: 'stock', label: t('tab_stock') },
        { id: 'master', label: t('tab_master') },
        { id: 'production', label: t('tab_production') },
        { id: 'regression', label: t('tab_regression') }
    ].filter(t => !userRole.restrictedTabs?.includes(t.id));

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 shadow-lg">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xl mb-1">
                        <Icon name="layers" size={24} className="text-brand-600"/> OLED<span className="text-brand-600"> Matflow</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('app_version')}</div>
                </div>
                
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${currentUser.roleId === 'ADMIN' ? 'bg-purple-600' : 'bg-slate-600'}`}>
                            {currentUser.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</div>
                            <div className="text-[10px] text-brand-600 font-bold">{userRole.name}</div>
                        </div>
                        <button onClick={handleSafeLogout} title={t('logout')} className="text-slate-400 hover:text-rose-500 transition"><Icon name="log-out" size={16}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {currentUser.roleId === 'ADMIN' && (
                        <button 
                            onClick={() => setShowAdminPanel(true)} 
                            className={`w-full text-left p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition mb-4 ${showAdminPanel ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                        >
                            <Icon name="shield" size={16}/> {t('user_mgmt')}
                        </button>
                    )}
                    
                    <div className="text-xs font-bold text-slate-400 px-3 mb-2 mt-2 flex justify-between items-center">
                        <span>{t('projects_header')}</span>
                        {!isReadOnlyMode && (
                            <button onClick={addMat} className="text-brand-600 hover:bg-brand-50 rounded p-0.5 transition-colors" title={t('add_project_tooltip')}>
                                <Icon name="plus" size={14}/>
                            </button>
                        )}
                    </div>

                    {isDataLoading ? (
                        <div className="p-4 text-center text-xs animate-pulse">{t('loading_data')}</div>
                    ) : (
                        materialsByYear.map(([year, mats]) => (
                            <div key={year} className="mb-4">
                                <div className="flex items-center gap-2 px-3 mb-2">
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                    <span className="text-[10px] font-bold text-slate-400">{year}</span>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </div>
                                <div className="space-y-1">
                                    {mats.map(m => {
                                        const stageKey = getStageValue(m.stage);
                                        const stageInfo = PROJECT_STAGES[stageKey] || { name: stageKey, color: 'border-slate-200 text-slate-500' };
                                        
                                        return (
                                            <div 
                                                key={m.id} 
                                                onClick={() => handleProjectSwitch(m.id)} // [수정] 경고 적용된 핸들러
                                                className={`group flex justify-between items-center p-3 rounded-lg cursor-pointer transition border ${activeId===m.id && !showAdminPanel ? 'bg-white border-brand-200 shadow-md ring-1 ring-brand-100' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                <div className="overflow-hidden w-full">
                                                    <div className="flex justify-between items-start">
                                                        <div className={`font-bold truncate ${activeId===m.id && !showAdminPanel ? 'text-slate-800' : 'text-slate-600'}`}>{m.name}</div>
                                                        {!isReadOnlyMode && (
                                                            <button 
                                                                onClick={(e) => handleDeleteProject(e, m.id)}
                                                                className="hidden group-hover:block text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                                                            >
                                                                <Icon name="trash-2" size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={`text-[9px] inline-block px-1.5 py-0.5 rounded-full mt-1 border ${stageInfo.color} bg-white`}>
                                                        {stageInfo.name}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="text-[10px] text-center text-slate-400 font-medium leading-tight whitespace-pre-line">
                        {t('copyright')}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                {showAdminPanel ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                        <AdminUserPanel onClose={() => setShowAdminPanel(false)} />
                    </div>
                ) : (activeMat ? (
                    <>
                        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 z-10 flex justify-between items-center shadow-sm">
                            <div className="flex gap-4 items-center">
                                {/* 구조식 썸네일 */}
                                <div 
                                    onClick={() => !isReadOnlyMode && setIsStructureModalOpen(true)}
                                    className={`w-14 h-14 rounded-lg border bg-white flex items-center justify-center cursor-pointer overflow-hidden transition relative group shadow-sm ${
                                        activeMat.structureSvg ? 'border-brand-200' : 'border-slate-200 border-dashed hover:border-brand-400'
                                    }`}
                                >
                                    {activeMat.structureSvg ? (
                                        <div 
                                            className="w-full h-full p-1 flex items-center justify-center pointer-events-none [&_svg]:w-full [&_svg]:h-full"
                                            dangerouslySetInnerHTML={{ __html: activeMat.structureSvg }}
                                        />
                                    ) : (
                                        <Icon name="hexagon" size={20} className="text-slate-300 group-hover:text-brand-500 transition"/>
                                    )}
                                    {!isReadOnlyMode && (
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                            <Icon name="edit-2" size={14} className="text-slate-700"/>
                                        </div>
                                    )}
                                </div>

                                {/* 연도 수정 */}
                                <div className="flex items-baseline gap-2">
                                    <input 
                                        disabled={isReadOnlyMode} 
                                        type="number"
                                        className="bg-transparent text-lg font-bold text-slate-400 outline-none w-16 border-b-2 border-transparent hover:border-slate-300 focus:border-brand-500 transition text-right placeholder:text-slate-300" 
                                        value={activeMat.year} 
                                        onChange={e => updateActiveMat({...activeMat, year: parseInt(e.target.value) || new Date().getFullYear()})} 
                                        placeholder={t('ph_year')}
                                    />
                                    <span className="text-slate-300 text-xl font-light">/</span>
                                </div>

                                <input 
                                    disabled={isReadOnlyMode} 
                                    className="bg-transparent text-2xl font-black text-slate-800 outline-none w-64 border-b-2 border-transparent hover:border-slate-300 focus:border-brand-500 transition placeholder:text-slate-300" 
                                    value={activeMat.name} 
                                    onChange={e => updateActiveMat({...activeMat, name: e.target.value})} 
                                    placeholder={t('ph_project_name')}
                                />
                                <div className="relative group">
                                    <select 
                                        disabled={isReadOnlyMode} 
                                        className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer bg-white ${PROJECT_STAGES[getStageValue(activeMat.stage)]?.color || 'border-slate-200 text-slate-500'}`} 
                                        value={getStageValue(activeMat.stage)} 
                                        onChange={e => updateActiveMat({...activeMat, stage: e.target.value})}
                                    >
                                        {Object.values(PROJECT_STAGES).map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1.5 pointer-events-none text-current opacity-50"><Icon name="chevron-down" size={12}/></div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 items-center">
                                {/* Unsaved Indicator */}
                                {hasUnsavedChanges && (
                                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1 shadow-sm">
                                        <Icon name="alert-circle" size={12}/> {t('msg_unsaved_short')}
                                    </div>
                                )}

                                {!isReadOnlyMode && (
                                    <div className="flex gap-1 mr-2">
                                        <button onClick={undoMaterials} disabled={!canUndo} className="p-2 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent" title={`${t('undo')} (Ctrl+Z)`}><Icon name="rotate-ccw" size={16}/></button>
                                        <button onClick={redoMaterials} disabled={!canRedo} className="p-2 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent" title={`${t('redo')} (Ctrl+Shift+Z)`}><Icon name="rotate-cw" size={16}/></button>
                                    </div>
                                )}

                                <div className="flex bg-slate-100 rounded-lg p-1">
                                     <button onClick={() => setLang('ko')} className={`px-2 py-1 text-[10px] font-bold rounded transition ${lang === 'ko' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>KO</button>
                                    <div className="w-px bg-slate-200 my-1"></div>
                                    <button onClick={() => setLang('en')} className={`px-2 py-1 text-[10px] font-bold rounded transition ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>EN</button>
                                    <div className="w-px bg-slate-200 my-1"></div>
                                    <button onClick={() => setLang('zh')} className={`px-2 py-1 text-[10px] font-bold rounded transition ${lang === 'zh' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>CN</button>
                                </div>

                                <button 
                                    onClick={saveToCloud} 
                                    disabled={isSaving}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 text-white shadow-md transition-all active:scale-95 ${
                                        isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
                                    }`}
                                >
                                    <Icon name={isSaving ? "loader" : "cloud"} className={isSaving ? "animate-spin" : ""} size={16} />
                                    {isSaving ? t('btn_saving') : t('btn_save')}
                                </button>
                            </div>
                        </header>
                        
                        <div className="border-b border-slate-200 bg-white px-6 flex gap-6 overflow-x-auto shadow-sm z-0">
                            {TABS.map(t => (
                                <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab===t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                    {t.label.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <main className="flex-1 overflow-hidden relative custom-scrollbar bg-slate-50">
                            <div className="absolute inset-0 overflow-auto p-6">
                                {activeTab === 'history' && <AnalysisHistoryTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} lang={lang} />}
                                {activeTab === 'analysis' && <UnifiedAnalysisTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} lang={lang} />}
                                {activeTab === 'cost' && <CostTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} lang={lang} />}
                                {activeTab === 'stock' && <StockTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} lang={lang} />}
                                {activeTab === 'master' && <MasterStockTab globalInventory={globalInventory} updateGlobalInventory={updateGlobalInventory} readOnly={isReadOnlyMode} lang={lang} />}
                                {activeTab === 'production' && <ProductionCalendarTab events={activeProjectEvents} onUpdateEvents={handleUpdateProjectEvents} projectId={activeMat.id} projectName={activeMat.name} lang={lang} />}
                                {activeTab === 'regression' && <RegressionTab material={activeMat} lots={activeMat.lots} lang={lang} />}
                            </div>
                        </main>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <Icon name="layers" size={64} className="mb-4 opacity-10"/>
                        <p className="font-bold">{t('msg_select_project')}</p>
                        {!isReadOnlyMode && (
                            <button onClick={addMat} className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-lg hover:bg-brand-700 transition">
                                <Icon name="plus" size={16} className="inline mr-2"/> {t('btn_create_new')}
                            </button>
                        )}
                    </div>
                ))}

                {isStructureModalOpen && activeMat && (
                    <KetcherModal 
                        isOpen={isStructureModalOpen} 
                        onClose={() => setIsStructureModalOpen(false)} 
                        onSave={handleProjectStructureSave} 
                        initialSmiles={activeMat.structureSmiles} 
                    />
                )}
            </div>
        </div>
    );
};

const Root = () => {
    const [user, setUser] = useState(null);
    const [globalInventory, setGlobalInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const inv = await api.inventory.getGlobal();
                setGlobalInventory(inv.length > 0 ? inv : INITIAL_GLOBAL_INVENTORY);
            } catch (err) {
                console.error("Init Error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    if (isLoading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
            <Icon name="loader" className="animate-spin text-brand-600 mb-4" size={32}/>
            <div className="font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading Matflow...</div>
        </div>
    );

    if (!user) return <AuthScreen onLogin={setUser} />;

    return (
        <MainApp 
            currentUser={user} 
            onLogout={() => setUser(null)} 
            globalInventory={globalInventory} 
            updateGlobalInventory={setGlobalInventory} 
        />
    );
};

export default Root;