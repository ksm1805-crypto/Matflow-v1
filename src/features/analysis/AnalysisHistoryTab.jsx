import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { SimpleLineChart } from '../../components/charts/SimpleLineChart';
import { fmtK } from '../../utils/format';
import { processCrossLotImpurityData } from '../../utils/math';
import { STANDARD_METALS } from '../../constants';

export const AnalysisHistoryTab = ({ material, updateMaterial, readOnly }) => {
    const [refLotIds, setRefLotIds] = useState(material.lots.length > 0 ? [material.lots[0].id] : []);
    const [isRefSelectorOpen, setIsRefSelectorOpen] = useState(false);
    
    const [impurityTab, setImpurityTab] = useState('main');

    const crossLotPeaks = useMemo(() => {
        let gridKey = 'hplcGrid';
        if (impurityTab === 'p') gridKey = 'hplcGridP';
        else if (impurityTab === 'n') gridKey = 'hplcGridN';
        else if (impurityTab === '3') gridKey = 'hplcGrid3';

        const mappedLots = material.lots.map(lot => ({
            ...lot,
            hplcGrid: lot[gridKey] 
        }));

        return processCrossLotImpurityData(mappedLots);
    }, [material.lots, impurityTab]);

    const allRRTs = useMemo(() => crossLotPeaks.map(p => p.rrt), [crossLotPeaks]);
    
    const updateLot = (id, field, val) => { if(!readOnly) updateMaterial({ ...material, lots: material.lots.map(l => l.id === id ? { ...l, [field]: val } : l) }); };
    const toggleRef = (id) => setRefLotIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const renderCompValue = (lot, keyPrefix, unit = '%', color = 'text-slate-700') => {
        if (lot.isMix) {
            return (
                <div className="flex flex-col text-[10px] leading-tight">
                    <span className="text-blue-600 font-bold">{lot.comp1Label}: {lot[`${keyPrefix}P`] || '-'}{unit}</span>
                    <span className="text-rose-600 font-bold">{lot.comp2Label}: {lot[`${keyPrefix}N`] || '-'}{unit}</span>
                    {lot.mixCount === 3 && <span className="text-emerald-600 font-bold">{lot.comp3Label}: {lot[`${keyPrefix}3`] || '-'}{unit}</span>}
                </div>
            );
        }
        return <span className={`font-mono font-bold ${color}`}>{lot[keyPrefix] || '-'}{unit}</span>;
    };

    const renderMixInfo = (lot) => { if (!lot.isMix) return '-'; return <div className="flex flex-col items-center"><span className="text-[10px] text-slate-500 font-bold">{lot.comp1Label}/{lot.comp2Label}</span><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">{lot.pRatio}:{lot.nRatio}</span></div>; };
    const renderDRate = (lot) => { if (lot.isMix) return <span className="text-xs text-slate-500">Mix</span>; return <span className="font-mono text-slate-700">{lot.dRate ? `${lot.dRate}%` : '-'}</span>; };
    const renderHalogen = (lot) => { const { f, cl, br } = lot.halogen || {}; if (!f && !cl && !br) return '-'; return <div className="text-[10px] font-mono flex flex-col gap-0.5"><span className="text-slate-600">F: {f||0}</span><span className="text-slate-600">Cl: {cl||0}</span></div>; };
    const renderMetal = (lot) => { const spec = material.specification?.metal || {}; const metals = material.specification?.metalElements || STANDARD_METALS; let isFail = false; metals.forEach((el) => { if ((parseFloat(lot.metalResults?.[el]) || 0) > parseFloat(spec[el] || 9999)) isFail = true; }); return isFail ? <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">Fail</span> : <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Pass</span>; };

    const firstMixLot = material.lots.find(l => l.isMix);
    const labelP = firstMixLot?.comp1Label || 'Comp 1';
    const labelN = firstMixLot?.comp2Label || 'Comp 2';
    const label3 = firstMixLot?.comp3Label || 'Comp 3';
    const hasMix = !!firstMixLot;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50 p-6 space-y-6">
            
            {/* 1. Summary Table */}
            <Card title="Lot Comparison History" icon="layers">
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                         <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-3 sticky left-0 z-20 bg-slate-100 border-r border-slate-200 shadow-sm">Lot No.</th>
                                <th className="p-3 w-32">Period</th>
                                
                                {/* Step, Syn Site, Sub Site 컬럼 삭제됨 */}
                                
                                {/* Syn Yield + Site 통합 헤더 */}
                                <th className="p-3 text-blue-700 bg-blue-50/50 text-center">
                                    Syn % <span className="text-[10px] text-slate-400 font-normal">/ Site</span>
                                </th> 
                                
                                {/* Sub Yield + Site 통합 헤더 */}
                                <th className="p-3 text-amber-700 bg-amber-50/50 text-center">
                                    Sub % <span className="text-[10px] text-slate-400 font-normal">/ Site</span>
                                </th> 

                                <th className="p-3 text-purple-600">Purity</th><th className="p-3 text-amber-600">D-Rate</th>
                                <th className="p-3">Mix</th><th className="p-3 text-blue-600">Output</th><th className="p-3">Cost</th>
                                <th className="p-3">Halogen</th><th className="p-3 text-center">Metal</th><th className="p-3 text-emerald-600">Eff</th><th className="p-3 text-blue-600">Life</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {material.lots.map(lot => {
                                // Step 판단 로직 (배경색 강조용으로 로직은 유지)
                                const stepName = (lot.step || '').toUpperCase();
                                const isSyn = ['SYNTHESIS', 'CRUDE', 'INT'].some(s => stepName.includes(s)) || stepName === 'SYNTHESIS';
                                const isSub = ['SUBLIMATION', 'SUB'].some(s => stepName.includes(s)) || stepName === 'SUBLIMATION';

                                return (
                                <tr key={lot.id} className="hover:bg-slate-50 transition">
                                    <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm">{lot.name}</td>
                                    <td className="p-3"><div className="flex flex-col gap-1"><input type="date" disabled={readOnly} className="bg-transparent text-[10px] text-slate-500 outline-none w-full" value={lot.synDateStart} onChange={e=>updateLot(lot.id, 'synDateStart', e.target.value)}/><input type="date" disabled={readOnly} className="bg-transparent text-[10px] text-slate-500 outline-none w-full" value={lot.synDateEnd} onChange={e=>updateLot(lot.id, 'synDateEnd', e.target.value)}/></div></td>
                                    
                                    {/* [수정] Syn Yield + Site 통합 셀 */}
                                    <td className={`p-3 text-center align-middle transition-colors ${isSyn ? 'bg-blue-50/50' : 'opacity-60'}`}>
                                        <div className="flex flex-col items-center gap-1">
                                            {renderCompValue(lot, 'synYield', '%')}
                                            <input 
                                                disabled={readOnly} 
                                                className="bg-transparent w-full text-center outline-none text-[10px] text-slate-400 placeholder:text-slate-300 border-t border-slate-100 pt-0.5" 
                                                value={lot.synSite} 
                                                onChange={e=>updateLot(lot.id,'synSite',e.target.value)} 
                                                placeholder="Site"
                                            />
                                        </div>
                                    </td>
                                    
                                    {/* [수정] Sub Yield + Site 통합 셀 */}
                                    <td className={`p-3 text-center align-middle transition-colors ${isSub ? 'bg-amber-50/50' : 'opacity-60'}`}>
                                        <div className="flex flex-col items-center gap-1">
                                            {renderCompValue(lot, 'subYield', '%')}
                                            <input 
                                                disabled={readOnly} 
                                                className="bg-transparent w-full text-center outline-none text-[10px] text-slate-400 placeholder:text-slate-300 border-t border-slate-100 pt-0.5" 
                                                value={lot.subSite} 
                                                onChange={e=>updateLot(lot.id,'subSite',e.target.value)} 
                                                placeholder="Site"
                                            />
                                        </div>
                                    </td>

                                    <td className="p-3 text-center">{renderCompValue(lot, 'hplcSub', '%', 'text-purple-600')}</td>
                                    <td className="p-3 text-center">{renderCompValue(lot, 'dRate', '%', 'text-amber-600')}</td>
                                    
                                    <td className="p-3 text-center">{renderMixInfo(lot)}</td>
                                    <td className="p-3 font-mono font-bold text-blue-600">{lot.actualOutput}g</td>
                                    <td className="p-3 font-mono text-slate-500">₩{fmtK(lot.unitCost)}</td>
                                    <td className="p-3">{renderHalogen(lot)}</td><td className="p-3 text-center">{renderMetal(lot)}</td>
                                    <td className="p-3 font-bold text-emerald-600">{lot.ivlEff}%</td><td className="p-3 font-bold text-blue-600">{lot.lifetime}%</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            {/* 2. Charts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 <div className="h-48"><SimpleLineChart data={material.lots} dataKey="synYield" color="#3b82f6" label="Syn Yield (%)" formatVal={v=>`${v}%`}/></div>
                 <div className="h-48"><SimpleLineChart data={material.lots} dataKey="subYield" color="#f59e0b" label="Sub Yield (%)" formatVal={v=>`${v}%`}/></div>
                 <div className="h-48"><SimpleLineChart data={material.lots} dataKey="hplcSub" color="#a855f7" label="Purity (%)" formatVal={v=>`${v}%`}/></div>
                 <div className="h-48"><SimpleLineChart data={material.lots} dataKey="hplcSub" color="#ec4899" label="Sub Purity (%)" formatVal={v=>`${v}%`}/></div>
                 <div className="h-48"><SimpleLineChart data={material.lots} dataKey="unitCost" color="#10b981" label="Unit Cost" formatVal={v=>`₩${fmtK(v)}`}/></div>
                 <div className="h-48"><SimpleLineChart data={material.lots} dataKey="lifetime" color="#0ea5e9" label="Device Life (%)" formatVal={v=>`${v}%`}/></div>
            </div>
            
            {/* 3. Impurity Comparison Table */}
            <Card title="Impurity Comparison (Row: Lot / Col: RRT)" icon="git-branch">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-1">
                        <button onClick={()=>setImpurityTab('main')} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${impurityTab==='main'?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Final Mix</button>
                        {hasMix && (
                            <>
                                <button onClick={()=>setImpurityTab('p')} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${impurityTab==='p'?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'}`}>{labelP}</button>
                                <button onClick={()=>setImpurityTab('n')} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${impurityTab==='n'?'bg-rose-600 text-white border-rose-600':'bg-white text-slate-500 border-slate-200 hover:bg-rose-50'}`}>{labelN}</button>
                                {firstMixLot.mixCount === 3 && <button onClick={()=>setImpurityTab('3')} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${impurityTab==='3'?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50'}`}>{label3}</button>}
                            </>
                        )}
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition select-none" onClick={() => setIsRefSelectorOpen(!isRefSelectorOpen)}>
                            <span className="text-xs text-slate-500 font-bold">Ref Lots:</span><span className="text-xs text-brand-600 font-bold">{refLotIds.length} Selected</span><Icon name="chevron-down" size={12}/>
                        </div>
                        {isRefSelectorOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in flex flex-col gap-1">
                                <div className="text-[10px] font-bold text-slate-400 px-2 pb-1 border-b border-slate-100 mb-1">Select References</div>
                                {material.lots.map(l => (<div key={l.id} onClick={(e) => { e.stopPropagation(); toggleRef(l.id); }} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${refLotIds.includes(l.id) ? 'bg-brand-50' : 'hover:bg-slate-50'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${refLotIds.includes(l.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>{refLotIds.includes(l.id) && <Icon name="check" size={10} className="text-white"/>}</div><span className={`text-xs font-medium truncate ${refLotIds.includes(l.id) ? 'text-brand-700' : 'text-slate-600'}`}>{l.name}</span></div>))}
                                <div className="pt-2 border-t border-slate-100 mt-1"><button onClick={(e)=>{e.stopPropagation(); setIsRefSelectorOpen(false)}} className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1">Close</button></div>
                            </div>
                        )}
                        {isRefSelectorOpen && <div className="fixed inset-0 z-40" onClick={() => setIsRefSelectorOpen(false)}></div>}
                    </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg custom-scrollbar">
                    <table className="w-full text-xs text-right border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                                <th className="p-3 text-left font-bold w-40 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-sm">Lot ID</th>
                                {allRRTs.map(rrt => (<th key={rrt} className="p-3 font-bold min-w-[80px] border-l border-slate-200 text-brand-600">RRT {rrt.toFixed(2)}</th>))}
                            </tr>
                        </thead>
                        <tbody>
                            {material.lots.map(lot => {
                                const isRef = refLotIds.includes(lot.id);
                                return (
                                    <tr key={lot.id} className={`hover:bg-slate-50 border-b border-slate-100 ${isRef ? 'bg-brand-50/30' : ''}`}>
                                        <td className="p-3 text-left font-bold sticky left-0 bg-white border-r border-slate-200 shadow-sm z-10"><div className="flex items-center gap-2"><span>{lot.name}</span>{isRef && <span className="text-[9px] bg-brand-200 text-brand-700 px-1.5 rounded-full">Ref</span>}</div></td>
                                        {allRRTs.map(rrt => {
                                            const peakData = crossLotPeaks.find(p => p.rrt === rrt);
                                            const val = peakData ? peakData.contents[lot.id] : undefined;
                                            const refVals = refLotIds.map(rid => peakData?.contents[rid] || 0);
                                            const maxRef = refVals.length > 0 ? Math.max(...refVals) : 0;
                                            const isMain = rrt >= 0.95 && rrt <= 1.05;
                                            const isWorse = !isMain && !isRef && (val || 0) > maxRef && refLotIds.length > 0;
                                            return <td key={rrt} className={`p-3 border-l border-slate-100 ${isWorse ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-500'}`}>{val !== undefined ? `${val}%` : '-'}</td>;
                                        })}
                                    </tr>
                                );
                            })}
                            {allRRTs.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-slate-400 italic">No impurity peaks found. Please add peak data in Analysis Tab.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};