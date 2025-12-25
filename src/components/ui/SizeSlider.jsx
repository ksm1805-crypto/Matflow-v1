import React from 'react';
import { Icon } from './Icon';

export const SizeSlider = ({ value, onChange, min=80, max=400 }) => (
    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200" title="Adjust Card Size" onClick={e=>e.stopPropagation()}>
        <Icon name="maximize-2" size={12} className="text-slate-400"/>
        <input type="range" min={min} max={max} value={value} onChange={e=>onChange(e.target.value)} className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"/>
    </div>
);