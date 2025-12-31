/**
 * OLED Matflow v1.17 - Added Project Structure Thumbnail & Ketcher Integration
 */
import React, { useState, useEffect, useMemo } from 'react';
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

const MainApp = ({ currentUser, onLogout, globalInventory, updateGlobalInventory }) => {
    const [materials, setMaterials] = useState([]);
    const [productionEvents, setProductionEvents] = useState([]);

    const [activeId, setActiveId] = useState(null);
    const [activeTab, setActiveTab] = useState('history');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    
    // 구조식 모달 상태
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getStageLabel = (stage) => (typeof stage === 'object' ? (stage.name || stage.id || 'Unknown') : stage);
    const getStageValue = (stage) => (typeof stage === 'object' ? (stage.id || stage.name) : stage);

    const activeMat = materials.find(m => m.id === activeId);

    // [변경] 현재 활성화된 프로젝트의 생산 일정만 필터링
    const activeProjectEvents = useMemo(() => {
        if (!activeMat) return [];
        // projectId가 없는 레거시 데이터 처리가 필요하다면 여기서 처리하거나, 
        // 새 일정은 무조건 projectId를 가지게 됨.
        return productionEvents.filter(e => e.projectId === activeMat.id);
    }, [productionEvents, activeMat]);

    // [변경] 프로젝트별 일정 업데이트 핸들러 (전체 목록에 병합)
    const handleUpdateProjectEvents = (updatedEventsForProject) => {
        if (!activeMat) return;

        setProductionEvents(prevGlobalEvents => {
            // 1. 현재 프로젝트가 아닌 다른 프로젝트들의 일정은 유지
            const otherEvents = prevGlobalEvents.filter(e => e.projectId !== activeMat.id);
            // 2. 현재 프로젝트의 수정된 일정을 합침
            return [...otherEvents, ...updatedEventsForProject];
        });
    };

    // 1. 데이터 초기 로드
    useEffect(() => {
        const load = async () => {
            setIsDataLoading(true);
            try {
                const [matData, prodData] = await Promise.all([
                    api.materials.getAll(),
                    api.production.getAll()
                ]);

                const safeData = matData.map(m => sanitizeMaterial(m));
                setMaterials(safeData);
                setProductionEvents(prodData || []);

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
            await Promise.all([
                api.materials.saveAll(materials),
                api.production.saveAll(productionEvents), // 전체 이벤트를 저장
                api.inventory.saveGlobal(globalInventory) 
            ]);
            
            const [refreshedMats, refreshedProds, refreshedInv] = await Promise.all([
                api.materials.getAll(),
                api.production.getAll(),
                api.inventory.getGlobal()
            ]);

            setMaterials(refreshedMats.map(m => sanitizeMaterial(m)));
            setProductionEvents(refreshedProds || []);
            
            if (refreshedInv && updateGlobalInventory) {
                updateGlobalInventory(refreshedInv);
            }
            
            alert("✅ 모든 데이터(프로젝트, 생산 일정, 마스터 재고)가 저장되었습니다.");
        } catch (error) {
            console.error("Save failed:", error);
            alert("저장 실패: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // 3. Global Keyboard Shortcut (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault(); 
                console.log("⌨️ Shortcut detected: Saving to Cloud...");
                saveToCloud();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveToCloud]);

    const updateActiveMat = (newMat) => {
        setMaterials(prev => prev.map(m => m.id === newMat.id ? newMat : m));
    };

    // 프로젝트 구조식 저장 핸들러
    const handleProjectStructureSave = (smiles, mol, svg) => {
        if (!activeMat) return;
        const updatedMat = {
            ...activeMat,
            structureSmiles: smiles || '',
            structureMol: mol || '',
            structureSvg: svg || ''
        };
        updateActiveMat(updatedMat);
        setIsStructureModalOpen(false);
    };

    const addMat = () => {
        const defaultYear = new Date().getFullYear();
        const inputYear = window.prompt("Enter Project Year (YYYY):", defaultYear);
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
        { id: 'history', label: 'History' },
        { id: 'analysis', label: 'Analysis' },
        { id: 'cost', label: 'Cost' },
        { id: 'stock', label: 'Product Stock' },
        { id: 'master', label: 'Master Stock' },
        { id: 'production', label: 'Production' },
        { id: 'regression', label: 'Regression' }
    ].filter(t => !userRole.restrictedTabs?.includes(t.id));

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            {/* 사이드바 */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 shadow-lg">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xl mb-1">
                        <Icon name="layers" size={24} className="text-brand-600"/> OLED<span className="text-brand-600"> Matflow</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">v1.17 Cloud Edition</div>
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
                    {currentUser.roleId === 'ADMIN' && (
                        <button 
                            onClick={() => setShowAdminPanel(true)} 
                            className={`w-full text-left p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition mb-4 ${showAdminPanel ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                        >
                            <Icon name="shield" size={16}/> User Management
                        </button>
                    )}
                    
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

            {/* 메인 콘텐츠 */}
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
                                    title={isReadOnlyMode ? "Structure View" : "Click to Draw Structure"}
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
                                        placeholder="YYYY"
                                    />
                                    <span className="text-slate-300 text-xl font-light">/</span>
                                </div>

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
                                    title="Shortcut: Ctrl+S"
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
                                {activeTab === 'stock' && <StockTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />}
                                {activeTab === 'master' && <MasterStockTab globalInventory={globalInventory} updateGlobalInventory={updateGlobalInventory} readOnly={isReadOnlyMode} />}
                                
                                {/* [변경] Production 탭에 필터링된 이벤트, 업데이트 핸들러, 프로젝트 ID 전달 */}
                                {activeTab === 'production' && (
                                    <ProductionCalendarTab 
                                        events={activeProjectEvents} 
                                        onUpdateEvents={handleUpdateProjectEvents}
                                        projectId={activeMat.id}
                                        projectName={activeMat.name}
                                    />
                                )}
                                
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

                {/* Ketcher Modal */}
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