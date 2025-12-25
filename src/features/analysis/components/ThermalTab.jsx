// src/features/analysis/components/ThermalTab.jsx
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { SizeSlider } from '../../../components/ui/SizeSlider';
import { generateId } from '../../../utils/math';

export const ThermalTab = ({ material, updateMaterial, readOnly }) => {
    const [subTab, setSubTab] = useState('ampoule');
    const [residueImgSize, setResidueImgSize] = useState(100);
    const residueData = material.residueData || [];
    
    const addResidue = () => { if(!readOnly) updateMaterial({ ...material, residueData: [...residueData, { id: generateId(), lotId: '', hplc: '', residueImg: null, deviceImg: null, lifetime: '' }] }); };
    
    const updateResidue = (id, f, v) => { if(!readOnly) updateMaterial({ ...material, residueData: residueData.map(r => r.id===id ? {...r, [f]:v} : r) }); };
    
    const removeResidue = (id) => { if(!readOnly && confirm("Delete?")) updateMaterial({ ...material, residueData: residueData.filter(r => r.id !== id) }); };

    return (
        <div className="p-6 space-y-6">
            <div className="flex gap-2 mb-4">
                <button onClick={() => setSubTab('ampoule')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${subTab === 'ampoule' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500 hover:text-slate-700'}`}>Ampoule Test</button>
                <button onClick={() => setSubTab('residue')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${subTab === 'residue' ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500 hover:text-slate-700'}`}>Residue Test</button>
            </div>

            {subTab === 'ampoule' ? (
                <Card title="Ampoule Thermal Stability" icon="thermometer" color="text-amber-600">
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="text-slate-500 border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Step</th><th className="p-3">Temp</th><th className="p-3">HPLC</th><th className="p-3">Image</th><th className="p-3">Lifetime</th><th className="p-3">Plot</th></tr></thead>
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
                    <div className="flex justify-between items-center"><h4 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Icon name="thermometer" className="text-rose-500"/> Residue Evaluation</h4><div className="flex gap-2"><SizeSlider value={residueImgSize} onChange={setResidueImgSize} />{!readOnly && <button onClick={addResidue} className="bg-brand-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-500 text-white transition"><Icon name="plus" size={14}/> Add Test</button>}</div></div>
                    <div className="grid grid-cols-1 gap-6">
                        {residueData.map((item, index) => (
                            <Card key={item.id} className="relative">
                                {!readOnly && <button onClick={() => removeResidue(item.id)} className="absolute top-4 right-14 text-slate-400 hover:text-rose-500"><Icon name="trash-2" size={16}/></button>}
                                <h5 className="text-sm font-bold text-slate-500 mb-4 uppercase">Test #{index + 1}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Lot No.</label><input disabled={readOnly} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-700 outline-none" placeholder="Enter Lot No." value={item.lotId} onChange={e=>updateResidue(item.id, 'lotId', e.target.value)}/></div>
                                    <div><label className="text-xs font-bold text-brand-600 uppercase block mb-1">HPLC Purity (%)</label><input disabled={readOnly} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 font-bold" placeholder="99.9" value={item.hplc} onChange={e=>updateResidue(item.id, 'hplc', e.target.value)}/></div>
                                    <div><label className="text-xs font-bold text-emerald-600 uppercase block mb-1">Lifetime (%)</label><input disabled={readOnly} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 font-bold" placeholder="100" value={item.lifetime} onChange={e=>updateResidue(item.id, 'lifetime', e.target.value)}/></div>
                                    <div className="grid grid-cols-2 gap-2" style={{ height: `${residueImgSize}px` }}><div className="h-full bg-slate-50 border border-slate-200 rounded overflow-hidden"><ImageUploader value={item.residueImg} onChange={v => updateResidue(item.id, 'residueImg', v)} label="Residue" readOnly={readOnly}/></div><div className="h-full bg-slate-50 border border-slate-200 rounded overflow-hidden"><ImageUploader value={item.deviceImg} onChange={v => updateResidue(item.id, 'deviceImg', v)} label="Device" readOnly={readOnly}/></div></div>
                                </div>
                            </Card>
                        ))}
                        {residueData.length === 0 && <div className="text-center py-10 text-slate-400 border border-dashed border-slate-300 rounded-xl">No residue tests added.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};