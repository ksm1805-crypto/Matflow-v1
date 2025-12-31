import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Icon } from '../../components/ui/Icon';

const localizer = momentLocalizer(moment);

const PROD_TYPES = {
  TOLL: { code: 'TOLL', label: 'Toll Mfg (임가공)', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  PILOT: { code: 'PILOT', label: 'Pilot / R&D (시양산)', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  CONSIGNMENT: { code: 'CSGN', label: 'Consignment (사급)', color: 'bg-purple-50 border-purple-200 text-purple-700' },
};

const PROD_STATUS = {
  PLANNED: { label: 'Planned', dotColor: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', dotColor: 'bg-blue-500 animate-pulse' },
  QC_PENDING: { label: 'QC Pending', dotColor: 'bg-rose-500' },
  COMPLETED: { label: 'Released', dotColor: 'bg-emerald-500' },
};

const REACTOR_OPTIONS = ['200L', '500L', '1000L', '2000L', '3000L'];

const CustomEvent = ({ event }) => {
  const statusInfo = PROD_STATUS[event.status] || PROD_STATUS.PLANNED;
  const equipmentStr = Array.isArray(event.equipment) 
    ? event.equipment.join(', ') 
    : event.equipment;

  return (
    <div className="flex flex-col h-full justify-center px-1.5 overflow-hidden leading-tight group">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-mono opacity-80 font-bold tracking-tight">{event.batchNo}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} title={statusInfo.label} />
      </div>
      <div className="font-bold text-xs truncate mb-0.5">{event.title}</div>
      <div className="text-[10px] opacity-70 truncate flex flex-col gap-0.5">
        <div className="flex gap-1 items-center">
            <span className="font-medium">{event.site || 'Unknown Site'}</span>
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

export const ProductionCalendarTab = ({ events = [], onUpdateEvents, projectId, projectName }) => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    batchNo: '',
    type: 'TOLL',
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
      title: projectName || '', // [변경] 새 일정 생성 시 프로젝트 이름 기본 입력
      batchNo: generateBatchNo(start),
      type: 'TOLL',
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
      alert('필수 정보(품목명, 외주 Site, 담당자)를 모두 입력해주세요.');
      return;
    }

    if (formData.equipment.length === 0) {
        if(!window.confirm("선택된 반응기(설비)가 없습니다. 계속하시겠습니까?")) return;
    }

    let updatedEvents;

    if (editingEventId) {
        updatedEvents = events.map(ev => 
            ev.id === editingEventId 
            ? { ...ev, ...formData, projectId } // [변경] 수정 시에도 projectId 유지/갱신
            : ev
        );
    } else {
        const newEvent = {
            id: Date.now(),
            projectId, // [변경] 새 이벤트에 projectId 할당
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
    if (window.confirm("정말 이 생산 일정을 삭제하시겠습니까?\n(복구할 수 없습니다)")) {
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

  const eventPropGetter = (event) => {
    const typeStyle = PROD_TYPES[event.type] || PROD_TYPES.TOLL;
    
    // 기본값 (TOLL / Default)
    let bgColor = '#eff6ff'; // blue-50
    let borderColor = '#bfdbfe'; // blue-200
    let textColor = '#1e40af'; // blue-800
    let leftBorderColor = '#2563eb'; // blue-600

    if (event.type === 'PILOT') {
      bgColor = '#fffbeb'; // amber-50
      borderColor = '#fde68a'; // amber-200
      textColor = '#92400e'; // amber-800
      leftBorderColor = '#d97706'; // amber-600
    } else if (event.type === 'CONSIGNMENT') {
      bgColor = '#faf5ff'; // purple-50
      borderColor = '#e9d5ff'; // purple-200
      textColor = '#6b21a8'; // purple-800
      leftBorderColor = '#9333ea'; // purple-600
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

  return (
    <div className="flex h-full bg-slate-50 flex-col p-6 space-y-4">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-lg text-white shadow-md">
            <Icon name="calendar" size={24} />
          </div>
          <div>
            {/* [변경] 헤더 타이틀에 프로젝트 이름 반영 */}
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {projectName ? `${projectName} Schedule` : 'Production Scheduler'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Integrated Manufacturing Execution Plan
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.values(PROD_TYPES).map((t) => (
            <div key={t.code} className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white border-slate-100 shadow-sm">
              <div className={`w-3 h-3 rounded-full ${t.color.replace('text', 'bg').split(' ')[0].replace('50', '500')}`}></div>
              <span className="text-xs font-bold text-slate-600">{t.label.split('(')[0]}</span>
            </div>
          ))}
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
          components={{ event: CustomEvent }}
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
                    {editingEventId ? 'Edit Production Order' : 'New Production Order'}
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
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Production Type</label>
                        <div className="grid grid-cols-3 gap-2">
                        {Object.entries(PROD_TYPES).map(([key, val]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setFormData({ ...formData, type: key });
                                }}
                                className={`text-xs py-2.5 px-2 rounded-lg border font-bold transition flex flex-col items-center justify-center gap-1 ${
                                    formData.type === key
                                    ? `ring-2 ring-offset-1 ring-slate-400 ${val.color}`
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <span>{val.label.split(' (')[0]}</span>
                                <span className="text-[10px] opacity-70">({val.label.split('(')[1]}</span>
                            </button>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Batch No. <span className="text-slate-400 font-normal">(Editable)</span></label>
                        <input
                            type="text"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition"
                            value={formData.batchNo}
                            onChange={(e) => setFormData({...formData, batchNo: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            {Object.entries(PROD_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Outsourcing Site / Manufacturer</label>
                        <div className="relative">
                            <Icon name="map-pin" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-slate-300"
                                placeholder="e.g. Fine Chemical Co., Ltd (Factory 2)"
                                value={formData.site}
                                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Product Name</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="e.g. OLED-Blue-Material Synthesis (Step 2)"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Reactors</label>
                        <div className="grid grid-cols-5 gap-2">
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Target Quantity</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"
                            placeholder="e.g. 500kg"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Person in Charge</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-500"
                            placeholder="Manager Name"
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
                            <Icon name="trash-2" size={16} /> Delete
                        </button>
                    )}
                </div>
                
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2 text-slate-600 font-bold text-sm hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 bg-slate-900 text-white font-bold text-sm hover:bg-black rounded-lg shadow-lg shadow-slate-200 transition flex items-center gap-2"
                    >
                        <Icon name="check" size={16} /> Save Changes
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};