import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Icon } from '../../components/ui/Icon';

const localizer = momentLocalizer(moment);

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        // Headers
        header_sched: "생산 일정",
        header_sub: "통합 생산 실행 계획 (MES)",
        
        // [수정됨] 생산 유형 (Production Types)
        type_LAB: "Lab Test",
        type_PILOT: "시양산 (Pilot)",
        type_MASS: "양산 (Mass Prod)",
        
        // Status
        status_PLANNED: "계획됨",
        status_IN_PROGRESS: "진행 중",
        status_QC_PENDING: "QC 대기",
        status_COMPLETED: "출고 완료",
        
        // Modal Labels
        lbl_type: "생산 유형",
        lbl_batch: "배치 번호 (Batch No.)",
        lbl_status: "진행 상태",
        lbl_site: "생산 공장 / 장소",
        lbl_product: "품목명 (Product Name)",
        lbl_reactor: "반응기 (Reactors)",
        lbl_qty: "목표 수량",
        lbl_manager: "담당자",
        
        // Placeholders
        ph_site: "예: 3공장 2호기",
        ph_product: "예: OLED Green Host",
        ph_qty: "예: 500g (Lab) / 100kg (Mass)",
        ph_manager: "담당자명",
        
        // Buttons & Alerts
        btn_save: "저장",
        btn_cancel: "취소",
        btn_delete: "삭제",
        btn_edit: "수정",
        
        msg_new: "새 생산 지시",
        msg_edit: "생산 지시 수정",
        alert_req: "필수 정보(품목명, 장소, 담당자)를 모두 입력해주세요.",
        confirm_no_eq: "선택된 설비가 없습니다. 계속하시겠습니까?",
        confirm_del: "정말 이 생산 일정을 삭제하시겠습니까?\n(복구할 수 없습니다)"
    },
    en: {
        header_sched: "Production Schedule",
        header_sub: "Integrated Manufacturing Execution Plan",
        
        type_LAB: "Lab Test",
        type_PILOT: "Pilot Run",
        type_MASS: "Mass Production",
        
        status_PLANNED: "Planned",
        status_IN_PROGRESS: "In Progress",
        status_QC_PENDING: "QC Pending",
        status_COMPLETED: "Released",
        
        lbl_type: "Production Type",
        lbl_batch: "Batch No.",
        lbl_status: "Status",
        lbl_site: "Factory / Site",
        lbl_product: "Product Name",
        lbl_reactor: "Reactors",
        lbl_qty: "Target Quantity",
        lbl_manager: "Person in Charge",
        
        ph_site: "e.g. Factory 3, Line 2",
        ph_product: "e.g. OLED Green Host",
        ph_qty: "e.g. 500g (Lab) / 100kg (Mass)",
        ph_manager: "Manager Name",
        
        btn_save: "Save",
        btn_cancel: "Cancel",
        btn_delete: "Delete",
        btn_edit: "Edit",
        
        msg_new: "New Production Order",
        msg_edit: "Edit Production Order",
        alert_req: "Please fill in Product Name, Site, and Manager.",
        confirm_no_eq: "No reactor selected. Continue?",
        confirm_del: "Are you sure you want to delete this schedule?\n(Cannot be undone)"
    },
    zh: {
        header_sched: "生产日程",
        header_sub: "综合生产执行计划 (MES)",
        
        type_LAB: "实验室测试 (Lab Test)",
        type_PILOT: "试生产 (Pilot)",
        type_MASS: "量产 (Mass Production)",
        
        status_PLANNED: "计划中",
        status_IN_PROGRESS: "进行中",
        status_QC_PENDING: "QC 待定",
        status_COMPLETED: "已发布",
        
        lbl_type: "生产类型",
        lbl_batch: "批号 (Batch No.)",
        lbl_status: "状态",
        lbl_site: "工厂 / 地点",
        lbl_product: "产品名称",
        lbl_reactor: "反应釜",
        lbl_qty: "目标数量",
        lbl_manager: "负责人",
        
        ph_site: "例如: 第三工厂 2号线",
        ph_product: "例如: OLED 绿光主体",
        ph_qty: "例如: 500g (Lab) / 100kg (Mass)",
        ph_manager: "负责人姓名",
        
        btn_save: "保存",
        btn_cancel: "取消",
        btn_delete: "删除",
        btn_edit: "编辑",
        
        msg_new: "新生产指令",
        msg_edit: "编辑生产指令",
        alert_req: "请填写产品名称、地点和负责人。",
        confirm_no_eq: "未选择反应釜。是否继续？",
        confirm_del: "确定要删除此生产计划吗？\n（无法恢复）"
    }
};

// --- Styles & Constants (Not Translated) ---
const TYPE_STYLES = {
  LAB: { color: 'bg-blue-50 border-blue-200 text-blue-700' },      // Lab Test (파랑)
  PILOT: { color: 'bg-amber-50 border-amber-200 text-amber-700' }, // Pilot (주황)
  MASS: { color: 'bg-purple-50 border-purple-200 text-purple-700' }, // Mass (보라)
};

const STATUS_STYLES = {
  PLANNED: { dotColor: 'bg-slate-400' },
  IN_PROGRESS: { dotColor: 'bg-blue-500 animate-pulse' },
  QC_PENDING: { dotColor: 'bg-rose-500' },
  COMPLETED: { dotColor: 'bg-emerald-500' },
};

const REACTOR_OPTIONS = ['10L', '50L', '200L', '500L', '1000L', '3000L']; // Lab용 작은 사이즈 추가

export const ProductionCalendarTab = ({ events = [], onUpdateEvents, projectId, projectName, lang = 'ko' }) => {
  const t = (key) => TRANSLATIONS[lang][key] || key;

  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    batchNo: '',
    type: 'LAB', // 기본값 변경 (TOLL -> LAB)
    status: 'PLANNED',
    manager: '',
    site: '',
    equipment: [],
    quantity: '',
  });

  const generateBatchNo = (date) => {
    const yymmdd = moment(date).format('YYMMDD');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `B${yymmdd}-${random}`;
  };

  const handleSelectSlot = ({ start, end }) => {
    setEditingEventId(null);
    setSelectedSlot({ start, end });
    
    setFormData({
      title: projectName || '',
      batchNo: generateBatchNo(start),
      type: 'LAB', // 기본값 변경
      status: 'PLANNED',
      manager: '',
      site: '',
      equipment: [],
      quantity: '',
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setEditingEventId(event.id);
    setSelectedSlot({ start: event.start, end: event.end });
    
    setFormData({
      title: event.title,
      batchNo: event.batchNo,
      type: event.type,
      status: event.status,
      manager: event.manager,
      site: event.site || '',
      equipment: Array.isArray(event.equipment) ? event.equipment : [],
      quantity: event.quantity,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.manager || !formData.site) {
      alert(t('alert_req'));
      return;
    }

    if (formData.equipment.length === 0) {
        if(!window.confirm(t('confirm_no_eq'))) return;
    }

    let updatedEvents;

    if (editingEventId) {
        updatedEvents = events.map(ev => 
            ev.id === editingEventId 
            ? { ...ev, ...formData, projectId } 
            : ev
        );
    } else {
        const newEvent = {
            id: Date.now(),
            projectId,
            ...formData,
            start: selectedSlot.start,
            end: selectedSlot.end,
        };
        updatedEvents = [...events, newEvent];
    }

    onUpdateEvents(updatedEvents);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingEventId) return;
    if (window.confirm(t('confirm_del'))) {
        const updatedEvents = events.filter(e => e.id !== editingEventId);
        onUpdateEvents(updatedEvents);
        setIsModalOpen(false);
    }
  };

  const toggleEquipment = (eq) => {
    setFormData(prev => {
        const current = prev.equipment || [];
        if (current.includes(eq)) {
            return { ...prev, equipment: current.filter(item => item !== eq) };
        } else {
            return { ...prev, equipment: [...current, eq] };
        }
    });
  };

  // Event Styling
  const eventPropGetter = (event) => {
    const typeStyle = TYPE_STYLES[event.type] || TYPE_STYLES.LAB;
    
    // 기본 스타일 추출
    const classes = typeStyle.color.split(' ');
    // Tailwind 클래스에서 색상 코드 추출은 복잡하므로 여기서는 단순화된 하드코딩 색상을 사용하거나
    // 실제로는 CSS 클래스를 반환하는 className prop을 사용하는 것이 좋으나,
    // react-big-calendar의 eventPropGetter는 style 객체를 반환해야 색상이 확실히 적용됨.
    
    let bgColor = '#eff6ff'; // Lab (Blue)
    let borderColor = '#bfdbfe';
    let textColor = '#1e40af';
    let leftBorderColor = '#2563eb';

    if (event.type === 'PILOT') {
      bgColor = '#fffbeb'; // Pilot (Amber)
      borderColor = '#fde68a';
      textColor = '#92400e'; 
      leftBorderColor = '#d97706';
    } else if (event.type === 'MASS') {
      bgColor = '#faf5ff'; // Mass (Purple)
      borderColor = '#e9d5ff'; 
      textColor = '#6b21a8';
      leftBorderColor = '#9333ea';
    }

    return {
      style: {
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${leftBorderColor}`,
        borderRadius: '4px',
        fontSize: '0.85rem',
      },
    };
  };

  const CustomEvent = ({ event }) => {
    const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.PLANNED;
    const statusLabel = t(`status_${event.status}`);
    const equipmentStr = Array.isArray(event.equipment) ? event.equipment.join(', ') : event.equipment;

    return (
        <div className="flex flex-col h-full justify-center px-1.5 overflow-hidden leading-tight group">
        <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-mono opacity-80 font-bold tracking-tight">{event.batchNo}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotColor}`} title={statusLabel} />
        </div>
        <div className="font-bold text-xs truncate mb-0.5">{event.title}</div>
        <div className="text-[10px] opacity-70 truncate flex flex-col gap-0.5">
            <div className="flex gap-1 items-center">
                <span className="font-medium">{event.site || 'Unknown'}</span>
                <span className="opacity-50">|</span>
                <span>{event.manager}</span>
            </div>
            {equipmentStr && (
                <div className="text-[9px] bg-white/50 rounded px-1 w-fit mt-0.5">
                🏗️ {equipmentStr}
                </div>
            )}
        </div>
        </div>
    );
  };

  const components = useMemo(() => ({
    event: CustomEvent
  }), [lang]);

  return (
    <div className="flex h-full bg-slate-50 flex-col p-6 space-y-4">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-lg text-white shadow-md">
            <Icon name="calendar" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {projectName ? `${projectName}` : ''} {t('header_sched')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t('header_sub')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.keys(TYPE_STYLES).map((code) => {
             const style = TYPE_STYLES[code];
             return (
                <div key={code} className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white border-slate-100 shadow-sm">
                <div className={`w-3 h-3 rounded-full ${style.color.replace('text', 'bg').split(' ')[0].replace('50', '500')}`}></div>
                <span className="text-xs font-bold text-slate-600">{t(`type_${code}`)}</span>
                </div>
             );
          })}
        </div>
      </div>

      {/* 2. Calendar Area */}
      <div className="flex-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <style>{`
          .rbc-calendar { font-family: 'Inter', system-ui, sans-serif; }
          .rbc-toolbar { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 0 !important; }
          .rbc-toolbar-label { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
          .rbc-btn-group button { border: 1px solid #e2e8f0; color: #64748b; font-size: 0.85rem; padding: 6px 12px; }
          .rbc-btn-group button.rbc-active { background-color: #0f172a; color: white; border-color: #0f172a; }
          .rbc-header { padding: 12px 0; font-weight: 600; font-size: 0.8rem; color: #64748b; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; }
          .rbc-month-view { border: none; }
          .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9; }
          .rbc-off-range-bg { background-color: #f8fafc; }
          .rbc-today { background-color: #fffbeb; }
          .rbc-event { padding: 2px 4px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        `}</style>

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          components={components}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
        />
      </div>

      {/* 3. Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                    {editingEventId ? t('msg_edit') : t('msg_new')}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {moment(selectedSlot.start).format('YYYY-MM-DD')} ~ {moment(selectedSlot.end).format('YYYY-MM-DD')}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                <Icon name="x" size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('lbl_type')}</label>
                        <div className="grid grid-cols-3 gap-2">
                        {Object.keys(TYPE_STYLES).map((key) => {
                            const style = TYPE_STYLES[key];
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setFormData({ ...formData, type: key });
                                    }}
                                    className={`text-xs py-2.5 px-2 rounded-lg border font-bold transition flex flex-col items-center justify-center gap-1 ${
                                        formData.type === key
                                        ? `ring-2 ring-offset-1 ring-slate-400 ${style.color}`
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {/* 번역된 텍스트만 표시 */}
                                    <span>{t(`type_${key}`)}</span>
                                </button>
                            );
                        })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">{t('lbl_batch')} <span className="text-slate-400 font-normal">(Editable)</span></label>
                        <input
                            type="text"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition"
                            value={formData.batchNo}
                            onChange={(e) => setFormData({...formData, batchNo: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">{t('lbl_status')}</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            {Object.keys(STATUS_STYLES).map((k) => (
                                <option key={k} value={k}>{t(`status_${k}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">{t('lbl_site')}</label>
                        <div className="relative">
                            <Icon name="map-pin" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-slate-300"
                                placeholder={t('ph_site')}
                                value={formData.site}
                                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">{t('lbl_product')}</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder={t('ph_product')}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('lbl_reactor')}</label>
                        <div className="grid grid-cols-6 gap-2">
                            {REACTOR_OPTIONS.map((opt) => {
                                const isSelected = formData.equipment.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleEquipment(opt);
                                        }}
                                        className={`text-xs py-2 rounded-md font-bold transition border ${
                                            isSelected 
                                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">{t('lbl_qty')}</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"
                            placeholder={t('ph_qty')}
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">{t('lbl_manager')}</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"
                            placeholder={t('ph_manager')}
                            value={formData.manager}
                            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <div>
                    {editingEventId && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-rose-600 font-bold text-sm hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100 flex items-center gap-2"
                        >
                            <Icon name="trash-2" size={16} /> {t('btn_delete')}
                        </button>
                    )}
                </div>
                
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2 text-slate-600 font-bold text-sm hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition"
                    >
                        {t('btn_cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 bg-slate-900 text-white font-bold text-sm hover:bg-black rounded-lg shadow-lg shadow-slate-200 transition flex items-center gap-2"
                    >
                        <Icon name="check" size={16} /> {t('btn_save')}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};