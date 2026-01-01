import React, { useState, useMemo } from 'react';
import { Icon } from '../../components/ui/Icon';
import { calculateLotMetrics, recalculateMols } from '../../utils/math';
import { fmtK, fmtN } from '../../utils/format';

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        select_lot: "LOT 선택",
        msg_select_lot: "Lot을 선택해주세요.",
        
        // Header
        cost_sim: "비용 시뮬레이션",
        lot_label: "Lot:",
        
        // Guide (수정됨: 총 소요일 추가)
        guide_title: "사용 가이드",
        guide_desc: "1. [목표 분자량], [일일 공정비], [총 소요일]을 먼저 입력하세요.\n2. 엑셀에서 [재료명, 분자량, 가격, 당량] 순서로 복사해 붙여넣기 가능합니다.\n3. [이론 생산량]을 입력하면 필요한 재료량이 자동 역산됩니다.",

        // Output Panel
        output: "생산량 (Output)",
        total_yield: "총 수율",
        theoretical_g: "이론 생산량 (g)",
        actual_g: "실제 생산량 (g)",
        sub_1: "승화 1 (Sub 1)",
        sub_2: "승화 2 (Sub 2)",
        
        // Global Parameters
        target_mw: "목표 분자량",
        process_day: "일일 공정비",
        total_days: "총 소요일",
        unit_cost: "단가 (Unit Cost)",
        
        // Placeholders
        ph_target_mw: "예: 500.5",
        ph_process_day: "예: 150000",
        ph_days: "예: 3",
        ph_theo_g: "목표 g 입력",
        ph_step_name: "단계명 (예: Suzuki)",
        ph_mat_name: "재료명 (예: Ir(ppy)3)",
        ph_mw: "0.00",
        ph_price: "0",
        ph_eq: "1.0",
        
        // Units & Currency (KRW)
        currency: "₩",          
        unit_price_label: "(원/kg)", 
        unit_cost_label: "원/g",     
        
        // Steps
        step_prefix: "단계", 
        yield: "수율",
        
        // Table Headers
        th_material: "재료명",
        th_mw: "분자량",
        th_price: "가격",
        th_eq: "당량 (Eq)",
        th_mol: "몰 (Mol)",
        th_cost: "비용",
        
        // Buttons
        add_material: "+ 재료 추가",
        add_step_btn: "합성 단계 추가"
    },
    en: {
        select_lot: "SELECT LOT",
        msg_select_lot: "Select Lot",
        
        cost_sim: "Cost Simulation",
        lot_label: "Lot:",
        
        // Guide (Updated)
        guide_title: "Quick Guide",
        guide_desc: "1. Set [Target MW], [Process/Day], & [Total Days] first.\n2. Copy & Paste [Name, MW, Price, Eq] from Excel directly.\n3. Edit [Theoretical Output] to reverse-calculate required materials.",
        
        output: "Output",
        total_yield: "Total Yield",
        theoretical_g: "Theoretical (g)",
        actual_g: "Actual (g)",
        sub_1: "Sub 1",
        sub_2: "Sub 2",
        
        target_mw: "Target MW",
        process_day: "Process/Day",
        total_days: "Total Days",
        unit_cost: "Unit Cost",
        
        // Placeholders
        ph_target_mw: "e.g. 500.5",
        ph_process_day: "e.g. 150",
        ph_days: "e.g. 3",
        ph_theo_g: "Target g",
        ph_step_name: "Step Name",
        ph_mat_name: "Mat Name",
        ph_mw: "0.00",
        ph_price: "0",
        ph_eq: "1.0",
        
        // Units & Currency (USD)
        currency: "$",
        unit_price_label: "($/kg)",
        unit_cost_label: "$/g",
        
        step_prefix: "Step",
        yield: "Yield",
        
        th_material: "Material",
        th_mw: "MW",
        th_price: "Price",
        th_eq: "Eq",
        th_mol: "Mol",
        th_cost: "Cost",
        
        add_material: "+ Add Material",
        add_step_btn: "Add Synthesis Step"
    },
    zh: {
        select_lot: "选择批次",
        msg_select_lot: "请选择批次",
        
        cost_sim: "成本模拟",
        lot_label: "批次:",
        
        // Guide (Updated)
        guide_title: "使用指南",
        guide_desc: "1. 请先设置 [目标分子量], [日加工费] 和 [总天数]。\n2. 可从 Excel 复制 [名称, 分子量, 价格, 当量] 并直接粘贴。\n3. 修改 [理论产量] 可自动反算所需材料量。",
        
        output: "产量 (Output)",
        total_yield: "总收率",
        theoretical_g: "理论产量 (g)",
        actual_g: "实际产量 (g)",
        sub_1: "升华 1",
        sub_2: "升华 2",
        
        target_mw: "目标分子量",
        process_day: "加工费/天",
        total_days: "总天数",
        unit_cost: "单价",
        
        // Placeholders
        ph_target_mw: "例如: 500.5",
        ph_process_day: "例如: 1000",
        ph_days: "例如: 3",
        ph_theo_g: "目标产量",
        ph_step_name: "步骤名称",
        ph_mat_name: "材料名称",
        ph_mw: "0.00",
        ph_price: "0",
        ph_eq: "1.0",
        
        // Units & Currency (CNY)
        currency: "¥",
        unit_price_label: "(¥/kg)", 
        unit_cost_label: "¥/g",
        
        step_prefix: "步骤",
        yield: "收率",
        
        th_material: "材料名称",
        th_mw: "分子量",
        th_price: "价格",
        th_eq: "当量 (Eq)",
        th_mol: "摩尔 (Mol)",
        th_cost: "成本",
        
        add_material: "+ 添加材料",
        add_step_btn: "添加合成步骤"
    }
};

export const CostTab = ({ material, updateMaterial, readOnly, lang = 'ko' }) => { 
    const t = (key) => TRANSLATIONS[lang][key] || key; 

    const [activeLotId, setActiveLotId] = useState(material.lots[0]?.id || null);
    
    const activeLot = material.lots.find(l => l.id === activeLotId);
    const costData = activeLot ? activeLot.costData : null;

    const updateCost = (newCostData) => {
        if(readOnly) return;
        const metrics = calculateLotMetrics(newCostData);
        updateMaterial({ 
            ...material, 
            lots: material.lots.map(l => l.id === activeLotId ? { ...l, costData: newCostData, ...metrics } : l) 
        });
    };

    const updateStep = (id, field, val) => {
        if(readOnly) return;
        const newSteps = costData.steps.map(s => s.id === id ? { ...s, [field]: val } : s);
        updateCost({ ...costData, steps: recalculateMols(newSteps) });
    };

    const addStep = () => {
        if(readOnly) return;
        const n = { id: `step-${Date.now()}`, name: `Step ${costData.steps.length+1}`, yield: 90, materials: [{id:Date.now(), name:'', price:0, mw:0, eq:1, mol:0}] };
        updateCost({ ...costData, steps: recalculateMols([...costData.steps, n]) });
    };

    const delStep = (id) => {
        if(readOnly) return;
        updateCost({ ...costData, steps: recalculateMols(costData.steps.filter(s => s.id!==id)) });
    };

    const addItem = (sid) => {
        if(readOnly) return;
        const newSteps = costData.steps.map(s => s.id===sid ? {...s, materials:[...s.materials, {id:Date.now(),name:'',mw:0,price:0,eq:0,mol:0}]} : s);
        updateCost({ ...costData, steps: recalculateMols(newSteps) });
    };

    const updateItem = (sid, mid, f, v) => {
        if(readOnly) return;
        const newSteps = costData.steps.map(s => s.id===sid ? {...s, materials: s.materials.map(m=>m.id===mid?{...m,[f]:v}:m)} : s);
        updateCost({ ...costData, steps: recalculateMols(newSteps) });
    };

    const delItem = (sid, mid) => {
        if(readOnly) return;
        const newSteps = costData.steps.map(s => s.id===sid ? {...s, materials: s.materials.filter(m=>m.id!==mid)} : s);
        updateCost({ ...costData, steps: recalculateMols(newSteps) });
    };

    const handleMaterialPaste = (e, stepId, matIdx, startField) => {
        if (readOnly) return;
        e.preventDefault();
        
        const text = e.clipboardData.getData('text');
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
        if (!rows.length) return;
        
        const fieldOrder = ['name', 'mw', 'price', 'eq'];
        const startColIdx = fieldOrder.indexOf(startField);
        if (startColIdx === -1) return;

        let newSteps = [...costData.steps];
        const stepIndex = newSteps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        let targetMaterials = [...newSteps[stepIndex].materials];

        rows.forEach((rowStr, rOffset) => {
            const currentMatIdx = matIdx + rOffset;
            const cols = rowStr.split('\t');
            if (currentMatIdx >= targetMaterials.length) { 
                targetMaterials.push({ id: Date.now() + Math.random(), name: '', mw: 0, price: 0, eq: 0, mol: 0 }); 
            }
            cols.forEach((val, cOffset) => {
                const currentFieldIdx = startColIdx + cOffset;
                if (currentFieldIdx < fieldOrder.length) {
                    const fieldName = fieldOrder[currentFieldIdx];
                    let cleanVal = val.trim();
                    if (['mw', 'price', 'eq'].includes(fieldName)) { 
                        cleanVal = parseFloat(cleanVal.replace(/,/g, '')) || 0; 
                    }
                    targetMaterials[currentMatIdx][fieldName] = cleanVal;
                }
            });
        });

        newSteps[stepIndex] = { ...newSteps[stepIndex], materials: targetMaterials };
        updateCost({ ...costData, steps: recalculateMols(newSteps) });
    };

    const stats = useMemo(() => calculateLotMetrics(costData), [costData]);

    if(!activeLot) return <div className="flex h-full items-center justify-center text-slate-400">{t('msg_select_lot')}</div>;

    return (
         <div className="flex h-full bg-slate-50">
            {/* Left: Lot Selector */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-500">{t('select_lot')}</div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {material.lots.map(l => (
                        <div key={l.id} onClick={() => setActiveLotId(l.id)} className={`p-3 rounded-lg text-sm cursor-pointer flex justify-between ${activeLotId === l.id ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {l.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cost Simulation Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                
                {/* [Header & Guide] */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><Icon name="coins" size={24}/></div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{t('cost_sim')}</h2>
                            <p className="text-xs text-slate-500">{t('lot_label')} {activeLot.name}</p>
                        </div>
                    </div>
                    
                    {/* [NEW] 우측 사용 가이드 (Guide) */}
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg max-w-sm">
                        <div className="flex items-center gap-2 mb-1 text-blue-700 font-bold text-xs">
                            <Icon name="info" size={14}/> {t('guide_title')}
                        </div>
                        <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                            {t('guide_desc')}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* [Left Panel] Output & Yields */}
                    <div className="col-span-4 glass-panel p-5 rounded-xl bg-white">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex gap-2"><Icon name="activity" size={14}/> {t('output')}</h4>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>{t('total_yield')}</span>
                                    <span className="text-brand-600 font-bold">{stats.synYield}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-500" style={{width: `${Math.min(stats.synYield, 100)}%`}}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">{t('theoretical_g')}</label>
                                    <input 
                                        disabled={readOnly} 
                                        placeholder={t('ph_theo_g')}
                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm font-bold text-right outline-none text-slate-800 focus:border-brand-500 transition placeholder:text-slate-300" 
                                        value={fmtN(stats.theoreticalOutput, 1).replace(/,/g,'')} 
                                        onChange={(e)=>{ 
                                            const val = parseFloat(e.target.value) || 0; 
                                            const tmw = parseFloat(costData.targetMw) || 1; 
                                            const newMol = val / tmw; 
                                            const ns = [...costData.steps]; 
                                            if (ns[0]?.materials[0]) { ns[0].materials[0].mol = newMol; } 
                                            updateCost({ ...costData, steps: recalculateMols(ns) }); 
                                        }} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">{t('actual_g')}</label>
                                    <div className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1.5 text-sm font-bold text-slate-800 text-right">
                                        {fmtN(stats.actualOutput, 1)}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{t('sub_1')}</span><span>{costData.subYield1}%</span></div>
                                    <input disabled={readOnly} type="range" min="0" max="100" value={costData.subYield1} onChange={e=>updateCost({...costData, subYield1:e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{t('sub_2')}</span><span>{costData.subYield2}%</span></div>
                                    <input disabled={readOnly} type="range" min="0" max="100" value={costData.subYield2} onChange={e=>updateCost({...costData, subYield2:e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* [Right Panel] Cost Detail & Steps */}
                    <div className="col-span-8 space-y-4">
                        {/* Global Parameters */}
                        <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex gap-6">
                                <div>
                                    <label className="text-[10px] text-slate-400 block">{t('target_mw')}</label>
                                    <input disabled={readOnly} placeholder={t('ph_target_mw')} className="bg-transparent text-xl font-bold text-slate-800 w-28 outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 transition placeholder:text-slate-300 placeholder:text-base placeholder:font-normal" value={costData.targetMw} onChange={e=>updateCost({...costData, targetMw:e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 block">{t('process_day')}</label>
                                    <input disabled={readOnly} placeholder={t('ph_process_day')} className="bg-transparent text-xl font-bold text-slate-800 w-32 outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 transition placeholder:text-slate-300 placeholder:text-base placeholder:font-normal" value={costData.processCostPerDay} onChange={e=>updateCost({...costData, processCostPerDay:e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 block">{t('total_days')}</label>
                                    <input disabled={readOnly} placeholder={t('ph_days')} className="bg-transparent text-xl font-bold text-slate-800 w-24 outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 transition placeholder:text-slate-300 placeholder:text-base placeholder:font-normal" value={costData.processDays} onChange={e=>updateCost({...costData, processDays:e.target.value})}/>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400 uppercase">{t('unit_cost')}</div>
                                <div className="text-3xl font-black text-emerald-600">
                                    {t('currency')}{fmtK(stats.unitCost)}
                                    <span className="text-sm text-slate-400 font-normal ml-1">
                                        /{t('unit_cost_label').split('/')[1]}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Steps Loop */}
                        <div className="space-y-4">
                            {costData.steps.map((step, sIdx) => (
                                <div key={step.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{t('step_prefix')} {sIdx+1}</span>
                                            <input disabled={readOnly} placeholder={t('ph_step_name')} className="bg-transparent font-bold text-slate-700 outline-none w-48 hover:text-brand-600 focus:text-brand-600 placeholder:text-slate-400" value={step.name} onChange={e=>updateStep(step.id,'name',e.target.value)}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">{t('yield')}</span>
                                            <input disabled={readOnly} className="bg-white border border-slate-300 text-slate-700 text-xs p-1 rounded w-12 text-center outline-none focus:border-brand-500 font-bold" value={step.yield} onChange={e=>updateStep(step.id,'yield',e.target.value)}/>
                                            <span className="text-xs text-slate-500">%</span>
                                            {!readOnly && <button onClick={()=>delStep(step.id)} className="ml-2 text-slate-400 hover:text-rose-500 transition"><Icon name="x" size={14}/></button>}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-slate-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-2 w-1/3">{t('th_material')}</th>
                                                    <th className="px-4 py-2 w-20">{t('th_mw')}</th>
                                                    <th className="px-4 py-2 w-24">
                                                        {t('th_price')} <span className="text-[9px] text-slate-400 normal-case">{t('unit_price_label')}</span>
                                                    </th>
                                                    <th className="px-4 py-2 w-16">{t('th_eq')}</th>
                                                    <th className="px-4 py-2 w-20">{t('th_mol')}</th>
                                                    <th className="px-4 py-2 text-right">{t('th_cost')}</th>
                                                    <th className="w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {step.materials.map((m,i)=>(
                                                    <tr key={m.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} placeholder={t('ph_mat_name')} className="bg-transparent w-full outline-none text-slate-800 placeholder:text-slate-300" value={m.name} onChange={e=>updateItem(step.id,m.id,'name',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'name')} />
                                                        </td>
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} placeholder={t('ph_mw')} className="bg-transparent w-full outline-none text-slate-500 placeholder:text-slate-300" type="number" value={m.mw} onChange={e=>updateItem(step.id,m.id,'mw',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'mw')} />
                                                        </td>
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} placeholder={t('ph_price')} className="bg-transparent w-full outline-none text-slate-500 placeholder:text-slate-300" type="number" value={m.price} onChange={e=>updateItem(step.id,m.id,'price',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'price')} />
                                                        </td>
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} placeholder={t('ph_eq')} className="bg-transparent w-full outline-none text-brand-600 font-bold placeholder:text-slate-300" type="number" value={m.eq} onChange={e=>updateItem(step.id,m.id,'eq',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'eq')} />
                                                        </td>
                                                        <td className="px-4 py-1.5 text-slate-500 font-mono">{m.mol.toFixed(3)}</td>
                                                        <td className="px-4 py-1.5 text-right font-mono text-slate-500">
                                                            {t('currency')}{fmtK((m.mol*m.mw/1000)*m.price)}
                                                        </td>
                                                        <td className="px-4 py-1.5 text-center">
                                                            {!readOnly && <button onClick={()=>delItem(step.id,m.id)} className="text-slate-400 hover:text-rose-500 transition"><Icon name="minus-circle" size={14}/></button>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {!readOnly && <button className="w-full py-2 text-xs text-slate-500 hover:bg-slate-100 transition border-t border-slate-100 font-bold" onClick={()=>addItem(step.id)}>{t('add_material')}</button>}
                                    </div>
                                </div>
                            ))}
                            {!readOnly && <button onClick={addStep} className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-500 hover:text-brand-500 transition flex items-center justify-center gap-2 bg-slate-50 font-bold"><Icon name="git-merge" size={16}/> {t('add_step_btn')}</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};