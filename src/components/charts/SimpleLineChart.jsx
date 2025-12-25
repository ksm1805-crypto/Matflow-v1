import React from 'react';
import { Icon } from '../ui/Icon';

export const SimpleLineChart = ({ data, dataKey, color, label, height = 150, formatVal = (v)=>v }) => {
    if (!data || data.length < 2) return <div className="flex flex-col h-full bg-slate-50 rounded-lg border border-slate-200 p-4 items-center justify-center text-slate-400"><Icon name="bar-chart-2" size={24} className="mb-2 opacity-50"/><span className="text-xs">Need 2+ Lots</span></div>;
    const values = data.map(d => parseFloat(d[dataKey]) || 0);
    const min = Math.min(...values) * 0.98;
    const max = Math.max(...values) * 1.02;
    const range = max - min || 1;
    const getCoord = (v, i) => [ (i / (values.length - 1)) * 100, 100 - ((v - min) / range) * 80 - 10 ];
    const points = values.map((v, i) => getCoord(v, i));
    const dPath = points.map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ');
    
    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 p-4 relative overflow-hidden group hover:border-slate-300 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-2 z-10 relative">
                <div><h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</h5><div className="text-lg font-bold text-slate-800 mt-0.5">{formatVal(values[values.length-1])}</div></div>
                <div className={`text-xs px-1.5 py-0.5 rounded font-bold ${values[values.length-1]>=values[values.length-2]?'text-emerald-600 bg-emerald-100':'text-rose-600 bg-rose-100'}`}>{values.length>1&&(values[values.length-1]>=values[values.length-2]?'▲':'▼')}</div>
            </div>
            <div className="flex-1 relative w-full min-h-[60px]">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d={dPath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    {values.map((v, i) => { const [x, y] = getCoord(v, i); return (<g key={i} className="group/point"><circle cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="2" className="opacity-0 group-hover/point:opacity-100 transition-opacity cursor-pointer" /><title>{data[i].name}: {formatVal(v)}</title></g>); })}
                </svg>
            </div>
        </div>
    );
};