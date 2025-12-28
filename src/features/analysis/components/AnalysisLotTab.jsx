import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ExcelGrid } from '../../../components/ui/ExcelGrid';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { FileUploader } from '../../../components/ui/FileUploader';
import { sanitizeLot } from '../../../utils/sanitize';
import { STANDARD_METALS } from '../../../constants';

export const AnalysisLotTab = ({ material, updateMaterial, readOnly }) => {
    const [activeLotId, setActiveLotId] = useState(material.lots[0]?.id || null);
    const [viewMode, setViewMode] = useState('chemical');
    const [activeGridTab, setActiveGridTab] = useState('main');

    useEffect(() => { 
        if (!activeLotId && material.lots.length > 0) setActiveLotId(material.lots[0].id); 
    }, [material.lots, activeLotId]);
    
    const activeLot = material.lots.find(l => l.id === activeLotId);
    const metalElements = material.specification?.metalElements || STANDARD_METALS;

    const updateLot = (key, val) => { 
        if(!readOnly) updateMaterial({ ...material, lots: material.lots.map(l => l.id === activeLotId ? { ...l, [key]: val } : l) }); 
    };
    
    // [확인하세요!] base64ToBlob 함수가 여기서 완전히 삭제되었습니다.

    // [수정됨] Firebase URL 전용 렌더링 함수
    const renderFileList = (files, updateFilesKey) => {
        const fileList = Array.isArray(files) ? files : [];
        if (fileList.length === 0) return null;

        // 파일명 추출 (URL에서 깔끔하게 뽑아내기)
        const getFileName = (file) => {
            // 1. File 객체 또는 저장된 객체 ({name: "..."})
            if (file.name) return file.name;
            
            // 2. Firebase URL 문자열
            const urlStr = typeof file === 'string' ? file : (file.url || file.src);
            if (typeof urlStr === 'string' && urlStr.startsWith('http')) {
                try {
                    const decoded = decodeURIComponent(urlStr);
                    const baseName = decoded.split('/o/').pop().split('?')[0].split('/').pop();
                    const parts = baseName.split('_');
                    return parts.length > 1 && !isNaN(parts[0]) ? parts.slice(1).join('_') : baseName;
                } catch { return 'Stored File'; }
            }
            return 'Unknown File';
        };

        const handleDelete = (index) => {
            if (readOnly) return;
            const newFiles = fileList.filter((_, i) => i !== index);
            updateLot(updateFilesKey, newFiles);
        };

        // [핵심 수정] 클릭 핸들러: 복잡한 로직 없이 URL이면 바로 엽니다.
        const handleFileClick = (file) => {
            // 1. URL 찾기
            const fileUrl = typeof file === 'string' ? file : (file.url || file.src);

            // 2. URL이 있고 http로 시작하면 새 창으로 열기 (Firebase Link)
            if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
                window.open(fileUrl, '_blank');
            } else {
                // 3. URL이 없으면 (아직 저장 안 된 상태) -> 변환 시도 X, 그냥 저장 안내
                // 여기에 alert나 변환 로직을 넣지 않으면 에러가 절대 날 수 없습니다.
                alert("파일을 보려면 먼저 상단의 [Save to Cloud] 버튼을 눌러 저장해주세요.");
            }
        };

        return (
            <div className="mt-2 space-y-1 relative block">
                {fileList.map((file, index) => {
                    const fileName = getFileName(file);
                    const isPdf = fileName.toLowerCase().endsWith('.pdf');
                    
                    // URL이 존재하면 저장된 상태
                    const urlStr = typeof file === 'string' ? file : (file.url || file.src);
                    const isSaved = urlStr && typeof urlStr === 'string' && urlStr.startsWith('http');

                    return (
                        <div 
                            key={index} 
                            className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded text-xs group hover:shadow-md transition cursor-pointer" 
                            onClick={() => handleFileClick(file)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <Icon 
                                    name={isPdf ? 'file-text' : 'image'} 
                                    size={14} 
                                    className={isPdf ? "text-rose-500" : "text-blue-500"}
                                />
                                <span className={`truncate font-medium hover:underline ${isSaved ? 'text-blue-600 font-bold' : 'text-slate-400 italic'}`}>
                                    {fileName} {isSaved ? '' : '(저장 필요)'}
                                </span>
                            </div>
                            {!readOnly && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(index); }} 
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                >
                                    <Icon name="x" size={14}/>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // RRT 계산 로직
    const calculateGridRRT = (gridData) => {
        if (!gridData || gridData.length < 4) return gridData;
        const newData = gridData.map(row => [...row]);
        const rtRowIndex = 1;
        const rrtRowIndex = 2;
        const contentRowIndex = 3;

        let mainPeakColIndex = -1;
        let maxContent = -1;

        for (let c = 1; c < newData[contentRowIndex].length; c++) {
            const content = parseFloat(newData[contentRowIndex][c]) || 0;
            if (content > maxContent) {
                maxContent = content;
                mainPeakColIndex = c;
            }
        }

        const mainRT = parseFloat(newData[rtRowIndex][mainPeakColIndex]) || 0;

        if (mainRT > 0) {
            for (let c = 1; c < newData[rrtRowIndex].length; c++) {
                const currentRT = parseFloat(newData[rtRowIndex][c]);
                if (!isNaN(currentRT) && currentRT > 0) {
                    newData[rrtRowIndex][c] = (currentRT / mainRT).toFixed(2);
                } else {
                    newData[rrtRowIndex][c] = '';
                }
            }
        }
        return newData;
    };

    // Mix Preset 설정
    const setMixPreset = (type) => {
        if (readOnly) return;
        if (type === 'PPN') {
            updateMaterial({ 
                ...material, 
                lots: material.lots.map(l => l.id === activeLotId ? { ...l, mixCount: 3, comp1Label: 'P1', comp2Label: 'P2', comp3Label: 'N' } : l) 
            });
        } else if (type === 'PNN') {
            updateMaterial({ 
                ...material, 
                lots: material.lots.map(l => l.id === activeLotId ? { ...l, mixCount: 3, comp1Label: 'P', comp2Label: 'N1', comp3Label: 'N2' } : l) 
            });
        }
    };

    const addLot = () => { 
        if(!readOnly) { 
            const baseData = { name: `LOT-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${material.lots.length + 1}` };
            const newLot = sanitizeLot(baseData); 
            updateMaterial({ ...material, lots: [...material.lots, newLot] }); 
            setActiveLotId(newLot.id); 
        }
    };

    const getCurrentGrid = () => {
        if (activeGridTab === 'p') return { data: activeLot.hplcGridP, key: 'hplcGridP', title: `${activeLot.comp1Label} Impurity Peaks` };
        if (activeGridTab === 'n') return { data: activeLot.hplcGridN, key: 'hplcGridN', title: `${activeLot.comp2Label} Impurity Peaks` };
        if (activeGridTab === '3') return { data: activeLot.hplcGrid3, key: 'hplcGrid3', title: `${activeLot.comp3Label} Impurity Peaks` };
        return { data: activeLot.hplcGrid, key: 'hplcGrid', title: 'Final Product Impurity Peaks' };
    };
    const currentGridInfo = activeLot ? getCurrentGrid() : null;

    const renderCompInput = (label, colorClass, borderClass, prefix) => (
        <div className={`p-3 rounded-xl border ${colorClass} ${borderClass}`}>
            <div className={`text-xs font-bold text-center rounded py-1 mb-2 ${colorClass.replace('/50','').replace('bg-','text-').replace('-50','-600')} ${colorClass.replace('/50','').replace('bg-','bg-').replace('-50','-100')}`}>
                {label} Component
            </div>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[9px] text-slate-400 block font-bold">Syn Yield <span className="text-rose-500">*</span></label>
                        <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none" value={activeLot[`synYield${prefix}`]} onChange={e=>updateLot(`synYield${prefix}`, e.target.value)} placeholder="0"/><span className="text-[10px] text-slate-400">%</span></div>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-400 block font-bold">Sub Yield <span className="text-rose-500">*</span></label>
                        <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none" value={activeLot[`subYield${prefix}`]} onChange={e=>updateLot(`subYield${prefix}`, e.target.value)} placeholder="0"/><span className="text-[10px] text-slate-400">%</span></div>
                    </div>
                </div>
                <div className={`border-t ${borderClass} pt-1`}>
                    <label className="text-[9px] text-slate-400 block font-bold">Syn Purity <span className="text-rose-500">*</span></label>
                    <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-lg font-black text-slate-800 outline-none" value={activeLot[`hplcSyn${prefix}`]} onChange={e=>updateLot(`hplcSyn${prefix}`, e.target.value)} placeholder="0.00"/><span className="text-[10px] text-slate-400">%</span></div>
                </div>
                <div className={`border-t ${borderClass} pt-1`}>
                    <label className="text-[9px] text-slate-400 block font-bold">Sub Purity <span className="text-rose-500">*</span></label>
                    <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-lg font-black text-brand-600 outline-none" value={activeLot[`hplcSub${prefix}`]} onChange={e=>updateLot(`hplcSub${prefix}`, e.target.value)} placeholder="0.00"/><span className="text-[10px] text-slate-400">%</span></div>
                </div>
                <div className={`border-t ${borderClass} pt-1`}>
                    <label className="text-[9px] text-slate-400 block font-bold">D-Rate <span className="text-rose-500">*</span></label>
                    <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-lg font-black text-amber-600 outline-none" value={activeLot[`dRate${prefix}`]} onChange={e=>updateLot(`dRate${prefix}`, e.target.value)} placeholder="0"/><span className="text-[10px] text-slate-400">%</span></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-500">SELECT LOT</span>
                    {!readOnly && <button onClick={addLot} className="text-brand-600 hover:bg-brand-50 rounded p-1"><Icon name="plus" size={14}/></button>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {material.lots.map(l => (
                        <div key={l.id} onClick={() => setActiveLotId(l.id)} className={`p-3 rounded-lg text-sm cursor-pointer flex justify-between ${activeLotId === l.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {l.name}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {activeLot ? (
                    <>
                        <div className="flex justify-between items-end pb-4 border-b border-slate-200">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 font-bold">LOT ID</label>
                                <input disabled={readOnly} className="bg-transparent text-3xl font-black text-slate-800 outline-none w-full" value={activeLot.name} onChange={e => updateLot('name', e.target.value)} />
                            </div>
                            <div className="flex gap-2 bg-slate-200 p-1 rounded-lg">
                                <button onClick={()=>setViewMode('chemical')} className={`px-4 py-2 rounded text-sm font-bold transition ${viewMode==='chemical'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Chemical</button>
                                <button onClick={()=>setViewMode('device')} className={`px-4 py-2 rounded text-sm font-bold transition ${viewMode==='device'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>Device</button>
                            </div>
                        </div>

                        {viewMode === 'chemical' ? (
                            <div className="grid grid-cols-12 gap-6 animate-in">
                                <div className="col-span-12 glass-panel p-6 rounded-xl bg-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-slate-700 font-bold flex items-center gap-2"><Icon name="activity" size={18}/> HPLC Purity Analysis</h4>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                                                <input type="checkbox" className="w-4 h-4 accent-brand-600 rounded cursor-pointer" checked={activeLot.isMix} onChange={e=>{updateLot('isMix', e.target.checked); setActiveGridTab('main');}} disabled={readOnly}/>
                                                <span className="text-xs font-bold text-slate-600">Mix Product</span>
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                <span className="text-xs text-slate-500 font-bold">Method Ver.</span>
                                                <select disabled={readOnly} className="bg-transparent text-xs font-mono text-brand-600 font-bold outline-none cursor-pointer" value={activeLot.hplcMethodVersion} onChange={e=>updateLot('hplcMethodVersion', e.target.value)}>
                                                    <option value="">None</option>
                                                    {material.methods && material.methods.map(m => (<option key={m.id} value={m.version}>{m.version}</option>))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {activeLot.isMix ? (
                                        <div className="space-y-4 mb-6">
                                            {/* Mix Product Logic */}
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-2 overflow-x-auto">
                                                    <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1"><Icon name="git-merge" size={12}/> Ratio</span>
                                                    <div className="flex items-center gap-1"><input disabled={readOnly} className="w-8 text-[10px] font-bold text-center bg-blue-100 text-blue-600 rounded border-none outline-none" value={activeLot.comp1Label} onChange={e=>updateLot('comp1Label', e.target.value)}/><input disabled={readOnly} type="number" className="bg-white border border-slate-300 rounded px-1 py-0.5 w-10 text-center text-xs font-bold outline-none" value={activeLot.pRatio} onChange={e=>updateLot('pRatio', e.target.value)} placeholder="0"/></div>
                                                    <span className="text-slate-300">:</span>
                                                    <div className="flex items-center gap-1"><input disabled={readOnly} className="w-8 text-[10px] font-bold text-center bg-rose-100 text-rose-600 rounded border-none outline-none" value={activeLot.comp2Label} onChange={e=>updateLot('comp2Label', e.target.value)}/><input disabled={readOnly} type="number" className="bg-white border border-slate-300 rounded px-1 py-0.5 w-10 text-center text-xs font-bold outline-none" value={activeLot.nRatio} onChange={e=>updateLot('nRatio', e.target.value)} placeholder="0"/></div>
                                                    {activeLot.mixCount === 3 && (<><span className="text-slate-300">:</span><div className="flex items-center gap-1"><input disabled={readOnly} className="w-8 text-[10px] font-bold text-center bg-emerald-100 text-emerald-600 rounded border-none outline-none" value={activeLot.comp3Label} onChange={e=>updateLot('comp3Label', e.target.value)}/><input disabled={readOnly} type="number" className="bg-white border border-slate-300 rounded px-1 py-0.5 w-10 text-center text-xs font-bold outline-none" value={activeLot.mixRatio3} onChange={e=>updateLot('mixRatio3', e.target.value)} placeholder="0"/></div></>)}
                                                </div>
                                                <div className="flex gap-2">
                                                    {activeLot.mixCount === 3 && !readOnly && (
                                                        <div className="flex bg-white rounded border border-slate-200 p-0.5">
                                                            <button onClick={()=>setMixPreset('PPN')} className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded transition" title="Set P1:P2:N">PPN</button>
                                                            <div className="w-px bg-slate-200 my-0.5"></div>
                                                            <button onClick={()=>setMixPreset('PNN')} className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded transition" title="Set P:N1:N2">PNN</button>
                                                        </div>
                                                    )}
                                                    <div className="flex bg-white rounded border border-slate-200 p-0.5">
                                                        <button onClick={()=>updateLot('mixCount', 2)} className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${activeLot.mixCount !== 3 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}>2-Mix</button>
                                                        <button onClick={()=>updateLot('mixCount', 3)} className={`px-2 py-0.5 text-[10px] font-bold rounded transition ${activeLot.mixCount === 3 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}>3-Mix</button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className={`grid gap-4 ${activeLot.mixCount === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                                {renderCompInput(activeLot.comp1Label, 'bg-blue-50/50', 'border-blue-100', 'P')}
                                                {renderCompInput(activeLot.comp2Label, 'bg-rose-50/50', 'border-rose-100', 'N')}
                                                {activeLot.mixCount === 3 && renderCompInput(activeLot.comp3Label, 'bg-emerald-50/50', 'border-emerald-100', '3')}
                                            </div>

                                            <div className="flex gap-2 border-b border-slate-200 mt-6">
                                                <button onClick={()=>setActiveGridTab('main')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='main'?'border-slate-800 text-slate-800':'border-transparent text-slate-400 hover:text-slate-600'}`}>Final Mix</button>
                                                <button onClick={()=>setActiveGridTab('p')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='p'?'border-blue-500 text-blue-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>{activeLot.comp1Label}</button>
                                                <button onClick={()=>setActiveGridTab('n')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='n'?'border-rose-500 text-rose-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>{activeLot.comp2Label}</button>
                                                {activeLot.mixCount === 3 && <button onClick={()=>setActiveGridTab('3')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='3'?'border-emerald-500 text-emerald-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>{activeLot.comp3Label}</button>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 space-y-4">
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-slate-500">Synthesis <span className="text-rose-500">*</span></span>
                                                    <div className="flex items-baseline"><input disabled={readOnly} className="bg-transparent text-2xl font-black text-slate-800 outline-none w-24 text-right" value={activeLot.hplcSyn} onChange={e=>updateLot('hplcSyn', e.target.value)} placeholder="0.0"/><span className="text-sm font-medium text-slate-400 ml-1">%</span></div>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-slate-500">Sublimation <span className="text-rose-500">*</span></span>
                                                    <div className="flex items-baseline"><input disabled={readOnly} className="bg-transparent text-2xl font-black text-brand-600 outline-none w-24 text-right" value={activeLot.hplcSub} onChange={e=>updateLot('hplcSub', e.target.value)} placeholder="0.0"/><span className="text-sm font-medium text-slate-400 ml-1">%</span></div>
                                                </div>
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center">
                                                    <span className="text-sm font-bold text-amber-600">D-Rate <span className="text-rose-500">*</span></span>
                                                    <div className="flex items-baseline"><input disabled={readOnly} className="bg-transparent text-2xl font-black text-amber-600 outline-none w-24 text-right" value={activeLot.dRate} onChange={e=>updateLot('dRate', e.target.value)} placeholder="0"/><span className="text-sm font-medium text-slate-400 ml-1">%</span></div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="flex flex-col">
                                                    <FileUploader 
                                                        files={activeLot.hplcSynFiles || []} 
                                                        setFiles={f => updateLot('hplcSynFiles', f)} 
                                                        label="Synthesis Lots HPLC (PDFs)" 
                                                        readOnly={readOnly} 
                                                        hideList={true} 
                                                        accept=".pdf,.png,.jpg,.jpeg"
                                                    />
                                                    {renderFileList(activeLot.hplcSynFiles, 'hplcSynFiles')}
                                                </div>

                                                <div className="flex flex-col">
                                                    <FileUploader 
                                                        files={activeLot.hplcSubFiles || []} 
                                                        setFiles={f => updateLot('hplcSubFiles', f)} 
                                                        label="Sublimation Lot HPLC (PDF)" 
                                                        readOnly={readOnly} 
                                                        hideList={true}
                                                        accept=".pdf,.png,.jpg,.jpeg"
                                                    />
                                                    {renderFileList(activeLot.hplcSubFiles, 'hplcSubFiles')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6 mt-4"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Synthesis History</label><textarea disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none" rows="3" value={activeLot.synHistory || ''} onChange={e=>updateLot('synHistory', e.target.value)}></textarea></div>
                                    
                                    <ExcelGrid 
                                        key={currentGridInfo.key} 
                                        data={currentGridInfo.data} 
                                        setData={d => {
                                            const calculated = calculateGridRRT(d);
                                            updateLot(currentGridInfo.key, calculated);
                                        }} 
                                        title={currentGridInfo.title} 
                                        className="h-64" 
                                        readOnly={readOnly} 
                                    />
                                </div>
                                
                                <div className="col-span-12 glass-panel p-6 rounded-xl bg-white">
                                    <h4 className="text-slate-700 font-bold mb-4 flex items-center gap-2"><Icon name="alert-triangle" size={18}/> Impurity Analysis</h4>
                                    <div className="mb-6"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Halogen (ppm)</label><div className="flex gap-4">{['f','cl','br'].map(el => (<div key={el} className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"><span className="text-xs font-bold text-slate-500 uppercase mr-2">{el}</span><input disabled={readOnly} className="bg-transparent text-slate-800 font-bold outline-none w-16 text-right" placeholder="0" value={activeLot.halogen[el]} onChange={e=>updateLot('halogen', {...activeLot.halogen, [el]:e.target.value})} /></div>))}</div></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Metal (ppm)</label><div className="flex flex-wrap gap-2">{metalElements.map((el) => (<div key={el} className="bg-slate-50 border border-slate-200 rounded p-2 text-center min-w-[60px]"><span className="text-[10px] text-slate-400 block font-bold mb-1">{el}</span><input disabled={readOnly} className="w-full bg-transparent text-center font-bold text-slate-800 outline-none text-sm" value={activeLot.metalResults?.[el] || ''} onChange={e=>{const newResults = {...(activeLot.metalResults || {})}; newResults[el] = e.target.value; updateLot('metalResults', newResults);}} placeholder="-"/></div>))}</div></div>
                                </div>
                                
                                <div className="col-span-12 grid grid-cols-2 gap-6">
                                    <Card title="TGA Analysis" icon="flame" color="text-amber-600" action={null}>
                                        <div className="flex gap-4 mb-3 p-2 bg-amber-50/50 rounded-lg border border-amber-100"><div className="flex-1"><label className="text-[10px] font-bold text-amber-600 block mb-1">Td 1% (°C)</label><input disabled={readOnly} className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-amber-500" value={activeLot.td1} onChange={e=>updateLot('td1', e.target.value)} placeholder="-"/></div><div className="flex-1"><label className="text-[10px] font-bold text-amber-600 block mb-1">Td 5% (°C)</label><input disabled={readOnly} className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-amber-500" value={activeLot.td5} onChange={e=>updateLot('td5', e.target.value)} placeholder="-"/></div></div>
                                        <div className="grid grid-cols-2 gap-2" style={{ height: '160px' }}>{activeLot.tgaImages?.map((img,i)=><ImageUploader key={i} value={img.src} onChange={v=>v?null:updateLot('tgaImages', activeLot.tgaImages.filter((_,x)=>x!==i))} readOnly={readOnly}/>)}<ImageUploader onChange={v=>v&&updateLot('tgaImages',[...(activeLot.tgaImages||[]),{src:v}])} label="Add Graph" readOnly={readOnly}/></div>
                                    </Card>
                                    <Card title="DSC Analysis" icon="thermometer" color="text-amber-600" action={null}>
                                            <div className="grid grid-cols-2 gap-2" style={{ height: '160px' }}>{activeLot.dscImages?.map((img,i)=><ImageUploader key={i} value={img.src} onChange={v=>v?null:updateLot('dscImages', activeLot.dscImages.filter((_,x)=>x!==i))} readOnly={readOnly}/>)}<ImageUploader onChange={v=>v&&updateLot('dscImages',[...(activeLot.dscImages||[]),{src:v}])} label="Add Graph" readOnly={readOnly}/></div>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-12 gap-6 animate-in">
                                <div className="col-span-4 space-y-6">
                                    <Card title="Efficiency" icon="zap" color="text-emerald-600"><input disabled={readOnly} className="text-5xl font-black text-slate-800 text-center w-full outline-none bg-transparent" value={activeLot.ivlEff || ''} onChange={e=>updateLot('ivlEff', e.target.value)} /><span className="text-center block text-slate-400 text-sm">%</span></Card>
                                    <Card title="Lifetime" icon="clock" color="text-blue-600"><input disabled={readOnly} className="text-5xl font-black text-slate-800 text-center w-full outline-none bg-transparent" value={activeLot.lifetime || ''} onChange={e=>updateLot('lifetime', e.target.value)} /><span className="text-center block text-slate-400 text-sm">%</span></Card>
                                </div>
                                <div className="col-span-8 bg-white p-6 rounded-xl border border-slate-200 h-full relative group">
                                    <div className="flex justify-between items-center mb-4"><h4 className="text-slate-700 font-bold flex items-center gap-2"><Icon name="image" size={16}/> Evaluation Data</h4></div>
                                    <div className="grid grid-cols-3 gap-4" style={{ gridAutoRows: '150px' }}>{activeLot.deviceImages?.map((img,i)=><ImageUploader key={i} value={img.src} onChange={v=>v?null:updateLot('deviceImages', activeLot.deviceImages.filter((_,x)=>x!==i))} readOnly={readOnly}/>)}<ImageUploader onChange={v=>v&&updateLot('deviceImages',[...(activeLot.deviceImages||[]),{src:v}])} label="Add Plot" readOnly={readOnly}/></div>
                                </div>
                            </div>
                        )}
                    </>
                ) : <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-4"><Icon name="flask-conical" size={48} className="opacity-20"/><p>No Analysis Lot selected.</p></div>}
            </div>
        </div>
    );
};