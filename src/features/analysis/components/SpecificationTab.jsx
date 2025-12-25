import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';

export const SpecificationTab = ({ material, updateMaterial, readOnly }) => {
    const [newMetal, setNewMetal] = useState('');
    const spec = material.specification;
    const updateSpec = (field, val) => updateMaterial({ ...material, specification: { ...spec, [field]: val } });
    
    const addMetal = () => {
        if (!newMetal.trim()) return;
        const finalMetal = newMetal.trim().charAt(0).toUpperCase() + newMetal.trim().slice(1).toLowerCase();
        if (spec.metalElements.includes(finalMetal)) return alert("Already exists");
        updateMaterial({...material, specification: {...spec, metalElements: [...spec.metalElements, finalMetal]}});
        setNewMetal('');
    };

    const removeMetal = (el) => {
        if (!window.confirm(`Delete ${el}?`)) return;
        updateMaterial({...material, specification: {...spec, metalElements: spec.metalElements.filter(x => x !== el)}});
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Purity Spec" icon="flask-conical" color="text-brand-600">
                <div className="bg-slate-50 p-3 rounded flex justify-between items-center border border-slate-200"><span className="text-sm text-slate-500">Min %</span><input disabled={readOnly} className="bg-transparent text-right font-bold text-xl w-24 outline-none text-brand-600" value={spec.subPurityMin} onChange={e=>updateSpec('subPurityMin', e.target.value)} placeholder="99.9"/></div>
            </Card>
            <Card title="Halogen Spec (ppm)" icon="flame" color="text-rose-600">
                <div className="grid grid-cols-3 gap-2">{['f','cl','br'].map(el=><div key={el} className="bg-slate-50 p-2 rounded text-center border border-slate-200"><span className="text-xs uppercase text-slate-400">{el}</span><input disabled={readOnly} className="w-full bg-transparent text-center font-bold text-slate-700 outline-none" value={spec.halogen[el]} onChange={e=>updateMaterial({...material, specification:{...spec, halogen:{...spec.halogen, [el]:e.target.value}}})}/></div>)}</div>
            </Card>
            <Card title="Device Spec" icon="zap" color="text-emerald-600">
                <div className="space-y-2">{['ivl','life'].map(k=><div key={k} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200"><span className="text-xs uppercase text-slate-500">{k === 'ivl' ? 'Eff' : 'Life'}</span><div className="flex gap-2 items-center"><input disabled={readOnly} className="w-14 bg-white border border-slate-300 rounded px-2 text-center text-xs outline-none text-slate-700" placeholder="Min" value={spec[k]?.min || ''} onChange={e=>updateMaterial({...material, specification:{...spec, [k]:{...spec[k], min:e.target.value}}})}/><span className="text-slate-400 text-xs">~</span><input disabled={readOnly} className="w-14 bg-white border border-slate-300 rounded px-2 text-center text-xs outline-none text-slate-700" placeholder="Max" value={spec[k]?.max || ''} onChange={e=>updateMaterial({...material, specification:{...spec, [k]:{...spec[k], max:e.target.value}}})}/></div></div>)}</div>
            </Card>
            {/* [추가] DSC Spec Card */}
            <Card title="Thermal (DSC)" icon="thermometer" color="text-purple-600">
                <div className="space-y-2"><div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200"><span className="text-xs uppercase text-slate-500">Ref</span><div className="flex gap-2"><input disabled={readOnly} className="w-16 bg-white border border-slate-300 rounded px-2 text-right text-xs" placeholder="Ref" value={spec.dsc?.ref || ''} onChange={e=>updateMaterial({...material, specification:{...spec, dsc:{...spec.dsc, ref:e.target.value}}})}/><input disabled={readOnly} className="w-12 bg-white border border-slate-300 rounded px-1 text-center text-xs" placeholder="±%" value={spec.dsc?.range || ''} onChange={e=>updateMaterial({...material, specification:{...spec, dsc:{...spec.dsc, range:e.target.value}}})}/></div></div></div>
            </Card>
            <div className="col-span-1 md:col-span-2">
                <Card title="Metal Spec (ppm)" icon="alert-triangle" color="text-slate-600">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {spec.metalElements.map(el => (
                            <div key={el} className="bg-slate-50 p-2 rounded text-center border border-slate-200 relative group min-w-[70px]">
                                    <span className="text-xs font-bold text-slate-500 block mb-1">{el}</span>
                                    <input disabled={readOnly} className="w-full bg-transparent text-center font-bold text-slate-700 outline-none text-sm" value={spec.metal[el] || ''} onChange={e=>updateMaterial({...material, specification:{...spec, metal:{...spec.metal, [el]:e.target.value}}})}/>
                                    {!readOnly && <button onClick={() => removeMetal(el)} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition z-10">×</button>}
                            </div>
                        ))}
                    </div>
                    {!readOnly && <div className="flex gap-2 items-center pt-2 border-t border-slate-100"><input className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs outline-none w-24" placeholder="e.g. Zn" value={newMetal} onChange={e=>setNewMetal(e.target.value)} /><button onClick={addMetal} className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-700">Add Type</button></div>}
                </Card>
            </div>
        </div>
    );
};