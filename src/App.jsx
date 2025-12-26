/**
 * OLED Matflow v1.0
 * Copyright (c) 2025 Sun Min Kim. All rights reserved.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from './services/api'; // License 체크용으로 유지
import { ROLES, PROJECT_STAGES } from './constants';
import { Icon } from './components/ui/Icon';
import { sanitizeMaterial } from './utils/sanitize';

// [중요] IndexedDB 유틸리티 불러오기 (db.js가 있어야 함)
import { saveToDB, loadFromDB } from './utils/db';

// 초기 데이터 import
import { EXAMPLE_LOTS, EXAMPLE_INVENTORY, DEFAULT_USERS, INITIAL_GLOBAL_INVENTORY } from './utils/initialData';

// Feature Components
import { AuthScreen } from './features/auth/AuthScreen';
import { LicenseScreen } from './features/license/LicenseScreen';
import { AdminUserPanel } from './features/admin/AdminUserPanel';
import { MasterStockTab } from './features/inventory/MasterStockTab';
import { CostTab } from './features/cost/CostTab';
import { RegressionTab } from './features/regression/RegressionTab';
import { UnifiedAnalysisTab } from './features/analysis/UnifiedAnalysisTab';
import { AnalysisHistoryTab } from './features/analysis/AnalysisHistoryTab';
import { StockTab } from './features/inventory/StockTab';

// -----------------------------------------------------------------------------
// 1. Main Application Component (로그인 후 화면)
// -----------------------------------------------------------------------------
const MainApp = ({ currentUser, onLogout, users, setUsers, isLicenseExpired, globalInventory, updateGlobalInventory }) => {
    const [materials, setMaterials] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTab, setActiveTab] = useState('history');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const fileInputRef = useRef(null);
    
    // 초기 데이터 로드 (Materials) - IndexedDB 사용
    useEffect(() => {
        const load = async () => {
            try {
                // [수정] api.materials.getAll() -> loadFromDB
                let data = await loadFromDB('oled_materials');
                
                if (!data || data.length === 0) {
                    const dummy = sanitizeMaterial({ 
                        name: 'GH_unknown_Project', 
                        stage: 'PRE_MASS', 
                        lots: EXAMPLE_LOTS, 
                        inventory: EXAMPLE_INVENTORY 
                    });
                    data = [dummy];
                    // [수정] api.materials.saveAll -> saveToDB
                    await saveToDB('oled_materials', data);
                } else {
                    data = data.map(sanitizeMaterial);
                }
                setMaterials(data);
                if(data.length > 0 && !activeId) setActiveId(data[0].id);
            } catch (error) {
                console.error("Failed to load materials:", error);
            }
        };
        load();
    }, [activeId]);

    const saveAll = async () => { 
        if(isLicenseExpired) { alert("License Expired."); return; }
        try {
            // [수정] api.materials.saveAll -> saveToDB
            await saveToDB('oled_materials', materials);
            alert("Saved successfully! (IndexedDB)");
        } catch (error) {
            console.error("Save failed:", error);
            alert("Save failed: " + error);
        }
    };

    const updateActiveMat = (newMat) => {
        setMaterials(prev => prev.map(m => m.id === newMat.id ? newMat : m));
    };

    // [기능] 프로젝트 추가 시 연도 입력 Prompt
    const addMat = () => { 
        if(isLicenseExpired) { alert("License Expired."); return; }
        
        const currentYear = new Date().getFullYear();
        // window.prompt 사용 (Electron 환경에서는 커스텀 모달 권장하지만 웹에서는 동작)
        const inputYear = window.prompt("Enter Project Year:", currentYear);
        
        if (inputYear === null) return; // 취소 시 중단

        const year = parseInt(inputYear, 10);
        if (isNaN(year) || year < 2000 || year > 2100) {
            alert("Please enter a valid 4-digit year (e.g., 2025).");
            return;
        }

        const m = sanitizeMaterial({ name: 'New Project', year: year }); 
        setMaterials([...materials, m]); 
        setActiveId(m.id); 
    };

    const exportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(materials));
        const a = document.createElement('a'); a.href = dataStr; a.download = "oled_matflow_backup.json"; a.click(); a.remove();
    };

    const handleImport = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try { 
                const loaded = JSON.parse(ev.target.result).map(sanitizeMaterial);
                setMaterials(loaded); 
                if(loaded.length) setActiveId(loaded[0].id);
                alert("Loaded!"); 
            } catch (err) { alert("Error loading file."); }
        };
        reader.readAsText(file); e.target.value = null;
    };

    const activeMat = materials.find(m => m.id === activeId);
    const userRole = ROLES[currentUser.roleId];
    const isReadOnlyMode = isLicenseExpired ? true : !userRole.canEdit;

    // 사이드바 연도별 그룹핑
    const materialsByYear = useMemo(() => {
        const groups = {}; 
        materials.forEach(m => { 
            const y = m.year || new Date().getFullYear(); 
            if (!groups[y]) groups[y] = []; 
            groups[y].push(m); 
        });
        return Object.entries(groups).sort((a, b) => b[0] - a[0]);
    }, [materials]);

    const renderContent = () => {
        if (!activeMat) return <div className="flex-1 flex items-center justify-center text-slate-400">Select Project</div>;

        if (activeTab === 'stock') {
            return <StockTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} globalInventory={globalInventory} updateGlobalInventory={updateGlobalInventory} />;
        }
        if (activeTab === 'history') return <AnalysisHistoryTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />;
        if (activeTab === 'analysis') return <UnifiedAnalysisTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />;
        if (activeTab === 'cost') return <CostTab material={activeMat} updateMaterial={updateActiveMat} readOnly={isReadOnlyMode} />;
        if (activeTab === 'regression') return <RegressionTab material={activeMat} lots={activeMat.lots} />;
        
        if (activeTab === 'master') {
            return <MasterStockTab globalInventory={globalInventory} updateGlobalInventory={updateGlobalInventory} materials={materials} readOnly={isReadOnlyMode} />;
        }
        
        return null;
    };

    const TABS = [
        { id: 'history', label: 'History' }, 
        { id: 'analysis', label: 'Analysis' }, 
        { id: 'cost', label: 'Cost' },
        { id: 'stock', label: 'Inventory' }, 
        { id: 'master', label: 'Master Stock' },
        { id: 'regression', label: 'Regression' }
    ].filter(t => !userRole.restrictedTabs?.includes(t.id));

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col z-20 shadow-lg">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xl mb-1"><Icon name="layers" size={24} className="text-brand-600"/> OLED<span className="text-brand-600"> Matflow</span></div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">v1.0 Analysis</div>
                </div>
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${currentUser.roleId === 'ADMIN' ? 'bg-purple-600' : 'bg-slate-600'}`}>{currentUser.username.substring(0,2).toUpperCase()}</div>
                        <div className="flex-1 overflow-hidden"><div className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</div><div className="text-[10px] text-brand-600 font-bold">{userRole.name}</div></div>
                        <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition"><Icon name="log-out" size={16}/></button>
                    </div>
                    {isLicenseExpired && <div className="mt-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded text-center">LICENSE EXPIRED</div>}
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {userRole.manageUsers && <button onClick={() => setShowAdminPanel(true)} className={`w-full text-left p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition mb-4 ${showAdminPanel ? 'bg-purple-600 text-white shadow-md' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}><Icon name="shield" size={16}/> User Management</button>}
                    
                    <div className="text-xs font-bold text-slate-400 px-3 mb-2 mt-2 flex justify-between items-center">
                        <span>PROJECTS</span>
                        {!isLicenseExpired && (
                            <button onClick={addMat} className="text-brand-600 hover:bg-brand-50 rounded p-0.5" title="Add New Project">
                                <Icon name="plus" size={14}/>
                            </button>
                        )}
                    </div>

                    {materialsByYear.map(([year, mats]) => (
                        <div key={year} className="mb-4">
                            <div className="flex items-center gap-2 px-3 mb-2"><div className="h-px bg-slate-200 flex-1"></div><span className="text-[10px] font-bold text-slate-400">{year}</span><div className="h-px bg-slate-200 flex-1"></div></div>
                            <div className="space-y-1">
                                {mats.map(m => (
                                    <div key={m.id} onClick={()=>{setActiveId(m.id); setShowAdminPanel(false)}} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition border ${activeId===m.id && !showAdminPanel ? 'bg-white border-brand-200 shadow-md ring-1 ring-brand-100' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                                        <div className="overflow-hidden"><div className={`font-bold truncate ${activeId===m.id && !showAdminPanel ? 'text-slate-800' : 'text-slate-600'}`}>{m.name}</div><div className={`text-[10px] inline-block px-1.5 rounded-full mt-1 border ${PROJECT_STAGES[m.stage]?.color}`}>{PROJECT_STAGES[m.stage]?.name}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="text-[10px] text-center text-slate-400 font-medium leading-tight">
                        Copyright © 2025 <span className="text-slate-600 font-bold">Sun Min Kim</span>.<br/>
                        All rights reserved.
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                 {isLicenseExpired && <div className="bg-rose-600 text-white text-xs font-bold text-center py-1 z-50 shadow-md">LICENSE EXPIRED - READ ONLY MODE.</div>}
                 {showAdminPanel ? (
                     <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                         {/* [수정] AdminUserPanel에 전달하는 setUsers를 DB 저장 기능과 연동 */}
                         <AdminUserPanel 
                             users={users} 
                             setUsers={(newUsers) => {
                                 setUsers(newUsers);
                                 saveToDB('oled_users', newUsers);
                             }} 
                         />
                     </div>
                 ) : (activeMat ? (
                    <>
                        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 z-10 flex justify-between items-center shadow-sm">
                            <div className="flex gap-4 items-center">
                                <input disabled={isReadOnlyMode} className="bg-transparent text-2xl font-black text-slate-800 outline-none w-64 border-b-2 border-transparent hover:border-slate-300 focus:border-brand-500 transition" value={activeMat.name} onChange={e => updateActiveMat({...activeMat, name: e.target.value})} />
                                <div className="relative group">
                                    <select disabled={isReadOnlyMode} className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer bg-white ${PROJECT_STAGES[activeMat.stage].color}`} value={activeMat.stage} onChange={e => updateActiveMat({...activeMat, stage: e.target.value})}>{Object.values(PROJECT_STAGES).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                                    <div className="absolute right-2 top-1.5 pointer-events-none text-current opacity-50"><Icon name="chevron-down" size={12}/></div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={exportData} className="bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 p-2 rounded-lg transition shadow-sm"><Icon name="download" size={18}/></button>
                                {userRole.canEdit && !isLicenseExpired && (<><button onClick={() => fileInputRef.current.click()} className="bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 p-2 rounded-lg transition shadow-sm"><Icon name="upload" size={18}/></button><input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} /><div className="w-px h-8 bg-slate-200 mx-1"></div><button onClick={saveAll} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-brand-200 transition"><Icon name="save" size={16}/> Save</button></>)}
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
                            {renderContent()}
                        </main>
                    </>
                 ) : <div className="flex-1 flex items-center justify-center text-slate-400">Select Project</div>)}
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// 2. Root Component (진입점 & 데이터 로딩 & 인증)
// -----------------------------------------------------------------------------
const Root = () => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [globalInventory, setGlobalInventory] = useState([]);
    const [hasValidLicense, setHasValidLicense] = useState(false);
    const [isLicenseExpired, setIsLicenseExpired] = useState(false);
    const [checkingLicense, setCheckingLicense] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                // [수정] Users 로드 (IndexedDB)
                const storedUsers = await loadFromDB('oled_users');
                if (storedUsers && storedUsers.length > 0) setUsers(storedUsers);
                else { 
                    setUsers(DEFAULT_USERS); 
                    await saveToDB('oled_users', DEFAULT_USERS); 
                }

                // [수정] Global Inventory 로드 (IndexedDB)
                const storedInv = await loadFromDB('oled_inventory');
                if (storedInv && storedInv.length > 0) setGlobalInventory(storedInv);
                else { 
                    setGlobalInventory(INITIAL_GLOBAL_INVENTORY); 
                    await saveToDB('oled_inventory', INITIAL_GLOBAL_INVENTORY); 
                }

                // License는 로직이 포함되어 있을 수 있으므로 기존 api 유지
                const licenseData = await api.license.get();
                if (licenseData.isValid) {
                    setHasValidLicense(true);
                    if (licenseData.isExpired) setIsLicenseExpired(true);
                } else {
                    setHasValidLicense(false);
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setCheckingLicense(false);
            }
        };
        init();
    }, []);

    const handleLicenseActivate = async () => {
        setHasValidLicense(true);
        setIsLicenseExpired(false);
        // 라이선스 활성화 시 로직이 있다면 여기에 api 호출 추가 가능
    };

    if (checkingLicense) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 font-bold">Initializing System...</div>;
    if (!hasValidLicense) return <LicenseScreen onActivate={handleLicenseActivate} />;
    if (!user) return <AuthScreen onLogin={setUser} users={users} setUsers={setUsers} />;

    return (
        <MainApp 
            currentUser={user} 
            onLogout={()=>setUser(null)} 
            users={users} 
            setUsers={(newUsers) => {
                setUsers(newUsers);
                saveToDB('oled_users', newUsers);
            }} 
            isLicenseExpired={isLicenseExpired} 
            globalInventory={globalInventory} 
            updateGlobalInventory={(inv) => { 
                setGlobalInventory(inv); 
                // [수정] Inventory 저장 (IndexedDB)
                saveToDB('oled_inventory', inv);
            }} 
        />
    );
};

export default Root;