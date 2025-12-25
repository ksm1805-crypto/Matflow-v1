import React from 'react';
import { Icon } from './Icon';

export const ExcelGrid = ({ data, setData, title, className = "h-[400px]", readOnly = false }) => {
    // 데이터 안전장치
    const safeData = Array.isArray(data) ? data : [];

    const handleChange = (val, r, c) => { 
        if(readOnly) return; 
        const newData = safeData.map((row, rowIndex) => {
            if (rowIndex === r) { const newRow = [...row]; newRow[c] = val; return newRow; }
            return row;
        });
        setData(newData); 
    };

    const handlePaste = (e, r, c) => {
        if (readOnly) return;
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        if (rows.length === 0) return;
        
        let newData = safeData.map(row => [...row]);
        rows.forEach((rowStr, rOffset) => {
            const currentRowIdx = r + rOffset;
            const cols = rowStr.split('\t');
            if (currentRowIdx >= newData.length) { 
                const colCount = newData[0] ? newData[0].length : cols.length; 
                newData.push(new Array(colCount).fill('')); 
            }
            cols.forEach((val, cOffset) => {
                const currentColIdx = c + cOffset;
                if (newData[currentRowIdx] && currentColIdx < newData[currentRowIdx].length) { 
                    newData[currentRowIdx][currentColIdx] = val.trim(); 
                }
            });
        });
        setData(newData);
    };

    const addRow = () => { if(!readOnly) setData([...safeData, Array(safeData[0]?.length || 1).fill('')]); };
    const addCol = () => { if(!readOnly) setData(safeData.map((row,r) => r===0 ? [...row, `Col ${row.length+1}`] : [...row, ''])); };
    const delRow = (idx) => { if(!readOnly && safeData.length > 1) setData(safeData.filter((_, i) => i !== idx)); };

    return (
        <div className={`flex flex-col gap-2 mt-2 ${className}`}>
            <div className="flex justify-between items-center bg-slate-100 p-2 rounded-t-lg border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Icon name="grid" size={14}/> {title}</span>
                    
                    {/* [추가] 엑셀 붙여넣기 가능 표시 (눈에 잘 띄는 배지 스타일) */}
                    {!readOnly && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold flex items-center gap-1">
                            <Icon name="copy" size={10}/> Excel Paste (Ctrl+V)
                        </span>
                    )}
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        <button onClick={addRow} className="px-2 py-1 text-xs bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-600 transition shadow-sm">+ Row</button>
                        <button onClick={addCol} className="px-2 py-1 text-xs bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-600 transition shadow-sm">+ Col</button>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto border border-slate-200 rounded-b-lg bg-white custom-scrollbar shadow-inner">
                <table className="w-full border-collapse">
                    <tbody>
                        {safeData.map((row, r) => (
                            <tr key={r} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="w-8 bg-slate-50 text-center text-slate-400 text-[10px] border-r border-slate-200 sticky left-0 z-10">
                                    {r === 0 ? '#' : (!readOnly && <button onClick={() => delRow(r)} className="text-rose-400 hover:text-rose-600 transition">×</button>)}
                                </td>
                                {row.map((cell, c) => (
                                    <td key={c} className="border-r border-slate-100 min-w-[80px]">
                                        <input 
                                            disabled={readOnly} 
                                            className={`w-full bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-blue-50 focus:text-blue-800 transition ${r===0?'font-bold text-slate-700 bg-slate-50 text-center':''} ${readOnly ? 'cursor-default text-slate-500' : 'text-slate-800'}`} 
                                            value={cell || ''} 
                                            onChange={(e) => handleChange(e.target.value, r, c)} 
                                            onPaste={(e) => handlePaste(e, r, c)} 
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};