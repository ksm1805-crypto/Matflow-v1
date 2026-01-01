import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ProjectInventoryTab } from './ProjectInventoryTab'; 
import { ProductStockTab } from '../product/ProductStockTab'; 

// --- 1. 탭 버튼 다국어 정의 ---
const TRANSLATIONS = {
    ko: {
        tab_material: "원자재 재고",
        tab_product: "완제품 재고"
    },
    en: {
        tab_material: "Material Inventory",
        tab_product: "Product Stock"
    },
    zh: {
        tab_material: "原材料库存",
        tab_product: "产品库存"
    }
};

export const StockTab = ({ material, updateMaterial, readOnly, globalInventory, updateGlobalInventory, lang = 'ko' }) => { // lang 받기 (기본값 'ko')
    const t = (key) => TRANSLATIONS[lang][key] || key;
    const [subTab, setSubTab] = useState('raw');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Sub-tab Navigation */}
            <div className="px-6 pt-6 pb-0 flex gap-2 shrink-0">
                <button onClick={() => setSubTab('raw')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${subTab === 'raw' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                    <Icon name="package" size={14}/> {t('tab_material')}
                </button>
                <button onClick={() => setSubTab('product')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${subTab === 'product' ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                    <Icon name="layers" size={14}/> {t('tab_product')}
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {subTab === 'raw' ? (
                    <div className="h-full -mt-2">
                        {/* 원자재 재고 관리 (lang 전달) */}
                        <ProjectInventoryTab 
                            material={material} 
                            updateMaterial={updateMaterial} 
                            readOnly={readOnly}
                            globalInventory={globalInventory}
                            updateGlobalInventory={updateGlobalInventory}
                            lang={lang} // <--- 추가됨
                        />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto custom-scrollbar -mt-2">
                        {/* 완제품 재고 및 매출 관리 (lang 전달) */}
                        <ProductStockTab 
                            material={material} 
                            updateMaterial={updateMaterial} 
                            readOnly={readOnly} 
                            lang={lang} // <--- 추가됨
                        />
                    </div>
                )}
            </div>
        </div>
    );
};