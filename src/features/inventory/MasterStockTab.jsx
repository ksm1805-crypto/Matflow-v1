import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { KetcherModal } from '../../components/ui/KetcherModal';
import { getRDKit } from '../../utils/rdkit';
import { generateId } from '../../utils/math';
import { fmtN } from '../../utils/format';

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        // Header
        title: "마스터 재고 목록",
        desc: "전사적 재고 관리 (Global DB)",
        search_ph: "이름 또는 CAS 검색...",
        filter_active: "구조 검색 활성",
        btn_add: "항목 추가",
        
        // Table Columns
        col_struct: "구조식",
        col_no: "No.",
        col_name: "재료명",
        col_cas: "CAS No.",
        col_purity: "순도",
        col_stock: "총 재고",
        col_maker: "제조사",
        col_loc: "위치",
        col_note: "비고",
        col_usage: "최근 / 전체",
        
        // Placeholders
        ph_name: "재료명 입력",
        ph_purity: "99.9",
        ph_stock: "0",
        ph_unit: "g",
        ph_desc: "메모",
        
        // Usage Modal
        usage_title: "사용 이력",
        date: "날짜",
        amount: "사용량",
        purpose: "용도 / 사용처",
        manager: "담당자",
        btn_add_usage: "추가",
        curr_stock: "현재 재고:",
        no_usage: "사용 이력이 없습니다.",
        total: "누적:",
        
        // Alerts & Confirms
        alert_fill: "사용량, 용도, 담당자를 모두 입력해주세요.",
        alert_invalid: "유효하지 않은 수량입니다.",
        confirm_exceed: "경고: 사용량이 현재 재고를 초과합니다. 계속하시겠습니까?",
        confirm_del_usage: "이 사용 기록을 삭제하시겠습니까? 재고가 복구됩니다.",
        confirm_del_item: "이 항목을 삭제하시겠습니까?",
        no_match: "일치하는 구조가 없습니다.",
        
        // CAS Select Modal
        select_cas: "CAS 번호 선택",
        cas_msg: "여러 개의 CAS 번호가 검색되었습니다. 올바른 것을 선택해주세요:",
        
        // Pagination
        showing: "표시 중",
        to: "~",
        of: "전체",
        prev: "이전",
        next: "다음",
        page: "페이지"
    },
    en: {
        title: "Master Stock List",
        desc: "Global Inventory Management",
        search_ph: "Name or CAS...",
        filter_active: "Structure Filter Active",
        btn_add: "Add Item",
        
        col_struct: "Structure",
        col_no: "No.",
        col_name: "Material Name",
        col_cas: "CAS No.",
        col_purity: "Purity",
        col_stock: "Total Stock",
        col_maker: "Maker",
        col_loc: "Location",
        col_note: "Note",
        col_usage: "Last / Total",
        
        ph_name: "Material Name",
        ph_purity: "99.9",
        ph_stock: "0",
        ph_unit: "g",
        ph_desc: "Memo",
        
        usage_title: "Usage History",
        date: "Date",
        amount: "Amount",
        purpose: "Purpose / Where Used",
        manager: "Manager",
        btn_add_usage: "Add",
        curr_stock: "Current Stock:",
        no_usage: "No usage history recorded.",
        total: "Total:",
        
        alert_fill: "Please fill in Amount, Purpose, and Manager.",
        alert_invalid: "Invalid amount.",
        confirm_exceed: "Warning: Usage amount exceeds current stock. Continue?",
        confirm_del_usage: "Delete this usage record? Stock will be restored.",
        confirm_del_item: "Delete this item?",
        no_match: "No matching structures found.",
        
        select_cas: "Select CAS No.",
        cas_msg: "Multiple CAS numbers found. Please select the correct one:",
        
        showing: "Showing",
        to: "to",
        of: "of",
        prev: "Previous",
        next: "Next",
        page: "Page"
    },
    zh: {
        title: "主库存清单",
        desc: "全球库存管理",
        search_ph: "名称或 CAS...",
        filter_active: "结构筛选激活",
        btn_add: "添加项目",
        
        col_struct: "结构式",
        col_no: "序号",
        col_name: "材料名称",
        col_cas: "CAS 号",
        col_purity: "纯度",
        col_stock: "总库存",
        col_maker: "制造商",
        col_loc: "位置",
        col_note: "备注",
        col_usage: "最近 / 总计",
        
        ph_name: "材料名称",
        ph_purity: "99.9",
        ph_stock: "0",
        ph_unit: "g",
        ph_desc: "备注",
        
        usage_title: "使用记录",
        date: "日期",
        amount: "数量",
        purpose: "用途",
        manager: "负责人",
        btn_add_usage: "添加",
        curr_stock: "当前库存:",
        no_usage: "无使用记录。",
        total: "累计:",
        
        alert_fill: "请填写数量、用途和负责人。",
        alert_invalid: "数量无效。",
        confirm_exceed: "警告：使用量超过当前库存。是否继续？",
        confirm_del_usage: "删除此使用记录？库存将恢复。",
        confirm_del_item: "删除此项目？",
        no_match: "未找到匹配的结构。",
        
        select_cas: "选择 CAS 号",
        cas_msg: "找到多个 CAS 号。请选择正确的一个：",
        
        showing: "显示",
        to: "至",
        of: "共",
        prev: "上一页",
        next: "下一页",
        page: "页"
    }
};

// [New Component] Usage Numeric Display (숫자 중심 표시)
const UsageNumericDisplay = ({ history, unit, onClick, lang }) => {
    const t = (key) => TRANSLATIONS[lang][key] || key;

    if (!history || history.length === 0) {
        return (
            <div onClick={onClick} className="text-[10px] text-slate-300 cursor-pointer hover:text-slate-500 h-full flex items-center">
                -
            </div>
        );
    }

    const last = history[0];
    const total = history.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

    return (
        <div onClick={onClick} className="cursor-pointer flex flex-col justify-center h-full group py-0.5">
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-600 group-hover:text-rose-700 transition">
                    -{fmtN(last.amount)}{unit}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-600 font-mono">
                    {last.date.slice(5)}
                </span>
            </div>
            <div className="text-[9px] text-slate-400 group-hover:text-slate-500 mt-0.5">
                {t('total')} -{fmtN(total)}{unit} <span className="opacity-70">({history.length})</span>
            </div>
        </div>
    );
};

// [Component] Usage History Modal
const UsageHistoryModal = ({ isOpen, onClose, item, onUpdateItem, readOnly, lang }) => {
    const t = (key) => TRANSLATIONS[lang][key] || key;
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        purpose: '',
        manager: ''
    });

    if (!isOpen || !item) return null;

    const history = item.usageHistory || [];

    const handleAdd = () => {
        if (!formData.amount || !formData.purpose || !formData.manager) {
            alert(t('alert_fill'));
            return;
        }

        const usageAmount = parseFloat(formData.amount);
        if (isNaN(usageAmount) || usageAmount <= 0) {
            alert(t('alert_invalid'));
            return;
        }

        const currentStock = parseFloat(item.currentStock) || 0;
        
        if (usageAmount > currentStock) {
            if(!window.confirm(`${t('confirm_exceed')} (${usageAmount} > ${currentStock})`)) return;
        }

        const newRecord = {
            id: generateId(),
            ...formData,
            amount: usageAmount
        };

        const updatedItem = {
            ...item,
            currentStock: currentStock - usageAmount,
            usageHistory: [newRecord, ...history] 
        };

        onUpdateItem(updatedItem);
        setFormData({ ...formData, amount: '', purpose: '' });
    };

    const handleDelete = (recordId) => {
        if (readOnly) return;
        if (!window.confirm(t('confirm_del_usage'))) return;

        const record = history.find(r => r.id === recordId);
        if (!record) return;

        const updatedItem = {
            ...item,
            currentStock: (parseFloat(item.currentStock) || 0) + parseFloat(record.amount),
            usageHistory: history.filter(r => r.id !== recordId)
        };

        onUpdateItem(updatedItem);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-slate-800 font-bold flex items-center gap-2 text-lg">
                            <Icon name="history" size={20} className="text-brand-600" /> {t('usage_title')}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{item.name} ({item.casNo})</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {!readOnly && (
                        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('date')}</label>
                                <input type="date" className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-brand-500" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('amount')} ({item.unit})</label>
                                <input type="number" className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-brand-500" placeholder="0.0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div className="col-span-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('purpose')}</label>
                                <input type="text" className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-brand-500" placeholder="e.g. Project A" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">{t('manager')}</label>
                                <input type="text" className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-brand-500" placeholder="Name" value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <button onClick={handleAdd} className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded hover:bg-black transition shadow-sm">{t('btn_add_usage')}</button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto custom-scrollbar flex-1 bg-white p-4">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white text-slate-500 border-b border-slate-200 uppercase font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="py-2 pl-2 w-24">{t('date')}</th>
                                    <th className="py-2 w-24 text-right pr-4">{t('amount')}</th>
                                    <th className="py-2">{t('purpose')}</th>
                                    <th className="py-2 w-24">{t('manager')}</th>
                                    {!readOnly && <th className="py-2 w-10 text-center"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.length > 0 ? history.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50">
                                        <td className="py-2 pl-2 text-slate-600">{rec.date}</td>
                                        <td className="py-2 text-right pr-4 font-bold text-rose-600">-{fmtN(rec.amount)} <span className="text-[9px] text-slate-400 font-normal">{item.unit}</span></td>
                                        <td className="py-2 text-slate-800 font-medium">{rec.purpose}</td>
                                        <td className="py-2 text-slate-500">{rec.manager}</td>
                                        {!readOnly && (
                                            <td className="py-2 text-center">
                                                <button onClick={() => handleDelete(rec.id)} className="text-slate-300 hover:text-rose-500 transition">
                                                    <Icon name="trash-2" size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">{t('no_usage')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-3 border-t border-slate-200 text-right">
                    <div className="text-xs text-slate-500">
                        {t('curr_stock')} <span className="font-bold text-slate-800 text-sm">{fmtN(item.currentStock)} {item.unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Component: Modal for selecting a CAS number
const CasSelectModal = ({ isOpen, candidates, onSelect, onClose, lang }) => {
  const t = (key) => TRANSLATIONS[lang][key] || key;
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="bg-brand-50 p-4 border-b border-brand-100 flex justify-between items-center">
          <h3 className="text-brand-700 font-bold flex items-center gap-2">
            <Icon name="list" size={18} /> {t('select_cas')}
          </h3>
          <button onClick={onClose} className="text-brand-400 hover:text-brand-700">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <p className="text-xs text-slate-500 mb-3">
            {t('cas_msg')}
          </p>
          <div className="space-y-2">
            {candidates.map((cas) => (
              <button
                key={cas}
                onClick={() => onSelect(cas)}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition flex justify-between items-center group"
              >
                <span className="font-mono font-bold text-slate-700">{cas}</span>
                <Icon
                  name="check-circle"
                  className="text-brand-500 opacity-0 group-hover:opacity-100 transition"
                  size={16}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MasterStockTab = ({
  globalInventory = [],
  updateGlobalInventory,
  readOnly,
  lang = 'ko' // lang 기본값 설정
}) => {
  const t = (key) => TRANSLATIONS[lang][key] || key; // 번역 헬퍼

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [matchedIds, setMatchedIds] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetItemId, setTargetItemId] = useState(null);
  const [usageModalItem, setUsageModalItem] = useState(null);

  const [casSelectData, setCasSelectData] = useState({
    isOpen: false,
    candidates: [],
    pendingInfo: null,
  });

  const normalizeSmiles = async (smiles) => {
    if (!smiles) return '';
    try {
      const rdkit = await getRDKit();
      const mol = rdkit.get_mol(smiles);
      if (!mol) return '';
      const canon = mol.get_smiles();
      mol.delete();
      return canon || '';
    } catch (e) {
      return '';
    }
  };

  const parseMatchAtoms = (matchJson) => {
    if (!matchJson || matchJson === '{}' || matchJson === '""') return null;
    try {
      const parsed = JSON.parse(matchJson);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.atoms)) return parsed.atoms;
      if (parsed && typeof parsed === 'object') {
        const vals = Object.values(parsed);
        if (vals.every((v) => Number.isInteger(v))) return vals;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const addNewItem = () => {
    if (readOnly) return;
    const newItem = {
      id: Date.now(),
      name: 'New Material',
      casNo: '',
      purity: '',
      unit: 'g',
      currentStock: 0,
      location: '',
      maker: '',
      description: '',
      usageHistory: [], 
      structureSmiles: '',
      structureMol: '',
      structureSvg: '',
      hasStructure: false,
    };
    updateGlobalInventory([newItem, ...globalInventory]);
    setCurrentPage(1);
  };

  const updateItem = (id, key, value) => {
    if (readOnly) return;
    const updated = globalInventory.map((item) =>
      item.id === id ? { ...item, [key]: value } : item
    );
    updateGlobalInventory(updated);
  };

  const handleFullUpdateItem = (newItem) => {
    if (readOnly) return;
    const updated = globalInventory.map(item => item.id === newItem.id ? newItem : item);
    updateGlobalInventory(updated);
    setUsageModalItem(newItem);
  };

  const deleteItem = (id) => {
    if (readOnly) return;
    if (window.confirm(t('confirm_del_item'))) {
      updateGlobalInventory(globalInventory.filter((item) => item.id !== id));
    }
  };

  const openStructureEditor = (id) => {
    if (readOnly) return;
    setTargetItemId(id);
    setIsEditModalOpen(true);
  };

  const handleStructureSave = async (smiles, molfile, svg, identifiedInfo) => {
    if (!targetItemId) return;

    const canon = await normalizeSmiles(smiles);
    const finalSmiles = canon || smiles || '';

    const baseData = {
      structureSmiles: finalSmiles,
      structureMol: molfile,
      structureSvg: svg,
      hasStructure: !!finalSmiles,
      identifiedInfo: identifiedInfo,
    };

    if (
      identifiedInfo &&
      identifiedInfo.casCandidates &&
      identifiedInfo.casCandidates.length > 1
    ) {
      setCasSelectData({
        isOpen: true,
        candidates: identifiedInfo.casCandidates,
        pendingInfo: baseData,
      });
      setIsEditModalOpen(false);
    } else {
      applyUpdate(baseData);
      setIsEditModalOpen(false);
    }
  };

  const applyUpdate = (data, selectedCas = null) => {
    if (!targetItemId) return;
    const { structureSmiles, structureMol, structureSvg, hasStructure, identifiedInfo } = data;

    const updated = globalInventory.map((item) => {
      if (item.id === targetItemId) {
        const newItem = {
          ...item,
          structureSmiles,
          structureMol,
          structureSvg,
          hasStructure,
        };
        if (identifiedInfo) {
          if (!item.name || item.name === 'New Material') {
            newItem.name = identifiedInfo.name;
          }
          const finalCas = selectedCas || identifiedInfo.casNo;
          if (!item.casNo && finalCas) {
            newItem.casNo = finalCas;
          }
          if (!item.description) {
            newItem.description = identifiedInfo.description;
          }
        }
        return newItem;
      }
      return item;
    });

    updateGlobalInventory(updated);
  };

  const handleCasSelected = (selectedCas) => {
    if (casSelectData.pendingInfo) {
      applyUpdate(casSelectData.pendingInfo, selectedCas);
    }
    setCasSelectData({ isOpen: false, candidates: [], pendingInfo: null });
  };

  const runStructureSearch = async (querySmiles) => {
    if (!querySmiles) {
      setMatchedIds(null);
      setIsSearchModalOpen(false);
      return;
    }
    setIsSearching(true);
    setIsSearchModalOpen(false);

    try {
      const rdkit = await getRDKit();
      let queryMol = null;
      try { queryMol = rdkit.get_mol(querySmiles); } catch { alert('Invalid structure'); return; }
      if (!queryMol) { alert('Invalid Structure Query'); return; }

      let queryCanon = '';
      try { queryCanon = queryMol.get_smiles() || ''; } catch {}

      const matches = [];
      for (const item of globalInventory) {
        if (!item.structureSmiles) continue;
        let targetMol = null;
        try {
          targetMol = rdkit.get_mol(item.structureSmiles);
          if (!targetMol) continue;
          let targetCanon = '';
          try { targetCanon = targetMol.get_smiles() || ''; } catch {}

          if (queryCanon && targetCanon && queryCanon === targetCanon) {
            matches.push(item.id);
            continue;
          }
          if (typeof targetMol.has_substruct_match === 'function') {
            if (targetMol.has_substruct_match(queryMol)) matches.push(item.id);
            continue;
          }
          const matchJson = targetMol.get_substruct_match(queryMol);
          const atoms = parseMatchAtoms(matchJson);
          if (atoms && atoms.length > 0) matches.push(item.id);
        } catch {} finally { if (targetMol) targetMol.delete(); }
      }
      queryMol.delete();

      if (matches.length === 0) alert(t('no_match'));
      setMatchedIds(matches);
      setCurrentPage(1);
    } catch {
      alert('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const clearStructureSearch = () => {
    setMatchedIds(null);
    setCurrentPage(1);
  };

  const currentStructure = globalInventory.find((item) => item.id === targetItemId)?.structureSmiles || '';

  const filteredInventory = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return globalInventory.filter((item) => {
      const name = item.name || '';
      const cas = item.casNo || '';
      const matchText = name.toLowerCase().includes(term) || (cas || '').includes(searchTerm);
      const matchStructure = matchedIds === null || matchedIds.includes(item.id);
      return matchText && matchStructure;
    });
  }, [globalInventory, matchedIds, searchTerm]);

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const currentData = useMemo(() =>
      filteredInventory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredInventory, currentPage]
  );

  const handlePageChange = (n) => {
    if (n >= 1 && n <= (totalPages || 1)) {
      setCurrentPage(n);
      document.querySelector('.custom-scrollbar')?.scrollTo(0, 0);
    }
  };

  return (
    <div className="flex h-full bg-slate-50 flex-col p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
            <Icon name="database" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t('title')}</h2>
            <p className="text-xs text-slate-500 font-medium">{t('desc')}</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {matchedIds !== null && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 text-xs font-bold animate-in fade-in">
              <Icon name="flask-conical" size={14} />
              {t('filter_active')} ({filteredInventory.length})
              <button onClick={clearStructureSearch} className="hover:bg-purple-200 p-1 rounded-full transition ml-1">
                <Icon name="x" size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-100 transition">
            <div className="relative">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={t('search_ph')} className="pl-9 pr-2 py-1.5 bg-transparent text-sm outline-none w-48 text-slate-700 font-medium placeholder:font-normal" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button onClick={() => setIsSearchModalOpen(true)} className={`p-1.5 rounded-md transition flex items-center gap-1 text-xs font-bold ${matchedIds !== null ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-white hover:text-brand-600'}`} title="Search by Chemical Structure">
              {isSearching ? <Icon name="loader" className="animate-spin" size={16} /> : <Icon name="hexagon" size={16} />}
            </button>
          </div>

          {!readOnly && (
            <button onClick={addNewItem} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition">
              <Icon name="plus" size={16} /> {t('btn_add')}
            </button>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 w-24 text-center">{t('col_struct')}</th>
                <th className="p-3 w-12 text-center">{t('col_no')}</th>
                <th className="p-3">{t('col_name')}</th>
                <th className="p-3 w-32">{t('col_cas')}</th>
                <th className="p-3 w-20">{t('col_purity')}</th>
                <th className="p-3 w-36">{t('col_stock')}</th>
                <th className="p-3 w-24">{t('col_maker')}</th>
                <th className="p-3 w-24">{t('col_loc')}</th>
                <th className="p-3">{t('col_note')}</th>
                <th className="p-3 w-32">{t('col_usage')}</th>
                {!readOnly && <th className="p-3 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition group">
                    <td className="p-2 align-middle">
                      <div onClick={() => openStructureEditor(item.id)} className={`w-20 h-16 mx-auto rounded-lg border flex items-center justify-center cursor-pointer overflow-hidden bg-white relative ${item.hasStructure ? 'border-brand-200 shadow-sm' : 'border-slate-200 border-dashed hover:border-slate-400'}`} title={item.hasStructure ? 'Edit Structure' : 'Add Structure'}>
                        {item.structureSvg ? (
                          <div className="w-full h-full p-1 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full" dangerouslySetInnerHTML={{ __html: item.structureSvg }} />
                        ) : (
                          <Icon name="hexagon" size={20} className={item.hasStructure ? 'text-brand-500' : 'text-slate-300'} />
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                          <Icon name="edit-2" size={16} className="text-slate-700" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center text-slate-400 font-mono text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="p-3">
                      <input disabled={readOnly} className="w-full bg-transparent font-bold text-slate-700 outline-none focus:text-brand-600 focus:border-b focus:border-brand-500 transition px-1 py-0.5" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder={t('ph_name')} />
                    </td>
                    <td className="p-3">
                      <input disabled={readOnly} className="w-full bg-transparent font-mono text-xs text-slate-500 outline-none focus:text-slate-700 focus:border-b focus:border-brand-500 transition px-1 py-0.5" value={item.casNo} onChange={(e) => updateItem(item.id, 'casNo', e.target.value)} placeholder="00-00-0" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input disabled={readOnly} className="w-full bg-transparent text-right outline-none font-bold text-slate-600" value={item.purity} onChange={(e) => updateItem(item.id, 'purity', e.target.value)} placeholder={t('ph_purity')} />
                        <span className="text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1 border border-slate-200 w-full">
                        <input disabled={readOnly} type="number" className="w-full bg-transparent text-right outline-none font-bold text-slate-700" value={item.currentStock} onChange={(e) => updateItem(item.id, 'currentStock', e.target.value)} placeholder={t('ph_stock')} />
                        <input disabled={readOnly} className="w-10 bg-transparent text-xs text-center text-slate-500 outline-none font-bold" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} placeholder={t('ph_unit')} />
                      </div>
                    </td>
                    <td className="p-3">
                      <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-600 focus:border-b focus:border-brand-500 px-1" value={item.maker} onChange={(e) => updateItem(item.id, 'maker', e.target.value)} placeholder="-" />
                    </td>
                    <td className="p-3">
                      <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-600 focus:border-b focus:border-brand-500 px-1" value={item.location} onChange={(e) => updateItem(item.id, 'location', e.target.value)} placeholder="-" />
                    </td>
                    <td className="p-3">
                      <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-500 focus:border-b focus:border-brand-500 px-1" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder={t('ph_desc')} />
                    </td>
                    {/* [New] Numeric Usage Display */}
                    <td className="p-3">
                        <UsageNumericDisplay 
                            history={item.usageHistory} 
                            unit={item.unit} 
                            onClick={() => setUsageModalItem(item)}
                            lang={lang} // lang 전달
                        />
                    </td>
                    {!readOnly && (
                      <td className="p-3 text-center">
                        <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-rose-500 transition">
                          <Icon name="trash-2" size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={11} className="p-12 text-center text-slate-400">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
          <div>{t('showing')} <span className="font-bold text-slate-800">{currentData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> {t('to')} <span className="font-bold text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, filteredInventory.length)}</span> {t('of')} <span className="font-bold text-slate-800">{filteredInventory.length}</span></div>
          <div className="flex gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition">{t('prev')}</button>
            <span className="flex items-center px-2 font-bold text-slate-700">{t('page')} {currentPage} / {totalPages || 1}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition">{t('next')}</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CasSelectModal isOpen={casSelectData.isOpen} candidates={casSelectData.candidates} onSelect={handleCasSelected} onClose={() => setCasSelectData({ isOpen: false, candidates: [], pendingInfo: null })} lang={lang} />
      
      {isEditModalOpen && <KetcherModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleStructureSave} initialSmiles={currentStructure} />}
      {isSearchModalOpen && <KetcherModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onSave={(smiles) => runStructureSearch(smiles)} initialSmiles="" />}
      
      {usageModalItem && (
          <UsageHistoryModal 
            isOpen={!!usageModalItem} 
            item={usageModalItem} 
            onClose={() => setUsageModalItem(null)} 
            onUpdateItem={handleFullUpdateItem}
            readOnly={readOnly}
            lang={lang}
          />
      )}
    </div>
  );
};