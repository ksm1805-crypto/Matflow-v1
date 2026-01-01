import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { KetcherModal } from '../../../components/ui/KetcherModal';
import { generateId } from '../../../utils/math';

// --- 1. 다국어 사전 정의 ---
const TRANSLATIONS = {
    ko: {
        title: "불순물 프로파일 식별",
        append_peak: "피크 추가",
        property: "속성",
        peak: "피크",
        insert_peak: "여기에 피크 삽입",
        delete_peak: "피크 삭제",
        delete_confirm: "이 피크 열을 삭제하시겠습니까? 모든 Lot에서 해당 데이터가 삭제됩니다.",
        structure: "구조식",
        draw_structure: "구조식 그리기",
        f_rt: "RT",
        f_rrt: "RRT",
        f_mw: "분자량",
        f_content: "함량",
        paste_guide: "셀 클릭 후 Ctrl+V",
    },
    en: {
        title: "Impurity Profile Identification",
        append_peak: "Append Peak",
        property: "Property",
        peak: "Peak",
        insert_peak: "Insert Peak Here",
        delete_peak: "Delete Peak",
        delete_confirm: "Delete this peak column? This will remove corresponding data from ALL lots.",
        structure: "Structure",
        draw_structure: "Draw Structure",
        f_rt: "RT",
        f_rrt: "RRT",
        f_mw: "MW",
        f_content: "Content",
        paste_guide: "Click cell & Ctrl+V",
    },
    zh: {
        title: "杂质谱识别",
        append_peak: "添加峰",
        property: "属性",
        peak: "峰",
        insert_peak: "在此插入峰",
        delete_peak: "删除峰",
        delete_confirm: "确定要删除此峰列吗？这将删除所有批次中的相应数据。",
        structure: "结构式",
        draw_structure: "绘制结构式",
        f_rt: "保留时间",
        f_rrt: "相对保留时间",
        f_mw: "分子量",
        f_content: "含量",
        paste_guide: "点击单元格并 Ctrl+V",
    }
};

export const ImpurityTab = ({ material, updateMaterial, readOnly, lang = 'ko' }) => { 
    const t = (key) => TRANSLATIONS[lang][key] || key; 

    const peaks = material.impurityData.peaks || [];
    const fields = ['rt', 'rrt', 'mw', 'content'];

    const [isKetcherOpen, setIsKetcherOpen] = useState(false);
    const [targetPeakIndex, setTargetPeakIndex] = useState(null);
    const [editingCell, setEditingCell] = useState(null);

    // [FIX] 프로젝트 로드 시 '데이터가 없는' 뒷부분의 빈 피크들을 자동으로 제거 (Trim)
    useEffect(() => {
        if (readOnly) return;
        if (peaks.length <= 1) return; // 1개 이하는 건드리지 않음

        // 1. 뒤에서부터 유효한 데이터가 있는 마지막 인덱스를 찾습니다.
        let lastValidIndex = -1;
        for (let i = peaks.length - 1; i >= 0; i--) {
            const p = peaks[i];
            const hasData = p.rt || p.rrt || p.mw || p.content || p.structureSmiles;
            if (hasData) {
                lastValidIndex = i;
                break;
            }
        }

        // 2. 만약 데이터가 있는 마지막 지점보다 배열이 더 길다면 (즉, 뒤에 빈 피크가 있다면)
        //    데이터가 하나도 없으면 1개는 남겨야 하므로 (lastValidIndex가 -1이면 0번 인덱스까지 살림)
        const cutoffIndex = lastValidIndex === -1 ? 0 : lastValidIndex;
        const newLength = cutoffIndex + 1;

        if (peaks.length > newLength) {
            // 빈 피크 제거
            const trimmedPeaks = peaks.slice(0, newLength);
            
            // Lot Grid(테이블)도 피크 개수에 맞춰서 잘라내기
            const newLots = material.lots.map(lot => {
                let newGrid = (lot.hplcGrid || []).map(row => [...(row || [])]);
                
                // 헤더(row 0) 길이 조정
                if (newGrid[0]) {
                    newGrid[0] = ['Parameter', ...trimmedPeaks.map((_, i) => `Peak ${i+1}`)];
                }
                
                // 데이터 행 길이 조정 (Property 1개 + Peak 개수)
                newGrid.forEach(row => {
                    while (row.length > trimmedPeaks.length + 1) {
                        row.pop();
                    }
                });
                return { ...lot, hplcGrid: newGrid };
            });

            // 상태 업데이트 (불필요한 빈 피크 제거됨)
            updateMaterial({ 
                ...material, 
                impurityData: { ...material.impurityData, peaks: trimmedPeaks },
                lots: newLots
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [material.id]); // 프로젝트가 처음 로드될 때(ID 변경 시)만 실행하여 작업 중 삭제 방지

    // 필드명 번역
    const getFieldLabel = (field) => t(`f_${field}`);

    // 데이터 업데이트 (Global)
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
        const newPeak = { id: generateId(), rt: '', rrt: '', mw: '', content: '', structureSmiles: '', structureMol: '', structureSvg: '' }; 
        const newPeaks = [...peaks]; 
        newPeaks.splice(index, 0, newPeak); 
        updateGlobal(newPeaks, 'INSERT', index); 
    };

    const removePeak = (index) => { 
        if(window.confirm(t('delete_confirm'))) { 
            const newPeaks = peaks.filter((_, i) => i !== index); 
            updateGlobal(newPeaks, 'DELETE', index); 
        } 
    };

    const appendPeak = () => { 
        const newPeaks = [...peaks, {id:generateId(), rt:'', rrt:'', mw:'', content:'', structureSmiles: '', structureMol: '', structureSvg: ''}]; 
        updateGlobal(newPeaks, 'APPEND'); 
    };

    const openStructureEditor = (index) => {
        if (readOnly) return;
        setTargetPeakIndex(index);
        setIsKetcherOpen(true);
    };

    const handleStructureSave = (smiles, molfile, svg) => {
        if (targetPeakIndex === null) return;
        const newPeaks = peaks.map((p, i) => i === targetPeakIndex ? { ...p, structureSmiles: smiles, structureMol: molfile, structureSvg: svg } : p);
        updatePeaksValuesOnly(newPeaks);
        setIsKetcherOpen(false);
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
                while (newPeaks.length <= currentPeakIdx) { 
                    newPeaks.push({ id: generateId(), rt: '', rrt: '', mw: '', content: '', structureSmiles: '', structureSvg: '' }); 
                    expanded = true; 
                }
                if (newPeaks[currentPeakIdx]) { newPeaks[currentPeakIdx][fieldName] = val.trim(); }
            });
        });

        if (expanded) { updateGlobal(newPeaks, 'APPEND'); } else { updatePeaksValuesOnly(newPeaks); }
        setEditingCell(null); 
    };

    const renderCell = (field, fIdx, peak, pIdx) => {
        const isEditing = editingCell?.field === field && editingCell?.peakIndex === pIdx;
        const value = peak[field];

        if (isEditing && !readOnly) {
            return (
                <input
                    autoFocus
                    className="w-full h-full p-3 bg-white text-center outline-none border-2 border-brand-500 rounded shadow-sm"
                    value={value}
                    onChange={(e) => {
                        const nextPeaks = peaks.map((pk, idx) => idx === pIdx ? { ...pk, [field]: e.target.value } : pk);
                        updatePeaksValuesOnly(nextPeaks);
                    }}
                    onPaste={(e) => handlePaste(e, fIdx, pIdx)}
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingCell(null);
                    }}
                />
            );
        }

        return (
            <div 
                onClick={() => !readOnly && setEditingCell({ field, peakIndex: pIdx })}
                className="w-full h-full p-3 flex items-center justify-center cursor-text hover:bg-slate-100 transition select-text"
                title={t('paste_guide')}
            >
                {value}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="w-full">
                <Card title={t('title')} icon="fingerprint" color="text-purple-600">
                    {!readOnly && (
                        <div className="absolute top-4 right-16 z-20">
                            <button type="button" onClick={(e) => { e.stopPropagation(); appendPeak(); }} className="bg-purple-600 px-3 py-1 rounded text-sm text-white hover:bg-purple-700 shadow-sm flex items-center gap-1 transition">
                                <Icon name="plus" size={12}/> {t('append_peak')}
                            </button>
                        </div>
                    )}
                    
                    <div className="mt-4 border border-slate-200 rounded-xl shadow-sm overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="bg-slate-100 p-3 border-r border-b border-slate-200 w-32 sticky left-0 z-30 text-slate-500 shadow-sm select-none">
                                        {t('property')}
                                    </th>
                                    {peaks.map((p, i) => (
                                        <th key={p.id} className="bg-slate-50 p-2 border-r border-b border-slate-200 min-w-[140px] group relative select-none">
                                            <div className="flex justify-between items-center px-1">
                                                {!readOnly && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); insertPeak(i); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-brand-600 transition" title={t('insert_peak')}>
                                                        <Icon name="plus" size={12}/>
                                                    </button>
                                                )}
                                                <span className="text-brand-600 font-bold">{t('peak')} {i + 1}</span>
                                                {!readOnly && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); removePeak(i); }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-500 transition" title={t('delete_peak')}>
                                                        <Icon name="trash-2" size={12}/>
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Property Rows */}
                                {fields.map((f, rIdx) => (
                                    <tr key={f}>
                                        <td className="bg-slate-50 p-3 border-r border-b border-slate-200 sticky left-0 font-bold text-slate-600 uppercase z-20 shadow-sm select-none">
                                            {getFieldLabel(f)}
                                        </td>
                                        {peaks.map((p, cIdx) => (
                                            <td key={p.id} className="p-0 border-r border-b border-slate-200 relative h-10">
                                                {renderCell(f, rIdx, p, cIdx)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                
                                {/* Structure Row */}
                                <tr>
                                    <td className="bg-slate-50 p-3 border-r border-slate-200 sticky left-0 font-bold text-slate-600 z-20 shadow-sm select-none">
                                        {t('structure')}
                                    </td>
                                    {peaks.map((p, i) => (
                                        <td key={p.id} className="p-2 border-r border-slate-200 h-32 align-middle">
                                            <div 
                                                onClick={() => openStructureEditor(i)}
                                                className={`
                                                    w-full h-28 rounded-lg border flex items-center justify-center cursor-pointer transition relative overflow-hidden bg-white
                                                    ${p.structureSmiles ? 'border-brand-200 shadow-sm' : 'border-slate-200 border-dashed hover:border-slate-400'}
                                                    ${readOnly ? 'pointer-events-none opacity-80' : ''}
                                                `}
                                                title={readOnly ? "" : t('draw_structure')}
                                            >
                                                {p.structureSvg ? (
                                                    <div 
                                                        className="w-full h-full p-1 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                                                        dangerouslySetInnerHTML={{ __html: p.structureSvg }}
                                                    />
                                                ) : (
                                                    <Icon name="hexagon" size={24} className="text-slate-300"/>
                                                )}

                                                {!readOnly && (
                                                    <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                                                        <Icon name="edit-2" size={16} className="text-slate-700"/>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {isKetcherOpen && (
                <KetcherModal 
                    isOpen={isKetcherOpen} 
                    onClose={() => setIsKetcherOpen(false)} 
                    onSave={handleStructureSave}
                    initialSmiles={targetPeakIndex !== null ? peaks[targetPeakIndex]?.structureSmiles : ''}
                />
            )}
        </div>
    );
};