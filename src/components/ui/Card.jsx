// src/components/ui/Card.jsx
import React from 'react';
import { Icon } from './Icon';

export const Card = ({ children, className = "", title, icon, color = "text-slate-800", action }) => {
    return (
        <div className={`glass-panel p-5 rounded-xl relative group ${className}`}>
            {(title || action) && (
                <div className="flex justify-between items-center mb-4">
                    {title ? <h4 className={`text-sm font-bold flex items-center gap-2 ${color}`}><Icon name={icon} size={16}/> {title}</h4> : <div></div>}
                    <div className="mr-8">{action}</div> 
                </div>
            )}
            {children}
        </div>
    );
};