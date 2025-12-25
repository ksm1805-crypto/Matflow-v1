import React, { useState } from 'react';
import { Icon } from './Icon';
import { compressImage } from '../../utils/file'; // utils/file.js에 compressImage 구현 필요

export const ImageUploader = ({ value, onChange, label, readOnly }) => {
    const [showPreview, setShowPreview] = useState(false);
    const handleFile = async (e) => { if(!readOnly && e.target.files[0]) onChange(await compressImage(e.target.files[0])); };
    const handlePaste = async (e) => {
        if(readOnly) return;
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                onChange(await compressImage(blob));
                break;
            }
        }
    };
    return (
        <div className="flex flex-col gap-1 items-center w-full h-full">
            {value ? (
                <div className="relative group w-full h-full min-h-[80px]">
                    <img src={value} className="w-full h-full object-cover rounded-md border border-slate-200 cursor-zoom-in hover:border-brand-500 transition shadow-sm" onClick={() => setShowPreview(true)} />
                    {!readOnly && <button className="absolute -top-2 -right-2 bg-white text-rose-500 border border-rose-100 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 z-10 hover:scale-110 transition" onClick={(e) => {e.stopPropagation(); onChange(null);}}><Icon name="x" size={10} /></button>}
                    {showPreview && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-10 backdrop-blur-sm" onClick={()=>setShowPreview(false)}><img src={value} className="max-w-full max-h-full rounded-lg shadow-2xl border-4 border-white"/></div>}
                </div>
            ) : (
                <label className={`w-full h-full min-h-[80px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md transition text-slate-400 bg-slate-50 ${readOnly ? 'cursor-default opacity-50' : 'cursor-pointer hover:bg-white hover:border-brand-400 hover:text-brand-500 focus:border-brand-500 focus:bg-white focus:outline-none'}`} onPaste={handlePaste} tabIndex={readOnly ? -1 : 0}>
                    <Icon name="image-plus" size={18} /><span className="mt-1 text-[10px]">{label || (readOnly ? "No Image" : "Paste / Drop")}</span>
                    {!readOnly && <input type="file" accept="image/*" className="hidden" onChange={handleFile} />}
                </label>
            )}
        </div>
    );
};