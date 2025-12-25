import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { SpecificationTab } from './components/SpecificationTab';
import { MethodTab } from './components/MethodTab';
import { AnalysisLotTab } from './components/AnalysisLotTab'; // 기존 AnalysisTab
import { ThermalTab } from './components/ThermalTab';
import { ImpurityTab } from './components/ImpurityTab';

export const UnifiedAnalysisTab = ({ material, updateMaterial, readOnly }) => {
    const [subTab, setSubTab] = useState('spec');

    const getTabClass = (id) => `px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 border ${subTab === id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="px-6 pt-4 pb-2 flex gap-2 shrink-0 overflow-x-auto border-b border-slate-200/50">
                <button onClick={() => setSubTab('spec')} className={getTabClass('spec')}><Icon name="file-text" size={14}/> Specification</button>
                <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                <button onClick={() => setSubTab('method')} className={getTabClass('method')}><Icon name="activity" size={14}/> HPLC Method</button>
                <button onClick={() => setSubTab('lot')} className={getTabClass('lot')}><Icon name="flask-conical" size={14}/> Lot Analysis</button>
                <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                <button onClick={() => setSubTab('thermal')} className={getTabClass('thermal')}><Icon name="thermometer" size={14}/> Thermal Test</button>
                <button onClick={() => setSubTab('impurity')} className={getTabClass('impurity')}><Icon name="alert-triangle" size={14}/> Impurity Profile</button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {subTab === 'spec' && <div className="h-full overflow-y-auto custom-scrollbar"><SpecificationTab material={material} updateMaterial={updateMaterial} readOnly={readOnly} /></div>}
                {subTab === 'method' && <div className="h-full"><MethodTab material={material} updateMaterial={updateMaterial} readOnly={readOnly} /></div>}
                {subTab === 'lot' && <div className="h-full"><AnalysisLotTab material={material} updateMaterial={updateMaterial} readOnly={readOnly} /></div>}
                {subTab === 'thermal' && <div className="h-full overflow-y-auto custom-scrollbar"><ThermalTab material={material} updateMaterial={updateMaterial} readOnly={readOnly} /></div>}
                {subTab === 'impurity' && <div className="h-full overflow-y-auto custom-scrollbar"><ImpurityTab material={material} updateMaterial={updateMaterial} readOnly={readOnly} /></div>}
            </div>
        </div>
    );
};