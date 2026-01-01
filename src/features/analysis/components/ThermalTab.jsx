// src/features/analysis/components/ThermalTab.jsx
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { SizeSlider } from '../../../components/ui/SizeSlider';
import { generateId } from '../../../utils/math';

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        tab_ampoule: "앰플 테스트",
        tab_residue: "잔류물 테스트",
        
        // Ampoule Test
        title_ampoule: "앰플 열안정성",
        col_step: "단계",
        col_temp: "온도",
        col_hplc: "HPLC",
        col_image: "이미지",
        col_life: "수명",
        col_plot: "플롯",
        
        // Residue Test
        title_residue: "잔류물 평가",
        add_test: "테스트 추가",
        test_no: "테스트 #",
        lot_no: "Lot 번호",
        lot_placeholder: "Lot 번호 입력",
        purity: "HPLC 순도 (%)",
        lifetime: "수명 (%)",
        label_residue: "잔류물",
        label_device: "소자",
        no_data: "추가된 잔류물 테스트가 없습니다.",
        delete_confirm: "삭제하시겠습니까?"
    },
    en: {
        tab_ampoule: "Ampoule Test",
        tab_residue: "Residue Test",
        
        title_ampoule: "Ampoule Thermal Stability",
        col_step: "Step",
        col_temp: "Temp",
        col_hplc: "HPLC",
        col_image: "Image",
        col_life: "Lifetime",
        col_plot: "Plot",
        
        title_residue: "Residue Evaluation",
        add_test: "Add Test",
        test_no: "Test #",
        lot_no: "Lot No.",
        lot_placeholder: "Enter Lot No.",
        purity: "HPLC Purity (%)",
        lifetime: "Lifetime (%)",
        label_residue: "Residue",
        label_device: "Device",
        no_data: "No residue tests added.",
        delete_confirm: "Delete?"
    },
    zh: {
        tab_ampoule: "安瓿测试",
        tab_residue: "残留物测试",
        
        title_ampoule: "安瓿热稳定性",
        col_step: "步骤",
        col_temp: "温度",
        col_hplc: "HPLC",
        col_image: "图像",
        col_life: "寿命",
        col_plot: "图表",
        
        title_residue: "残留物评估",
        add_test: "添加测试",
        test_no: "测试 #",
        lot_no: "批次号",
        lot_placeholder: "输入批次号",
        purity: "HPLC 纯度 (%)",
        lifetime: "寿命 (%)",
        label_residue: "残留物",
        label_device: "器件",
        no_data: "未添加残留物测试。",
        delete_confirm: "删除？"
    }
};

export const ThermalTab = ({ material, updateMaterial, readOnly, lang = 'ko' }) => { // lang 기본값 'ko'
    const t = (key) => TRANSLATIONS[lang][key] || key; // 번역 헬퍼

    const [subTab, setSubTab] = useState('ampoule');
    const [residueImgSize, setResidueImgSize] = useState(100);
    const residueData = material.residueData || [];
    
    const addResidue = () => { if(!readOnly) updateMaterial({ ...material, residueData: [...residueData, { id: generateId(), lotId: '', hplc: '', residueImg: null, deviceImg: null, lifetime: '' }] }); };
    
    const updateResidue = (id, f, v) => { if(!readOnly) updateMaterial({ ...material, residueData: residueData.map(r => r.id===id ? {...r, [f]:v} : r) }); };
    
    const removeResidue = (id) => { if(!readOnly && window.confirm(t('delete_confirm'))) updateMaterial({ ...material, residueData: residueData.filter(r => r.id !== id) }); };

    return (
        <div className="p-6 space-y-6">
            <div className="flex gap-2 mb-4">
                <button onClick={() => setSubTab('ampoule')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${subTab === 'ampoule' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500 hover:text-slate-700'}`}>{t('tab_ampoule')}</button>
                <button onClick={() => setSubTab('residue')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${subTab === 'residue' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500 hover:text-slate-700'}`}>{t('tab_residue')}</button>
            </div>

            {subTab === 'ampoule' ? (
                <Card title={t('title_ampoule')} icon="thermometer" color="text-amber-600">
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="text-slate-500 border-b border-slate-200 bg-slate-50"><tr><th className="p-3">{t('col_step')}</th><th className="p-3">{t('col_temp')}</th><th className="p-3">{t('col_hplc')}</th><th className="p-3">{t('col_image')}</th><th className="p-3">{t('col_life')}</th><th className="p-3">{t('col_plot')}</th></tr></thead>
                        <tbody>
                            {(material.thermalData || []).map((row, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="p-3 font-bold text-slate-500">{i+1}</td>
                                    <td className="p-3"><input disabled={readOnly} className="bg-white border border-slate-300 rounded p-1 w-full text-center" value={row.temp} onChange={e=>{const n=[...material.thermalData]; n[i].temp=e.target.value; updateMaterial({...material, thermalData:n})}}/></td>
                                    <td className="p-3"><input disabled={readOnly} className="bg-white border border-slate-300 rounded p-1 w-full text-center" value={row.hplc} onChange={e=>{const n=[...material.thermalData]; n[i].hplc=e.target.value; updateMaterial({...material, thermalData:n})}}/></td>
                                    <td className="p-3 h-24"><ImageUploader value={row.hplcImg} onChange={v=>{const n=[...material.thermalData]; n[i].hplcImg=v; updateMaterial({...material, thermalData:n})}} label="Img" readOnly={readOnly}/></td>
                                    <td className="p-3"><input disabled={readOnly} className="bg-white border border-slate-300 rounded p-1 w-full text-center" value={row.device} onChange={e=>{const n=[...material.thermalData]; n[i].device=e.target.value; updateMaterial({...material, thermalData:n})}}/></td>
                                    <td className="p-3 h-24"><ImageUploader value={row.deviceImg} onChange={v=>{const n=[...material.thermalData]; n[i].deviceImg=v; updateMaterial({...material, thermalData:n})}} label="Plot" readOnly={readOnly}/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h4 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Icon name="thermometer" className="text-rose-500"/> {t('title_residue')}</h4><div className="flex gap-2"><SizeSlider value={residueImgSize} onChange={setResidueImgSize} />{!readOnly && <button onClick={addResidue} className="bg-brand-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-500 text-white transition"><Icon name="plus" size={14}/> {t('add_test')}</button>}</div></div>
                    <div className="grid grid-cols-1 gap-6">
                        {residueData.map((item, index) => (
                            <Card key={item.id} className="relative">
                                {!readOnly && <button onClick={() => removeResidue(item.id)} className="absolute top-4 right-14 text-slate-400 hover:text-rose-500"><Icon name="trash-2" size={16}/></button>}
                                <h5 className="text-sm font-bold text-slate-500 mb-4 uppercase">{t('test_no')}{index + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">{t('lot_no')}</label><input disabled={readOnly} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-700 outline-none" placeholder={t('lot_placeholder')} value={item.lotId} onChange={e=>updateResidue(item.id, 'lotId', e.target.value)}/></div>
                                    <div><label className="text-xs font-bold text-brand-600 uppercase block mb-1">{t('purity')}</label><input disabled={readOnly} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 font-bold" placeholder="99.9" value={item.hplc} onChange={e=>updateResidue(item.id, 'hplc', e.target.value)}/></div>
                                    <div><label className="text-xs font-bold text-emerald-600 uppercase block mb-1">{t('lifetime')}</label><input disabled={readOnly} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 font-bold" placeholder="100" value={item.lifetime} onChange={e=>updateResidue(item.id, 'lifetime', e.target.value)}/></div>
                                    <div className="grid grid-cols-2 gap-2" style={{ height: `${residueImgSize}px` }}><div className="h-full bg-slate-50 border border-slate-200 rounded overflow-hidden"><ImageUploader value={item.residueImg} onChange={v => updateResidue(item.id, 'residueImg', v)} label={t('label_residue')} readOnly={readOnly}/></div><div className="h-full bg-slate-50 border border-slate-200 rounded overflow-hidden"><ImageUploader value={item.deviceImg} onChange={v => updateResidue(item.id, 'deviceImg', v)} label={t('label_device')} readOnly={readOnly}/></div></div>
                                </div>
                            </Card>
                        ))}
                        {residueData.length === 0 && <div className="text-center py-10 text-slate-400 border border-dashed border-slate-300 rounded-xl">{t('no_data')}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};