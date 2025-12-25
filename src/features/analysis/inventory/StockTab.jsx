import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ProjectInventoryTab } from './ProjectInventoryTab'; // 아래에서 작성
import { ProductStockTab } from '../product/ProductStockTab'; // 아래에서 작성

export const StockTab = ({ material, updateMaterial, readOnly, globalInventory, updateGlobalInventory }) => {
    const [subTab, setSubTab] = useState('raw');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Sub-tab Navigation */}
            <div className="px-6 pt-6 pb-0 flex gap-2 shrink-0">
                <button onClick={() => setSubTab('raw')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${subTab === 'raw' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                    <Icon name="package" size={14}/> Material Inventory
                </button>
                <button onClick={() => setSubTab('product')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${subTab === 'product' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                    <Icon name="layers" size={14}/> Product Stock
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {subTab === 'raw' ? (
                    <div className="h-full -mt-2">
                        {/* 원자재 재고 관리 (좌우 분할 화면) */}
                        <ProjectInventoryTab 
                            material={material} 
                            updateMaterial={updateMaterial} 
                            readOnly={readOnly}
                            globalInventory={globalInventory}
                            updateGlobalInventory={updateGlobalInventory}
                        />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto custom-scrollbar -mt-2">
                        {/* 완제품 재고 및 매출 관리 */}
                        <ProductStockTab material={material} updateMaterial={updateMaterial} readOnly={readOnly} />
                    </div>
                )}
            </div>
        </div>
    );
};