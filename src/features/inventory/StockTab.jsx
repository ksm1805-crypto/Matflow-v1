import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
// 아래 두 컴포넌트가 각각 원자재, 완제품 화면입니다.
import { ProjectInventoryTab } from './ProjectInventoryTab'; 
import { ProductStockTab } from '../product/ProductStockTab';

export const StockTab = ({ material, updateMaterial, readOnly, globalInventory, updateGlobalInventory }) => {
    // 'raw'이면 원자재 화면, 'product'이면 완제품 화면을 보여줍니다.
    const [subTab, setSubTab] = useState('raw');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* 1. 상단 서브탭 버튼 (여기서 나뉩니다) */}
            <div className="px-6 pt-6 pb-0 flex gap-2 shrink-0">
                <button 
                    onClick={() => setSubTab('raw')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${subTab === 'raw' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}
                >
                    <Icon name="package" size={14}/> Material Inventory
                </button>
                <button 
                    onClick={() => setSubTab('product')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${subTab === 'product' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}
                >
                    <Icon name="layers" size={14}/> Product Stock
                </button>
            </div>

            {/* 2. 실제 내용 표시 영역 */}
            <div className="flex-1 overflow-hidden relative">
                {subTab === 'raw' ? (
                    // [원자재 탭] : 좌측 마스터DB / 우측 프로젝트 사용량 (좌우 분할 화면)
                    <div className="h-full -mt-2">
                        <ProjectInventoryTab 
                            material={material} 
                            updateMaterial={updateMaterial} 
                            readOnly={readOnly}
                            globalInventory={globalInventory}
                            updateGlobalInventory={updateGlobalInventory}
                        />
                    </div>
                ) : (
                    // [완제품 탭] : 출하 기록 및 매출 대시보드
                    <div className="h-full overflow-y-auto custom-scrollbar -mt-2">
                        <ProductStockTab 
                            material={material} 
                            updateMaterial={updateMaterial} 
                            readOnly={readOnly} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};