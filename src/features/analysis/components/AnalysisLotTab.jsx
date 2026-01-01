import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { FileUploader } from '../../../components/ui/FileUploader';
import { sanitizeLot } from '../../../utils/sanitize';
import { STANDARD_METALS } from '../../../constants';

// --- 1. 다국어 사전 정의 ---
const TRANSLATIONS = {
    ko: {
        select_lot: "LOT 선택",
        add_lot_tooltip: "현재 Lot 복제",
        delete_lot_confirm: "정말 이 Lot을 삭제하시겠습니까?",
        delete_lot_tooltip: "Lot 삭제",
        no_lot_selected: "선택된 Lot이 없습니다.",
        
        view_chemical: "화학 분석",
        view_device: "소자 평가",
        lot_id: "LOT ID",

        hplc_purity_title: "HPLC 순도 분석",
        mix_product: "혼합 제품",
        method_ver: "분석법 Ver.",
        ratio: "비율",
        btn_final_mix: "최종 혼합물",
        
        comp_label: "성분",
        syn_yield: "합성 수율 (Cost Tab)",
        sub_yield: "승화 수율 (Cost Tab)",
        syn_purity: "합성 순도",
        sub_purity: "승화 순도",
        d_rate: "중수소 치환율",
        
        synthesis: "합성 단계",
        sublimation: "승화 단계",
        syn_history: "합성 이력",
        file_syn_hplc: "합성 Lot HPLC (PDF)",
        file_sub_hplc: "승화 Lot HPLC (PDF)",
        msg_save_first: "파일을 보려면 먼저 상단의 [저장] 버튼을 눌러 저장해주세요.",
        file_stored: "저장된 파일",
        file_unknown: "알 수 없는 파일",
        file_need_save: "(저장 필요)",

        impurity_title: "불순물 분석",
        halogen_ppm: "할로겐 (ppm)",
        metal_ppm: "금속 (ppm)",
        
        tga_title: "TGA 분석",
        dsc_title: "DSC 분석",
        td1: "Td 1% (°C)",
        td5: "Td 5% (°C)",
        add_graph: "그래프 추가",

        eff: "효율",
        lifetime: "수명",
        eval_data: "평가 데이터",
        add_plot: "플롯 추가",
        
        paste_guide: "셀 클릭 후 Ctrl+V (자동 확장)",
        btn_add_col: "Peak 추가",
        confirm_del_col: "이 Peak 열을 삭제하시겠습니까?",
        
        suffix_peaks: "불순물 피크 (Impurity Peaks)"
    },
    en: {
        select_lot: "SELECT LOT",
        add_lot_tooltip: "Duplicate current Lot",
        delete_lot_confirm: "Are you sure you want to delete this Lot?",
        delete_lot_tooltip: "Delete Lot",
        no_lot_selected: "No Analysis Lot selected.",
        
        view_chemical: "Chemical",
        view_device: "Device",
        lot_id: "LOT ID",

        hplc_purity_title: "HPLC Purity Analysis",
        mix_product: "Mix Product",
        method_ver: "Method Ver.",
        ratio: "Ratio",
        btn_final_mix: "Final Mix",
        
        comp_label: "Component",
        syn_yield: "Syn Yield (Cost Tab)",
        sub_yield: "Sub Yield (Cost Tab)",
        syn_purity: "Syn Purity",
        sub_purity: "Sub Purity",
        d_rate: "Deuteration Rate",
        
        synthesis: "Synthesis Step",
        sublimation: "Sublimation Step",
        syn_history: "Synthesis History",
        file_syn_hplc: "Synthesis Lots HPLC (PDFs)",
        file_sub_hplc: "Sublimation Lot HPLC (PDF)",
        msg_save_first: "Please save to cloud first to view the file.",
        file_stored: "Stored File",
        file_unknown: "Unknown File",
        file_need_save: "(Needs Save)",

        impurity_title: "Impurity Analysis",
        halogen_ppm: "Halogen (ppm)",
        metal_ppm: "Metal (ppm)",
        
        tga_title: "TGA Analysis",
        dsc_title: "DSC Analysis",
        td1: "Td 1% (°C)",
        td5: "Td 5% (°C)",
        add_graph: "Add Graph",

        eff: "Efficiency",
        lifetime: "Lifetime",
        eval_data: "Evaluation Data",
        add_plot: "Add Plot",
        
        paste_guide: "Click cell & Ctrl+V (Auto Expand)",
        btn_add_col: "Add Peak",
        confirm_del_col: "Delete this Peak column?",
        
        suffix_peaks: "Impurity Peaks"
    },
    zh: {
        select_lot: "选择批次",
        add_lot_tooltip: "复制当前批次",
        delete_lot_confirm: "您确定要删除此批次吗？",
        delete_lot_tooltip: "删除批次",
        no_lot_selected: "未选择分析批次。",
        
        view_chemical: "化学分析",
        view_device: "器件评估",
        lot_id: "批次 ID",

        hplc_purity_title: "HPLC 纯度分析",
        mix_product: "混合产品",
        method_ver: "方法版本",
        ratio: "比例",
        btn_final_mix: "最终混合物",
        
        comp_label: "组分",
        syn_yield: "合成收率 (成本页)",
        sub_yield: "升华收率 (成本页)",
        syn_purity: "合成纯度",
        sub_purity: "升华纯度",
        d_rate: "氘代率",
        
        synthesis: "合成步骤",
        sublimation: "升华步骤",
        syn_history: "合成记录",
        file_syn_hplc: "合成批次 HPLC (PDF)",
        file_sub_hplc: "升华批次 HPLC (PDF)",
        msg_save_first: "请先保存到云端以查看文件。",
        file_stored: "已存文件",
        file_unknown: "未知文件",
        file_need_save: "(需保存)",

        impurity_title: "杂质分析",
        halogen_ppm: "卤素 (ppm)",
        metal_ppm: "金属 (ppm)",
        
        tga_title: "TGA 分析",
        dsc_title: "DSC 分析",
        td1: "Td 1% (°C)",
        td5: "Td 5% (°C)",
        add_graph: "添加图表",

        eff: "效率",
        lifetime: "寿命",
        eval_data: "评估数据",
        add_plot: "添加图表",
        
        paste_guide: "点击单元格并 Ctrl+V (自动扩展)",
        btn_add_col: "添加峰",
        confirm_del_col: "删除此峰列？",
        
        suffix_peaks: "杂质峰"
    }
};

// [Excel Compatible Grid] with Auto Expansion
const ExcelCompatibleGrid = ({ data, setData, readOnly, title, t, onAddColumn, onDeleteColumn }) => {
    const [editingCell, setEditingCell] = useState(null); 

    const handlePaste = (e, startRow, startCol) => {
        if (readOnly) return;
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
        if (rows.length === 0) return;

        // [기능 추가] 붙여넣기 시 열(Column) 자동 확장 로직
        const rowsCells = rows.map(r => r.split('\t'));
        const maxColsNeeded = Math.max(...rowsCells.map(row => startCol + row.length));
        const currentCols = data[0].length;

        let newData = data.map(row => [...row]);

        if (maxColsNeeded > currentCols) {
            const colsToAdd = maxColsNeeded - currentCols;
            newData = newData.map((row, idx) => {
                const newRow = [...row];
                for (let i = 0; i < colsToAdd; i++) {
                    // 헤더(0행)는 이름 생성, 나머지는 빈 값
                    newRow.push(idx === 0 ? `Peak ${row.length + i}` : '');
                }
                return newRow;
            });
        }

        // 데이터 붙여넣기
        rowsCells.forEach((cols, rOffset) => {
            const rIdx = startRow + rOffset;
            if (rIdx >= newData.length) return; 

            cols.forEach((val, cOffset) => {
                const cIdx = startCol + cOffset;
                if (cIdx >= newData[rIdx].length) return; 
                newData[rIdx][cIdx] = val.trim();
            });
        });

        setData(newData);
        setEditingCell(null);
    };

    const handleChange = (val, r, c) => {
        const newData = data.map((row, rIdx) => 
            rIdx === r ? row.map((cell, cIdx) => cIdx === c ? val : cell) : row
        );
        setData(newData);
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {title && (
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase">{title}</span>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-normal text-slate-400">{t('paste_guide')}</span>
                        {!readOnly && onAddColumn && (
                            <button 
                                onClick={onAddColumn}
                                className="flex items-center gap-1 bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-100 transition shadow-sm"
                            >
                                <Icon name="plus" size={10} /> {t('btn_add_col')}
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                    <tbody>
                        {data.map((row, r) => (
                            <tr key={r}>
                                {row.map((cell, c) => {
                                    const isHeader = r === 0 || c === 0;
                                    const isEditing = editingCell?.r === r && editingCell?.c === c;
                                    const showDelete = r === 0 && c > 0 && !readOnly;

                                    return (
                                        <td 
                                            key={c} 
                                            className={`border border-slate-100 relative min-w-[80px] h-8 p-0 ${isHeader ? 'bg-slate-50 font-bold text-slate-600' : 'bg-white'}`}
                                        >
                                            {showDelete && (
                                                <button 
                                                    onClick={() => onDeleteColumn && onDeleteColumn(c)}
                                                    className="absolute -top-1 -right-1 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Column"
                                                >
                                                    <Icon name="x" size={10} />
                                                </button>
                                            )}

                                            <div className={`w-full h-full relative group ${showDelete ? 'cursor-default' : ''}`}>
                                                {isEditing && !readOnly ? (
                                                    <input
                                                        autoFocus
                                                        className="w-full h-full text-center outline-none bg-blue-50 focus:ring-2 focus:ring-blue-500 z-10 relative"
                                                        value={cell}
                                                        onChange={(e) => handleChange(e.target.value, r, c)}
                                                        onPaste={(e) => handlePaste(e, r, c)}
                                                        onBlur={() => setEditingCell(null)}
                                                        onKeyDown={(e) => { if(e.key === 'Enter') setEditingCell(null); }}
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-full h-full flex items-center justify-center cursor-text hover:bg-slate-100 select-text"
                                                        onClick={() => !readOnly && setEditingCell({ r, c })}
                                                    >
                                                        {cell}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const AnalysisLotTab = ({ material, updateMaterial, readOnly, lang = 'ko' }) => { 
    const t = (key) => TRANSLATIONS[lang][key] || key; 

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

    const renderFileList = (files, updateFilesKey) => {
        const fileList = Array.isArray(files) ? files : [];
        if (fileList.length === 0) return null;

        const getFileName = (file) => {
            if (file.name) return file.name;
            const urlStr = typeof file === 'string' ? file : (file.url || file.src);
            if (typeof urlStr === 'string' && urlStr.startsWith('http')) {
                try {
                    const decoded = decodeURIComponent(urlStr);
                    const baseName = decoded.split('/o/').pop().split('?')[0].split('/').pop();
                    const parts = baseName.split('_');
                    return parts.length > 1 && !isNaN(parts[0]) ? parts.slice(1).join('_') : baseName;
                } catch { return t('file_stored'); }
            }
            return t('file_unknown');
        };

        const handleDelete = (index) => {
            if (readOnly) return;
            const newFiles = fileList.filter((_, i) => i !== index);
            updateLot(updateFilesKey, newFiles);
        };

        const handleFileClick = (file) => {
            const fileUrl = typeof file === 'string' ? file : (file.url || file.src);
            if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('http')) {
                window.open(fileUrl, '_blank');
            } else {
                alert(t('msg_save_first'));
            }
        };

        return (
            <div className="mt-2 space-y-1 relative block">
                {fileList.map((file, index) => {
                    const fileName = getFileName(file);
                    const isPdf = fileName.toLowerCase().endsWith('.pdf');
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
                                    {fileName} {isSaved ? '' : t('file_need_save')}
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

    // [RRT Calculation Logic Fix]
    // Content가 가장 높은 피크를 Main Peak로 설정하고, 해당 RT를 기준으로 RRT 계산
    const calculateGridRRT = (gridData) => {
        if (!gridData) return [];

        // 1. 데이터 복사
        let newData = gridData.map(row => [...row]);

        // 2. 강제로 4행 구조(Header, RT, RRT, Content) 맞추기
        while (newData.length < 4) {
            const colCount = newData.length > 0 ? newData[0].length : 2;
            newData.push(new Array(colCount).fill(''));
        }
        if (newData.length > 4) {
            newData = newData.slice(0, 4);
        }

        // 3. 첫 번째 열(Parameter) 이름 강제 복구
        newData[0][0] = 'Parameter';
        newData[1][0] = 'RT';
        newData[2][0] = 'RRT';
        newData[3][0] = 'Content';

        // 4. 행 정의
        const rtRow = newData[1];
        const contentRow = newData[3];

        let mainPeakColIndex = -1;
        let maxContent = -1;

        // 5. Content 행(Row 3)에서 가장 큰 값(Main Peak) 찾기
        // (Col 1부터 시작, 0은 라벨임)
        for (let c = 1; c < contentRow.length; c++) {
            // 쉼표, 퍼센트, 공백 제거 후 숫자 변환
            const valStr = String(contentRow[c]).replace(/,/g, '').replace(/%/g, '').trim();
            const val = parseFloat(valStr);

            // 값이 존재하고 현재 최대값보다 크면 갱신
            if (!isNaN(val) && val > maxContent) {
                maxContent = val;
                mainPeakColIndex = c;
            }
        }

        // 6. 기준 RT 찾기 (Main Peak의 RT)
        let mainRT = 0;
        if (mainPeakColIndex !== -1) {
            const rtStr = String(rtRow[mainPeakColIndex]).replace(/,/g, '').trim();
            mainRT = parseFloat(rtStr);
        }

        // 7. RRT 계산 (각 Peak RT / Main RT)
        // Main RT가 유효해야 계산 가능
        if (!isNaN(mainRT) && mainRT > 0) {
            for (let c = 1; c < newData[2].length; c++) {
                const currentRTStr = String(rtRow[c]).replace(/,/g, '').trim();
                const currentRT = parseFloat(currentRTStr);

                if (!isNaN(currentRT) && currentRT > 0) {
                    newData[2][c] = (currentRT / mainRT).toFixed(2);
                } else {
                    // RT가 없거나 0이면 RRT도 빈칸
                    newData[2][c] = '';
                }
            }
        } else {
            // Main Peak를 못 찾았거나 RT가 0이면 RRT 전체 초기화
             for (let c = 1; c < newData[2].length; c++) {
                 newData[2][c] = '';
             }
        }

        return newData;
    };

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
        if (readOnly) return;
        const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const nextNum = material.lots.length + 1;
        const newName = `LOT-${todayStr}-${nextNum}`;

        let newLot;
        if (activeLot) {
            newLot = JSON.parse(JSON.stringify(activeLot));
            newLot.id = Date.now();
            newLot.name = newName;
        } else {
            const baseData = { name: newName };
            newLot = sanitizeLot(baseData);
        }
        updateMaterial({ ...material, lots: [...material.lots, newLot] }); 
        setActiveLotId(newLot.id); 
    };

    const handleDeleteLot = (e, lotId) => {
        e.stopPropagation(); 
        if (readOnly) return;
        if (!window.confirm(t('delete_lot_confirm'))) return;

        const newLots = material.lots.filter(l => l.id !== lotId);
        updateMaterial({ ...material, lots: newLots });

        if (activeLotId === lotId) {
            setActiveLotId(newLots.length > 0 ? newLots[0].id : null);
        }
    };

    const getCurrentGrid = () => {
        if (activeGridTab === 'p') return { data: activeLot.hplcGridP, key: 'hplcGridP', title: `${activeLot.comp1Label} ${t('suffix_peaks')}` };
        if (activeGridTab === 'n') return { data: activeLot.hplcGridN, key: 'hplcGridN', title: `${activeLot.comp2Label} ${t('suffix_peaks')}` };
        if (activeGridTab === '3') return { data: activeLot.hplcGrid3, key: 'hplcGrid3', title: `${activeLot.comp3Label} ${t('suffix_peaks')}` };
        
        let safeData = activeLot.hplcGrid;
        // [변경] 행 개수 4개로 보정
        if (safeData && safeData.length > 4) {
            safeData = safeData.slice(0, 4);
        }
        return { data: safeData, key: 'hplcGrid', title: `Final Product ${t('suffix_peaks')}` };
    };
    const currentGridInfo = activeLot ? getCurrentGrid() : null;

    const handleAddColumn = () => {
        if (!activeLot || readOnly) return;
        const key = currentGridInfo.key;
        const currentData = activeLot[key] || [];
        
        const newData = currentData.map((row, idx) => {
            if (idx === 0) return [...row, `Peak ${row.length}`];
            return [...row, ''];
        });
        
        updateLot(key, newData);
    };

    const handleDeleteColumn = (colIdx) => {
        if (!activeLot || readOnly) return;
        if (!window.confirm(t('confirm_del_col'))) return;

        const key = currentGridInfo.key;
        const currentData = activeLot[key] || [];

        const newData = currentData.map(row => row.filter((_, i) => i !== colIdx));
        
        if (newData.length > 0) {
            newData[0] = newData[0].map((cell, i) => i === 0 ? cell : `Peak ${i}`);
        }

        updateLot(key, newData);
    };

    const renderCompInput = (label, colorClass, borderClass, prefix) => (
        <div className={`p-3 rounded-xl border ${colorClass} ${borderClass}`}>
            <div className={`text-xs font-bold text-center rounded py-1 mb-2 ${colorClass.replace('/50','').replace('bg-','text-').replace('-50','-600')} ${colorClass.replace('/50','').replace('bg-','bg-').replace('-50','-100')}`}>
                {label} {t('comp_label')}
            </div>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[9px] text-slate-400 block font-bold">{t('syn_yield')}</label>
                        <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none" value={activeLot[`synYield${prefix}`]} onChange={e=>updateLot(`synYield${prefix}`, e.target.value)} placeholder="0"/><span className="text-[10px] text-slate-400">%</span></div>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-400 block font-bold">{t('sub_yield')}</label>
                        <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none" value={activeLot[`subYield${prefix}`]} onChange={e=>updateLot(`subYield${prefix}`, e.target.value)} placeholder="0"/><span className="text-[10px] text-slate-400">%</span></div>
                    </div>
                </div>
                <div className={`border-t ${borderClass} pt-1`}>
                    <label className="text-[9px] text-slate-400 block font-bold">{t('syn_purity')} <span className="text-rose-500">*</span></label>
                    <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-lg font-black text-slate-800 outline-none" value={activeLot[`hplcSyn${prefix}`]} onChange={e=>updateLot(`hplcSyn${prefix}`, e.target.value)} placeholder="0.00"/><span className="text-[10px] text-slate-400">%</span></div>
                </div>
                <div className={`border-t ${borderClass} pt-1`}>
                    <label className="text-[9px] text-slate-400 block font-bold">{t('sub_purity')} <span className="text-rose-500">*</span></label>
                    <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-lg font-black text-brand-600 outline-none" value={activeLot[`hplcSub${prefix}`]} onChange={e=>updateLot(`hplcSub${prefix}`, e.target.value)} placeholder="0.00"/><span className="text-[10px] text-slate-400">%</span></div>
                </div>
                <div className={`border-t ${borderClass} pt-1`}>
                    <label className="text-[9px] text-slate-400 block font-bold">{t('d_rate')} <span className="text-rose-500">*</span></label>
                    <div className="flex items-baseline"><input disabled={readOnly} className="w-full bg-transparent text-lg font-black text-amber-600 outline-none" value={activeLot[`dRate${prefix}`]} onChange={e=>updateLot(`dRate${prefix}`, e.target.value)} placeholder="0"/><span className="text-[10px] text-slate-400">%</span></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-slate-50">
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-500">{t('select_lot')}</span>
                    {!readOnly && <button onClick={addLot} className="text-brand-600 hover:bg-brand-50 rounded p-1" title={t('add_lot_tooltip')}><Icon name="plus" size={14}/></button>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {material.lots.map(l => (
                        <div 
                            key={l.id} 
                            onClick={() => setActiveLotId(l.id)} 
                            className={`group p-3 rounded-lg text-sm cursor-pointer flex justify-between items-center ${activeLotId === l.id ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span className="truncate">{l.name}</span>
                            {!readOnly && (
                                <button 
                                    onClick={(e) => handleDeleteLot(e, l.id)}
                                    className="hidden group-hover:block text-slate-400 hover:text-rose-500 transition p-0.5"
                                    title={t('delete_lot_tooltip')}
                                >
                                    <Icon name="trash-2" size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {activeLot ? (
                    <>
                        <div className="flex justify-between items-end pb-4 border-b border-slate-200">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1 font-bold">{t('lot_id')}</label>
                                <input disabled={readOnly} className="bg-transparent text-3xl font-black text-slate-800 outline-none w-full" value={activeLot.name} onChange={e => updateLot('name', e.target.value)} />
                            </div>
                            <div className="flex gap-2 bg-slate-200 p-1 rounded-lg">
                                <button onClick={()=>setViewMode('chemical')} className={`px-4 py-2 rounded text-sm font-bold transition ${viewMode==='chemical'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{t('view_chemical')}</button>
                                <button onClick={()=>setViewMode('device')} className={`px-4 py-2 rounded text-sm font-bold transition ${viewMode==='device'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{t('view_device')}</button>
                            </div>
                        </div>

                        {viewMode === 'chemical' ? (
                            <div className="grid grid-cols-12 gap-6 animate-in">
                                <div className="col-span-12 glass-panel p-6 rounded-xl bg-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-slate-700 font-bold flex items-center gap-2"><Icon name="activity" size={18}/> {t('hplc_purity_title')}</h4>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                                                <input type="checkbox" className="w-4 h-4 accent-brand-600 rounded cursor-pointer" checked={activeLot.isMix} onChange={e=>{updateLot('isMix', e.target.checked); setActiveGridTab('main');}} disabled={readOnly}/>
                                                <span className="text-xs font-bold text-slate-600">{t('mix_product')}</span>
                                            </label>
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                <span className="text-xs text-slate-500 font-bold">{t('method_ver')}</span>
                                                <select disabled={readOnly} className="bg-transparent text-xs font-mono text-brand-600 font-bold outline-none cursor-pointer" value={activeLot.hplcMethodVersion} onChange={e=>updateLot('hplcMethodVersion', e.target.value)}>
                                                    <option value="">None</option>
                                                    {material.methods && material.methods.map(m => (<option key={m.id} value={m.version}>{m.version}</option>))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {activeLot.isMix ? (
                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-2 overflow-x-auto">
                                                    <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1"><Icon name="git-merge" size={12}/> {t('ratio')}</span>
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
                                                <button onClick={()=>setActiveGridTab('main')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='main'?'border-slate-800 text-slate-800':'border-transparent text-slate-400 hover:text-slate-600'}`}>{t('btn_final_mix')}</button>
                                                <button onClick={()=>setActiveGridTab('p')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='p'?'border-blue-500 text-blue-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>{activeLot.comp1Label}</button>
                                                <button onClick={()=>setActiveGridTab('n')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='n'?'border-rose-500 text-rose-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>{activeLot.comp2Label}</button>
                                                {activeLot.mixCount === 3 && <button onClick={()=>setActiveGridTab('3')} className={`px-4 py-2 text-xs font-bold border-b-2 transition ${activeGridTab==='3'?'border-emerald-500 text-emerald-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>{activeLot.comp3Label}</button>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 space-y-4">
                                            {/* [Non-Mix View] Updated Layout: Yield above Purity */}
                                            <div className="grid grid-cols-3 gap-6">
                                                {/* Synthesis Card */}
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-full">
                                                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200/60">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('syn_yield')}</span>
                                                        <div className="flex items-baseline">
                                                            <input disabled={readOnly} className="bg-transparent text-lg font-bold text-slate-700 outline-none w-16 text-right" value={activeLot.synYield || ''} onChange={e=>updateLot('synYield', e.target.value)} placeholder="0"/>
                                                            <span className="text-xs font-medium text-slate-400 ml-1">%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-slate-600">{t('synthesis')} <span className="text-rose-500">*</span></span>
                                                        <div className="flex items-baseline">
                                                            <input disabled={readOnly} className="bg-transparent text-2xl font-black text-slate-800 outline-none w-24 text-right" value={activeLot.hplcSyn} onChange={e=>updateLot('hplcSyn', e.target.value)} placeholder="0.0"/>
                                                            <span className="text-sm font-medium text-slate-400 ml-1">%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sublimation Card */}
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-full">
                                                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200/60">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('sub_yield')}</span>
                                                        <div className="flex items-baseline">
                                                            <input disabled={readOnly} className="bg-transparent text-lg font-bold text-slate-700 outline-none w-16 text-right" value={activeLot.subYield || ''} onChange={e=>updateLot('subYield', e.target.value)} placeholder="0"/>
                                                            <span className="text-xs font-medium text-slate-400 ml-1">%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-slate-600">{t('sublimation')} <span className="text-rose-500">*</span></span>
                                                        <div className="flex items-baseline">
                                                            <input disabled={readOnly} className="bg-transparent text-2xl font-black text-brand-600 outline-none w-24 text-right" value={activeLot.hplcSub} onChange={e=>updateLot('hplcSub', e.target.value)} placeholder="0.0"/>
                                                            <span className="text-sm font-medium text-slate-400 ml-1">%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* D-Rate Card */}
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                                                    <span className="text-sm font-bold text-amber-700">{t('d_rate')} <span className="text-rose-500">*</span></span>
                                                    <div className="flex items-baseline">
                                                        <input disabled={readOnly} className="bg-transparent text-3xl font-black text-amber-600 outline-none w-24 text-right" value={activeLot.dRate} onChange={e=>updateLot('dRate', e.target.value)} placeholder="0"/>
                                                        <span className="text-sm font-medium text-amber-400 ml-1">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* File Uploaders */}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="flex flex-col">
                                                    <FileUploader 
                                                        files={activeLot.hplcSynFiles || []} 
                                                        setFiles={f => updateLot('hplcSynFiles', f)} 
                                                        label={t('file_syn_hplc')}
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
                                                        label={t('file_sub_hplc')}
                                                        readOnly={readOnly} 
                                                        hideList={true}
                                                        accept=".pdf,.png,.jpg,.jpeg"
                                                    />
                                                    {renderFileList(activeLot.hplcSubFiles, 'hplcSubFiles')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6 mt-4"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('syn_history')}</label><textarea disabled={readOnly} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none" rows="3" value={activeLot.synHistory || ''} onChange={e=>updateLot('synHistory', e.target.value)}></textarea></div>
                                    
                                    <ExcelCompatibleGrid 
                                        key={currentGridInfo.key} 
                                        data={currentGridInfo.data} 
                                        setData={d => {
                                            const calculated = calculateGridRRT(d);
                                            updateLot(currentGridInfo.key, calculated);
                                        }} 
                                        readOnly={readOnly}
                                        title={currentGridInfo.title}
                                        t={t}
                                        onAddColumn={handleAddColumn}
                                        onDeleteColumn={handleDeleteColumn}
                                    />
                                </div>
                                
                                <div className="col-span-12 glass-panel p-6 rounded-xl bg-white">
                                    <h4 className="text-slate-700 font-bold mb-4 flex items-center gap-2"><Icon name="alert-triangle" size={18}/> {t('impurity_title')}</h4>
                                    <div className="mb-6"><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('halogen_ppm')}</label><div className="flex gap-4">{['f','cl','br'].map(el => (<div key={el} className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"><span className="text-xs font-bold text-slate-500 uppercase mr-2">{el}</span><input disabled={readOnly} className="bg-transparent text-slate-800 font-bold outline-none w-16 text-right" placeholder="0" value={activeLot.halogen[el]} onChange={e=>updateLot('halogen', {...activeLot.halogen, [el]:e.target.value})} /></div>))}</div></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('metal_ppm')}</label><div className="flex flex-wrap gap-2">{metalElements.map((el) => (<div key={el} className="bg-slate-50 border border-slate-200 rounded p-2 text-center min-w-[60px]"><span className="text-[10px] text-slate-400 block font-bold mb-1">{el}</span><input disabled={readOnly} className="w-full bg-transparent text-center font-bold text-slate-800 outline-none text-sm" value={activeLot.metalResults?.[el] || ''} onChange={e=>{const newResults = {...(activeLot.metalResults || {})}; newResults[el] = e.target.value; updateLot('metalResults', newResults);}} placeholder="-"/></div>))}</div></div>
                                </div>
                                
                                <div className="col-span-12 grid grid-cols-2 gap-6">
                                    <Card title={t('tga_title')} icon="flame" color="text-amber-600" action={null}>
                                        <div className="flex gap-4 mb-3 p-2 bg-amber-50/50 rounded-lg border border-amber-100"><div className="flex-1"><label className="text-[10px] font-bold text-amber-600 block mb-1">{t('td1')}</label><input disabled={readOnly} className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-amber-500" value={activeLot.td1} onChange={e=>updateLot('td1', e.target.value)} placeholder="-"/></div><div className="flex-1"><label className="text-[10px] font-bold text-amber-600 block mb-1">{t('td5')}</label><input disabled={readOnly} className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-amber-500" value={activeLot.td5} onChange={e=>updateLot('td5', e.target.value)} placeholder="-"/></div></div>
                                        <div className="grid grid-cols-2 gap-2" style={{ height: '160px' }}>{activeLot.tgaImages?.map((img,i)=><ImageUploader key={i} value={img.src} onChange={v=>v?null:updateLot('tgaImages', activeLot.tgaImages.filter((_,x)=>x!==i))} readOnly={readOnly}/>)}<ImageUploader onChange={v=>v&&updateLot('tgaImages',[...(activeLot.tgaImages||[]),{src:v}])} label={t('add_graph')} readOnly={readOnly}/></div>
                                    </Card>
                                    <Card title={t('dsc_title')} icon="thermometer" color="text-amber-600" action={null}>
                                            <div className="grid grid-cols-2 gap-2" style={{ height: '160px' }}>{activeLot.dscImages?.map((img,i)=><ImageUploader key={i} value={img.src} onChange={v=>v?null:updateLot('dscImages', activeLot.dscImages.filter((_,x)=>x!==i))} readOnly={readOnly}/>)}<ImageUploader onChange={v=>v&&updateLot('dscImages',[...(activeLot.dscImages||[]),{src:v}])} label={t('add_graph')} readOnly={readOnly}/></div>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-12 gap-6 animate-in">
                                <div className="col-span-4 space-y-6">
                                    <Card title={t('eff')} icon="zap" color="text-emerald-600"><input disabled={readOnly} className="text-5xl font-black text-slate-800 text-center w-full outline-none bg-transparent" value={activeLot.ivlEff || ''} onChange={e=>updateLot('ivlEff', e.target.value)} /><span className="text-center block text-slate-400 text-sm">%</span></Card>
                                    <Card title={t('lifetime')} icon="clock" color="text-blue-600"><input disabled={readOnly} className="text-5xl font-black text-slate-800 text-center w-full outline-none bg-transparent" value={activeLot.lifetime || ''} onChange={e=>updateLot('lifetime', e.target.value)} /><span className="text-center block text-slate-400 text-sm">%</span></Card>
                                </div>
                                <div className="col-span-8 bg-white p-6 rounded-xl border border-slate-200 h-full relative group">
                                    <div className="flex justify-between items-center mb-4"><h4 className="text-slate-700 font-bold flex items-center gap-2"><Icon name="image" size={16}/> {t('eval_data')}</h4></div>
                                    <div className="grid grid-cols-3 gap-4" style={{ gridAutoRows: '150px' }}>{activeLot.deviceImages?.map((img,i)=><ImageUploader key={i} value={img.src} onChange={v=>v?null:updateLot('deviceImages', activeLot.deviceImages.filter((_,x)=>x!==i))} readOnly={readOnly}/>)}<ImageUploader onChange={v=>v&&updateLot('deviceImages',[...(activeLot.deviceImages||[]),{src:v}])} label={t('add_plot')} readOnly={readOnly}/></div>
                                </div>
                            </div>
                        )}
                    </>
                ) : <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-4"><Icon name="flask-conical" size={48} className="opacity-20"/><p>{t('no_lot_selected')}</p></div>}
            </div>
        </div>
    );
};