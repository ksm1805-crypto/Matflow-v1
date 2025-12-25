import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { generateId } from '../../../utils/math';

export const ImpurityTab = ({ material, updateMaterial, readOnly }) => {
    const peaks = material.impurityData.peaks;
    const fields = ['rt', 'rrt', 'mw', 'content'];

    // Lot들의 HplcGrid(테이블)와 Impurity Profile(헤더)을 동기화하는 중요 로직
    const updateGlobal = (newPeaks, actionType, index = -1) => {
        if(readOnly) return;
        const newLots = material.lots.map(lot => {
            let newGrid = (lot.hplcGrid || []).map(row => [...(row || [])]);
            while (newGrid.length < 4) newGrid.push([]);
            if (actionType === 'INSERT') {
                newGrid.forEach((row, rIdx) => { while (row.length <= index + 1) row.push(''); const insertVal = rIdx === 0 ? `Peak` : ''; row.splice(index + 1, 0, insertVal); });
            } else if (actionType === 'DELETE') {
                newGrid.forEach(row => { if (row.length > index + 1) row.splice(index + 1, 1); });
            } else if (actionType === 'APPEND') {
                const currentCols = newGrid[0].length; const neededCols = newPeaks.length + 1; const appendCount = neededCols - currentCols;
                if (appendCount > 0) { newGrid.forEach((row, rIdx) => { for(let k=0; k<appendCount; k++) row.push(rIdx===0 ? 'Peak' : ''); }); }
            }
            newGrid[0] = ['Parameter', ...newPeaks.map((_, i) => `Peak ${i+1}`)];
            return { ...lot, hplcGrid: newGrid };
        });
        updateMaterial({ ...material, impurityData: { ...material.impurityData, peaks: newPeaks }, lots: newLots });
    };

    const updatePeaksValuesOnly = (newPeaks) => { 
        if(readOnly) return;
        updateMaterial({ ...material, impurityData: { ...material.impurityData, peaks: newPeaks } }); 
    };

    const insertPeak = (index) => { 
        const newPeak = { id: generateId(), rt: '', rrt: '', mw: '', content: '' }; 
        const newPeaks = [...peaks]; 
        newPeaks.splice(index, 0, newPeak); 
        updateGlobal(newPeaks, 'INSERT', index); 
    };

    const removePeak = (index) => { 
        if(window.confirm("Delete this peak column? This will remove corresponding data from ALL lots.")) { 
            const newPeaks = peaks.filter((_, i) => i !== index); 
            updateGlobal(newPeaks, 'DELETE', index); 
        } 
    };

    const appendPeak = () => { 
        const newPeaks = [...peaks, {id:generateId(), rt:'', rrt:'', mw:'', content:''}]; 
        updateGlobal(newPeaks, 'APPEND'); 
    };

    const handlePaste = (e, fieldIdx, peakIdx) => {
        if(readOnly) return;
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
        if (rows.length === 0) return;
        const newPeaks = peaks.map(p => ({...p}));
        let expanded = false;
        rows.forEach((rowStr, rOffset) => {
            const currentFieldIdx = fieldIdx + rOffset;
            if (currentFieldIdx >= fields.length) return; 
            const fieldName = fields[currentFieldIdx];
            const cols = rowStr.split('\t');
            cols.forEach((val, cOffset) => {
                const currentPeakIdx = peakIdx + cOffset;
                while (newPeaks.length <= currentPeakIdx) { newPeaks.push({ id: generateId(), rt: '', rrt: '', mw: '', content: '' }); expanded = true; }
                if (newPeaks[currentPeakIdx]) { newPeaks[currentPeakIdx][fieldName] = val.trim(); }
            });
        });
        if (expanded) { updateGlobal(newPeaks, 'APPEND'); } else { updatePeaksValuesOnly(newPeaks); }
    };

    return (
        <div className="p-6">
            <div className="w-full">
                <Card title="Impurity Profile Identification" icon="fingerprint" color="text-purple-600">
                    {!readOnly && (<div className="absolute top-4 right-16 z-20"><button type="button" onClick={(e) => { e.stopPropagation(); appendPeak(); }} className="bg-purple-600 px-3 py-1 rounded text-sm text-white hover:bg-purple-700 shadow-sm flex items-center gap-1 transition"><Icon name="plus" size={12}/> Append Peak</button></div>)}
                    <div className="mt-4 border border-slate-200 rounded-xl shadow-sm overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                            <thead><tr><th className="bg-slate-100 p-3 border-r border-b border-slate-200 w-32 sticky left-0 z-30 text-slate-500 shadow-sm">Property</th>{peaks.map((p,i)=>(<th key={p.id} className="bg-slate-50 p-2 border-r border-b border-slate-200 min-w-[140px] group relative"><div className="flex justify-between items-center px-1">{!readOnly && (<button type="button" onClick={(e)=>{ e.stopPropagation(); insertPeak(i); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-brand-600 transition" title="Insert Peak Here"><Icon name="plus" size={12}/></button>)}<span className="text-brand-600 font-bold">Peak {i+1}</span>{!readOnly && (<button type="button" onClick={(e)=>{ e.stopPropagation(); removePeak(i); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition" title="Delete Peak"><Icon name="trash-2" size={12}/></button>)}</div></th>))}</tr></thead>
                            <tbody>
                                {fields.map((f, rIdx)=><tr key={f}><td className="bg-slate-50 p-3 border-r border-b border-slate-200 sticky left-0 font-bold text-slate-600 uppercase z-20 shadow-sm">{f}</td>{peaks.map((p,cIdx)=><td key={p.id} className="p-0 border-r border-b border-slate-200"><input disabled={readOnly} className="w-full p-3 bg-transparent text-center outline-none hover:bg-slate-50 transition" value={p[f]} onChange={e=>{ const nextPeaks = peaks.map((pk, idx) => idx === cIdx ? { ...pk, [f]: e.target.value } : pk); updatePeaksValuesOnly(nextPeaks); }} onPaste={(e)=>handlePaste(e, rIdx, cIdx)}/></td>)}</tr>)}
                                <tr><td className="bg-slate-50 p-3 border-r border-slate-200 sticky left-0 font-bold text-slate-600 z-20 shadow-sm">Structure</td>{peaks.map((p,i)=><td key={p.id} className="p-2 border-r border-slate-200 h-32"><ImageUploader value={p.structureImg} onChange={v=>{ const nextPeaks = peaks.map((pk, idx) => idx === i ? { ...pk, structureImg: v } : pk); updatePeaksValuesOnly(nextPeaks); }} label="Img" readOnly={readOnly}/></td>)}</tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};