import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { calculateLotMetrics, recalculateMols } from '../../utils/math';
import { fmtK, fmtN } from '../../utils/format';

export const CostTab = ({ material, updateMaterial, readOnly }) => {
    const [activeLotId, setActiveLotId] = useState(material.lots[0]?.id || null);
    
    // 현재 선택된 Lot 데이터 가져오기
    const activeLot = material.lots.find(l => l.id === activeLotId);
    const costData = activeLot ? activeLot.costData : null;

    // 데이터 업데이트 헬퍼 (계산 로직 포함)
    const updateCost = (newCostData) => {
        if(readOnly) return;
        // Cost 데이터가 변하면 Lot의 주요 지표(수율, 비용 등)도 다시 계산해서 Lot 정보에 반영
        const metrics = calculateLotMetrics(newCostData);
        
        updateMaterial({ 
            ...material, 
            lots: material.lots.map(l => l.id === activeLotId ? { ...l, costData: newCostData, ...metrics } : l) 
        });
    };

    // [핵심 기능] 단계(Step) 수정 시 몰(Mol) 재계산 (Cascade)
    const updateStep = (id, field, val) => {
        if(readOnly) return;
        const newSteps = costData.steps.map(s => s.id === id ? { ...s, [field]: val } : s);
        // 수율(Yield) 등이 바뀌면 이후 단계의 Mol이 바뀌어야 함 -> recalculateMols
        updateCost({ ...costData, steps: recalculateMols(newSteps) });
    };

    // 단계 추가/삭제
    const addStep = () => {
        if(readOnly) return;
        const n = { id: `step-${Date.now()}`, name: `Step ${costData.steps.length+1}`, yield: 90, materials: [{id:Date.now(), name:'', price:0, mw:0, eq:1, mol:0}] };
        updateCost({ ...costData, steps: recalculateMols([...costData.steps, n]) });
    };

    const delStep = (id) => {
        if(readOnly) return;
        updateCost({ ...costData, steps: recalculateMols(costData.steps.filter(s => s.id!==id)) });
    };

    // 재료(Material) 추가/삭제/수정
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

    // [핵심 기능] 엑셀 붙여넣기 (Paste Handler)
    const handleMaterialPaste = (e, stepId, matIdx, startField) => {
        if (readOnly) return;
        e.preventDefault();
        
        // 클립보드 데이터 읽기
        const text = e.clipboardData.getData('text');
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
        if (!rows.length) return;
        
        // 붙여넣기 가능한 필드 순서 정의
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
            
            // 행이 부족하면 자동 추가
            if (currentMatIdx >= targetMaterials.length) { 
                targetMaterials.push({ id: Date.now() + Math.random(), name: '', mw: 0, price: 0, eq: 0, mol: 0 }); 
            }
            
            cols.forEach((val, cOffset) => {
                const currentFieldIdx = startColIdx + cOffset;
                if (currentFieldIdx < fieldOrder.length) {
                    const fieldName = fieldOrder[currentFieldIdx];
                    let cleanVal = val.trim();
                    // 숫자 필드는 숫자로 변환 (쉼표 제거)
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

    // 통계(Metrics) 실시간 계산
    const stats = useMemo(() => calculateLotMetrics(costData), [costData]);

    if(!activeLot) return <div className="flex h-full items-center justify-center text-slate-400">Select Lot</div>;

    return (
         <div className="flex h-full bg-slate-50">
            {/* Left: Lot Selector */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-500">SELECT LOT</div>
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
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><Icon name="coins" size={24}/></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Cost Simulation</h2>
                        <p className="text-xs text-slate-500">Lot: {activeLot.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* [Left Panel] Output & Yields */}
                    <div className="col-span-4 glass-panel p-5 rounded-xl bg-white">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex gap-2"><Icon name="activity" size={14}/> Output</h4>
                        <div className="space-y-4">
                            {/* Total Yield Bar */}
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>Total Yield</span>
                                    <span className="text-brand-600 font-bold">{stats.synYield}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-500" style={{width: `${Math.min(stats.synYield, 100)}%`}}></div>
                                </div>
                            </div>

                            {/* Output Inputs (Reverse Calculation) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">Theoretical (g)</label>
                                    <input 
                                        disabled={readOnly} 
                                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-sm font-bold text-right outline-none text-slate-800 focus:border-brand-500 transition" 
                                        value={fmtN(stats.theoreticalOutput, 1).replace(/,/g,'')} 
                                        onChange={(e)=>{ 
                                            // [핵심 기능] 역산 로직: 목표량 입력 -> 시작 Mol 변경
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
                                    <label className="text-[10px] text-slate-400 block mb-1">Actual (g)</label>
                                    <div className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1.5 text-sm font-bold text-slate-800 text-right">
                                        {fmtN(stats.actualOutput, 1)}
                                    </div>
                                </div>
                            </div>

                            {/* Sub Yield Sliders */}
                            <div className="pt-2 border-t border-slate-200 space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Sub 1</span><span>{costData.subYield1}%</span></div>
                                    <input disabled={readOnly} type="range" min="0" max="100" value={costData.subYield1} onChange={e=>updateCost({...costData, subYield1:e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Sub 2</span><span>{costData.subYield2}%</span></div>
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
                                <div><label className="text-[10px] text-slate-400 block">Target MW</label><input disabled={readOnly} className="bg-transparent text-xl font-bold text-slate-800 w-24 outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 transition" value={costData.targetMw} onChange={e=>updateCost({...costData, targetMw:e.target.value})}/></div>
                                <div><label className="text-[10px] text-slate-400 block">Process/Day</label><input disabled={readOnly} className="bg-transparent text-xl font-bold text-slate-800 w-32 outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 transition" value={costData.processCostPerDay} onChange={e=>updateCost({...costData, processCostPerDay:e.target.value})}/></div>
                                <div><label className="text-[10px] text-slate-400 block">Total Days</label><input disabled={readOnly} className="bg-transparent text-xl font-bold text-slate-800 w-24 outline-none border-b border-transparent hover:border-slate-300 focus:border-brand-500 transition" value={costData.processDays} onChange={e=>updateCost({...costData, processDays:e.target.value})}/></div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400 uppercase">Unit Cost</div>
                                <div className="text-3xl font-black text-emerald-600">₩{fmtK(stats.unitCost)}<span className="text-sm text-slate-400 font-normal">/g</span></div>
                            </div>
                        </div>

                        {/* Steps Loop */}
                        <div className="space-y-4">
                            {costData.steps.map((step, sIdx) => (
                                <div key={step.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">Step {sIdx+1}</span>
                                            <input disabled={readOnly} className="bg-transparent font-bold text-slate-700 outline-none w-48 hover:text-brand-600 focus:text-brand-600" value={step.name} onChange={e=>updateStep(step.id,'name',e.target.value)}/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">Yield</span>
                                            <input disabled={readOnly} className="bg-white border border-slate-300 text-slate-700 text-xs p-1 rounded w-12 text-center outline-none focus:border-brand-500 font-bold" value={step.yield} onChange={e=>updateStep(step.id,'yield',e.target.value)}/>
                                            <span className="text-xs text-slate-500">%</span>
                                            {!readOnly && <button onClick={()=>delStep(step.id)} className="ml-2 text-slate-400 hover:text-rose-500 transition"><Icon name="x" size={14}/></button>}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 text-slate-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-2 w-1/3">Material</th>
                                                    <th className="px-4 py-2 w-20">MW</th>
                                                    <th className="px-4 py-2 w-24">Price</th>
                                                    <th className="px-4 py-2 w-16">Eq</th>
                                                    <th className="px-4 py-2 w-20">Mol</th>
                                                    <th className="px-4 py-2 text-right">Cost</th>
                                                    <th className="w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {step.materials.map((m,i)=>(
                                                    <tr key={m.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} className="bg-transparent w-full outline-none text-slate-800" value={m.name} onChange={e=>updateItem(step.id,m.id,'name',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'name')} />
                                                        </td>
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} className="bg-transparent w-full outline-none text-slate-500" type="number" value={m.mw} onChange={e=>updateItem(step.id,m.id,'mw',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'mw')} />
                                                        </td>
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} className="bg-transparent w-full outline-none text-slate-500" type="number" value={m.price} onChange={e=>updateItem(step.id,m.id,'price',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'price')} />
                                                        </td>
                                                        <td className="px-4 py-1.5">
                                                            <input disabled={readOnly} className="bg-transparent w-full outline-none text-brand-600 font-bold" type="number" value={m.eq} onChange={e=>updateItem(step.id,m.id,'eq',e.target.value)} onPaste={e=>handleMaterialPaste(e, step.id, i, 'eq')} />
                                                        </td>
                                                        <td className="px-4 py-1.5 text-slate-500 font-mono">{m.mol.toFixed(3)}</td>
                                                        <td className="px-4 py-1.5 text-right font-mono text-slate-500">{fmtK((m.mol*m.mw/1000)*m.price)}</td>
                                                        <td className="px-4 py-1.5 text-center">
                                                            {!readOnly && <button onClick={()=>delItem(step.id,m.id)} className="text-slate-400 hover:text-rose-500 transition"><Icon name="minus-circle" size={14}/></button>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {!readOnly && <button className="w-full py-2 text-xs text-slate-500 hover:bg-slate-100 transition border-t border-slate-100 font-bold" onClick={()=>addItem(step.id)}>+ Add Material</button>}
                                    </div>
                                </div>
                            ))}
                            {!readOnly && <button onClick={addStep} className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-500 hover:text-brand-500 transition flex items-center justify-center gap-2 bg-slate-50 font-bold"><Icon name="git-merge" size={16}/> Add Synthesis Step</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};