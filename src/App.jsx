/**
 * OLED Matflow v1.11 - UI Restored with Add Project & Cloud Storage
 */
import React, { useState, useEffect, useMemo } from 'react';
import { api } from './services/api'; 
import { ROLES, PROJECT_STAGES } from './constants';
import { Icon } from './components/ui/Icon';
import { sanitizeMaterial } from './utils/sanitize';
import { INITIAL_GLOBAL_INVENTORY } from './utils/initialData';

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

const MainApp = ({ currentUser, onLogout, globalInventory, updateGlobalInventory }) => {
    const [materials, setMaterials] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTab, setActiveTab] = useState('history');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // [에러 해결] Stage 라벨/값 추출 함수
    const getStageLabel = (stage) => (typeof stage === 'object' ? (stage.name || stage.id || 'Unknown') : stage);
    const getStageValue = (stage) => (typeof stage === 'object' ? (stage.id || stage.name) : stage);
    const getStageColor = (stage) => (typeof stage === 'object' ? (stage.color || 'bg-slate-100 text-slate-500 border-slate-200') : 'bg-slate-100 text-slate-500 border-slate-200');

    // 1. 데이터 초기 로드
    useEffect(() => {
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await api.materials.getAll();
                const safeData = data.map(m => sanitizeMaterial(m));
                setMaterials(safeData);
                if (safeData.length > 0) setActiveId(safeData[0].id);
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        load();
    }, []);

    // 2. 클라우드 저장
    const saveToCloud = async () => {
        if (isSaving || isDataLoading) return;
        setIsSaving(true);
        try {
            await api.materials.saveAll(materials);
            const refreshed = await api.materials.getAll();
            setMaterials(refreshed.map(m => sanitizeMaterial(m)));
            alert("✅ 모든 데이터와 파일이 클라우드에 저장되었습니다.");
        } catch (error) {
            console.error("Save failed:", error);
            alert("저장 실패: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateActiveMat = (newMat) => {
        setMaterials(prev => prev.map(m => m.id === newMat.id ? newMat : m));
    };

    // [복구됨] 새 프로젝트 추가 함수
    const addMat = () => {
        const newId = Date.now();
        const newMat = sanitizeMaterial({
            id: newId,
            name: `New Project ${new Date().toISOString().slice(0,10)}`,
            year: new Date().getFullYear(),
            stage: 'PRE_MASS', // 문자열로 저장 (객체 X)
            lots: []
        });
        setMaterials([newMat, ...materials]);
        setActiveId(newId);
    };

    const activeMat = materials.find(m => m.id === activeId);
    const userRole = ROLES[currentUser.roleId] || ROLES.GUEST;
    const isReadOnlyMode = !userRole.canEdit;

    // 사이드바 연도별 그룹화 로직
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
        { id: 'history', label: 'History' },
        { id: 'analysis', label: 'Analysis' },
        { id: 'cost', label: 'Cost' },
        { id: 'stock', label: 'Inventory' },
        { id: 'master', label: 'Master Stock' },
        { id: 'production', label: 'Production' },
        { id: 'regression', label: 'Regression' }
    ].filter(t => !userRole.restrictedTabs?.includes(t.id));

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            {/* 사이드바 (예전 디자인 복원) */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 shadow-lg">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xl mb-1">
                        <Icon name="layers" size={24} className="text-brand-600"/> OLED<span className="text-brand-600"> Matflow</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">v1.11 Cloud Edition</div>
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
                        <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition"><Icon name="log-out" size={16}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {/* 관리자 메뉴 */}
                    {currentUser.roleId === 'ADMIN' && (
                        <button 
                            onClick={() => setShowAdminPanel(true)} 
                            className={`w-full text-left p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition mb-4 ${showAdminPanel ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                        >
                            <Icon name="shield" size={16}/> User Management
                        </button>
                    )}
                    
                    {/* 프로젝트 추가 헤더 (복원됨) */}
                    <div className="text-xs font-bold text-slate-400 px-3 mb-2 mt-2 flex justify-between items-center">
                        <span>PROJECTS</span>
                        {!isReadOnlyMode && (
                            <button onClick={addMat} className="text-brand-600 hover:bg-brand-50 rounded p-0.5 transition-colors" title="Add New Project">
                                <Icon name="plus" size={14}/>
                            </button>
                        )}
                    </div>

                    {isDataLoading ? (
                        <div className="p-4 text-center text-xs animate-pulse">Loading Cloud Data...</div>
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
                                                onClick={()=>{setActiveId(m.id); setShowAdminPanel(false)}} 
                                                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition border ${activeId===m.id && !showAdminPanel ? 'bg-white border-brand-200 shadow-md ring-1 ring-brand-100' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                <div className="overflow-hidden w-full">
                                                    <div className={`font-bold truncate ${activeId===m.id && !showAdminPanel ? 'text-slate-800' : 'text-slate-600'}`}>{m.name}</div>
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
                    <div className="text-[10px] text-center text-slate-400 font-medium leading-tight">
                        Copyright © 2025 <span className="text-slate-600 font-bold">Sun Min Kim</span>.<br/>
                        All rights reserved.
                    </div>
                </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                {showAdminPanel ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                        <AdminUserPanel onClose={() => setShowAdminPanel(false)} />
                    </div>
                ) : (activeMat ? (
                    <>
                        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 z-10 flex justify-between items-center shadow-sm">
                            <div className="flex gap-4 items-center">
                                <input 
                                    disabled={isReadOnlyMode} 
                                    className="bg-transparent text-2xl font-black text-slate-800 outline-none w-64 border-b-2 border-transparent hover:border-slate-300 focus:border-brand-500 transition placeholder:text-slate-300" 
                                    value={activeMat.name} 
                                    onChange={e => updateActiveMat({...activeMat, name: e.target.value})} 
                                    placeholder="Project Name"
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
                            <div className="flex gap-2">
                                <button 
                                    onClick={saveToCloud} 
                                    disabled={isSaving}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 text-white shadow-md transition-all active:scale-95 ${
                                        isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
                                    }`}
                                >
                                    <Icon name={isSaving ? "loader" : "cloud"} className={isSaving ? "animate-spin" : ""} size={16} />
                                    {isSaving ? "Saving..." : "Save to Cloud"}
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
                                {activeTab === 'history' && <AnalysisHistoryTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />}
                                {activeTab === 'analysis' && <UnifiedAnalysisTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />}
                                {activeTab === 'cost' && <CostTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />}
                                {activeTab === 'stock' && <StockTab material={activeMat} updateMaterial={updateActiveMat} globalInventory={globalInventory} updateGlobalInventory={updateGlobalInventory} readOnly={isReadOnlyMode} />}
                                {activeTab === 'master' && <MasterStockTab globalInventory={globalInventory} updateGlobalInventory={updateGlobalInventory} readOnly={isReadOnlyMode} />}
                                {activeTab === 'production' && <ProductionCalendarTab />}
                                {activeTab === 'regression' && <RegressionTab material={activeMat} />}
                            </div>
                        </main>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <Icon name="layers" size={64} className="mb-4 opacity-10"/>
                        <p className="font-bold">Select a project to start or create a new one.</p>
                        {!isReadOnlyMode && (
                            <button onClick={addMat} className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-lg hover:bg-brand-700 transition">
                                <Icon name="plus" size={16} className="inline mr-2"/> Create New Project
                            </button>
                        )}
                    </div>
                ))}
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
                console.error("초기화 에러:", err);
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