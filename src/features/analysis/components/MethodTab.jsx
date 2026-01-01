import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { generateId } from '../../../utils/math';
import { GradientChart } from '../../../components/charts/GradientChart';

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        loading_init: "초기화 중...",
        loading_method: "분석법 불러오는 중...",
        versions: "버전 목록",
        method_title: "분석법",
        
        // Conditions Card
        title_conditions: "분석 조건",
        inst: "기기 (Instrument)",
        inst_manual: "직접 입력 (Manual)",
        inst_placeholder: "기기 이름 입력",
        select_inst: "기기 선택...",
        col: "컬럼 (Column)",
        temp: "온도",
        flow: "유속",
        uv: "파장 (UV)",
        eluent: "이동상 (Eluent A/B)",
        ph_a: "A 용매",
        ph_b: "B 용매",
        
        // Gradient Card
        title_grad: "그라디언트 (Gradient)",
        time: "시간 (min)",
        b_pct: "B%",
        a_pct: "A%",
        add_step: "+ 단계 추가",
        
        // Chart
        title_profile: "그라디언트 프로파일",
        
        // Alert
        delete_confirm: "정말 삭제하시겠습니까?"
    },
    en: {
        loading_init: "Initializing...",
        loading_method: "Loading Method...",
        versions: "VERSIONS",
        method_title: "Method",
        
        title_conditions: "Conditions",
        inst: "Instrument",
        inst_manual: "Direct Input (Manual)",
        inst_placeholder: "Enter Instrument Name",
        select_inst: "Select Instrument...",
        col: "Column",
        temp: "Temp",
        flow: "Flow",
        uv: "UV (nm)",
        eluent: "Eluent A/B",
        ph_a: "A",
        ph_b: "B",
        
        title_grad: "Gradient",
        time: "Time",
        b_pct: "B%",
        a_pct: "A%",
        add_step: "+ Step",
        
        title_profile: "Gradient Profile",
        
        delete_confirm: "Delete?"
    },
    zh: {
        loading_init: "初始化中...",
        loading_method: "加载方法中...",
        versions: "版本列表",
        method_title: "分析方法",
        
        title_conditions: "分析条件",
        inst: "仪器 (Instrument)",
        inst_manual: "直接输入 (Manual)",
        inst_placeholder: "输入仪器名称",
        select_inst: "选择仪器...",
        col: "色谱柱 (Column)",
        temp: "温度",
        flow: "流速",
        uv: "波长 (UV)",
        eluent: "流动相 (Eluent A/B)",
        ph_a: "A 相",
        ph_b: "B 相",
        
        title_grad: "梯度 (Gradient)",
        time: "时间 (min)",
        b_pct: "B%",
        a_pct: "A%",
        add_step: "+ 添加步骤",
        
        title_profile: "梯度曲线",
        
        delete_confirm: "确定要删除吗？"
    }
};

const INSTRUMENT_OPTIONS = ['Waters', 'Thermo UPLC', 'Thermo HPLC'];

export const MethodTab = ({ material, updateMaterial, readOnly, lang = 'ko' }) => { // lang 기본값 'ko'
    const t = (key) => TRANSLATIONS[lang][key] || key; // 번역 헬퍼

    const methods = material.methods || [];
    const [activeVersionId, setActiveVersionId] = useState(methods.length > 0 ? methods[methods.length-1].id : null);
    const [isManualMode, setIsManualMode] = useState(false);
    
    useEffect(() => { 
        if (methods.length === 0 && !readOnly) addVersion(); 
        else if (!activeVersionId && methods.length > 0) setActiveVersionId(methods[methods.length-1].id); 
    }, [methods.length, activeVersionId]);

    const activeMethod = methods.find(m => m.id === activeVersionId);

    const updateMethod = (id, field, val) => { if (readOnly) return; updateMaterial({ ...material, methods: methods.map(m => m.id === id ? { ...m, [field]: val } : m) }); };
    const addVersion = () => { if (readOnly) return; const base = methods.length > 0 ? JSON.parse(JSON.stringify(methods[methods.length-1])) : {}; updateMaterial({ ...material, methods: [...methods, { ...base, id: generateId(), version: `v${methods.length+1}`, updatedAt: new Date().toISOString().slice(0,10), gradient: base.gradient || [{time:0, b:10}, {time:20, b:90}, {time:25, b:90}, {time:25.1, b:10}, {time:30, b:10}] }] }); };
    const removeVersion = (id) => { if(readOnly) return; if(!window.confirm(t('delete_confirm'))) return; const n = methods.filter(m => m.id !== id); updateMaterial({ ...material, methods: n }); if(activeVersionId === id) setActiveVersionId(n.length>0?n[n.length-1].id:null); };
    const updateGradient = (id, idx, f, v) => { if(readOnly) return; updateMethod(id, 'gradient', activeMethod.gradient.map((r,i)=>i===idx?{...r,[f]:v}:r)); };
    const addGrad = () => { if(readOnly) return; updateMethod(activeMethod.id, 'gradient', [...activeMethod.gradient, {time:'',b:''}]); };
    const delGrad = (idx) => { if(readOnly) return; updateMethod(activeMethod.id, 'gradient', activeMethod.gradient.filter((_,i)=>i!==idx)); };

    if (!activeMethod && methods.length === 0) return <div className="text-center p-10 text-slate-400">{t('loading_init')}</div>;
    if (!activeMethod) return <div className="text-center p-10 text-slate-400">{t('loading_method')}</div>;

    const isManual = isManualMode || (activeMethod && activeMethod.instrument && !INSTRUMENT_OPTIONS.includes(activeMethod.instrument));

    return (
        <div className="flex h-full bg-slate-50">
            {/* Left: Version List */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col"><div className="p-4 border-b border-slate-200 flex justify-between items-center"><span className="font-bold text-xs text-slate-500">{t('versions')}</span>{!readOnly && <button onClick={addVersion} className="text-brand-600"><Icon name="plus" size={14}/></button>}</div><div className="flex-1 overflow-y-auto p-2">{methods.slice().reverse().map(m=><div key={m.id} onClick={()=>setActiveVersionId(m.id)} className={`p-3 rounded-lg text-sm cursor-pointer mb-1 ${activeVersionId===m.id?'bg-purple-50 text-purple-700 font-bold border border-purple-200':'text-slate-600 hover:bg-slate-100'}`}>{m.version}<span className="block text-[10px] font-normal text-slate-400">{m.updatedAt}</span></div>)}</div></div>
            {/* Right: Method Detail */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="flex justify-between items-end border-b border-slate-200 pb-4"><h2 className="text-2xl font-bold text-slate-800">{t('method_title')} <span className="text-purple-600">{activeMethod.version}</span></h2>{!readOnly && <button onClick={()=>removeVersion(activeMethod.id)} className="text-rose-500 hover:text-rose-700"><Icon name="trash-2" size={18}/></button>}</div>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-4 space-y-6">
                        <Card title={t('title_conditions')} icon="activity">
                            <div className="space-y-3">
                                <div><label className="text-[10px] text-slate-400 block mb-1">{t('inst')}</label>
                                <select disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm outline-none" value={isManual ? 'Manual' : (activeMethod.instrument || '')} onChange={(e) => { if (e.target.value === 'Manual') { setIsManualMode(true); updateMethod(activeMethod.id, 'instrument', ''); } else { setIsManualMode(false); updateMethod(activeMethod.id, 'instrument', e.target.value); } }}><option value="" disabled>{t('select_inst')}</option>{INSTRUMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}<option value="Manual">{t('inst_manual')}</option></select>
                                {isManual && (<div className="mt-2 animate-in"><input disabled={readOnly} className="w-full bg-white border border-brand-200 rounded p-1.5 text-sm outline-none" placeholder={t('inst_placeholder')} value={activeMethod.instrument} onChange={e => updateMethod(activeMethod.id, 'instrument', e.target.value)} autoFocus/></div>)}</div>
                                <div><label className="text-[10px] text-slate-400 block mb-1">{t('col')}</label><input disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" value={activeMethod.column} onChange={e=>updateMethod(activeMethod.id,'column',e.target.value)}/></div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div><label className="text-[10px] text-slate-400 block mb-1">{t('temp')}</label><input disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" value={activeMethod.temp} onChange={e=>updateMethod(activeMethod.id,'temp',e.target.value)}/></div>
                                    <div><label className="text-[10px] text-slate-400 block mb-1">{t('flow')}</label><input disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" value={activeMethod.flowRate} onChange={e=>updateMethod(activeMethod.id,'flowRate',e.target.value)}/></div>
                                    <div><label className="text-[10px] text-slate-400 block mb-1">{t('uv')}</label><input disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" value={activeMethod.wavelength} onChange={e=>updateMethod(activeMethod.id,'wavelength',e.target.value)}/></div>
                                </div>
                                <div><label className="text-[10px] text-slate-400 block mb-1">{t('eluent')}</label><input disabled={readOnly} className="w-full bg-blue-50 border border-blue-100 rounded p-1.5 text-sm mb-1" value={activeMethod.mobilePhaseA} onChange={e=>updateMethod(activeMethod.id,'mobilePhaseA',e.target.value)} placeholder={t('ph_a')}/><input disabled={readOnly} className="w-full bg-emerald-50 border border-emerald-100 rounded p-1.5 text-sm" value={activeMethod.mobilePhaseB} onChange={e=>updateMethod(activeMethod.id,'mobilePhaseB',e.target.value)} placeholder={t('ph_b')}/></div>
                            </div>
                        </Card>
                    </div>
                    <div className="col-span-3"><Card title={t('title_grad')} icon="trending-up" className="h-full"><div className="overflow-hidden border border-slate-200 rounded-lg"><table className="w-full text-center text-sm"><thead className="bg-slate-100 text-xs text-slate-500"><tr><th>{t('time')}</th><th>{t('a_pct')}</th><th>{t('b_pct')}</th><th></th></tr></thead><tbody>{activeMethod.gradient.map((r,i)=><tr key={i} className="border-b border-slate-50"><td><input disabled={readOnly} className="w-full text-center bg-transparent" value={r.time} onChange={e=>updateGradient(activeMethod.id,i,'time',e.target.value)}/></td><td className="text-blue-500 font-mono">{(100-(parseFloat(r.b)||0)).toFixed(1)}</td><td><input disabled={readOnly} className="w-full text-center bg-transparent font-bold text-emerald-600" value={r.b} onChange={e=>updateGradient(activeMethod.id,i,'b',e.target.value)}/></td><td>{!readOnly && <button onClick={()=>delGrad(i)} className="text-slate-300 hover:text-rose-500">×</button>}</td></tr>)}</tbody></table></div>{!readOnly && <button onClick={addGrad} className="w-full mt-2 py-1 bg-slate-100 text-slate-500 text-xs rounded hover:bg-slate-200">{t('add_step')}</button>}</Card></div>
                    <div className="col-span-5"><div className="bg-white p-5 rounded-xl border border-slate-200 h-full flex flex-col"><h4 className="text-sm font-bold text-slate-700 mb-4">{t('title_profile')}</h4><div className="flex-1 min-h-[200px]"><GradientChart gradient={activeMethod.gradient}/></div></div></div>
                </div>
            </div>
        </div>
    );
};