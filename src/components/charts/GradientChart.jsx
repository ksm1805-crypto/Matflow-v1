import React from 'react';
export const GradientChart = ({ gradient }) => {
    if (!gradient || gradient.length === 0) return <div>No Data</div>;
    const sorted = [...gradient].sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
    const maxTime = Math.max(...sorted.map(p => parseFloat(p.time) || 0), 10);
    const points = sorted.map(p => { const x = (parseFloat(p.time) / maxTime) * 100; const y = 100 - (parseFloat(p.b) || 0); return `${x},${y}`; }).join(' ');
    
    return (
        <div className="w-full h-64 bg-white border border-slate-200 rounded-xl relative p-6 pt-2 pb-8">
             <div className="w-full h-full relative border-l border-b border-slate-300">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d={`M ${points}`} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    {/* ... (SVG 내용 HTML 참조) ... */}
                </svg>
             </div>
        </div>
    );
};