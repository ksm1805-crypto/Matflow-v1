import React from 'react';
import { Icon } from './Icon';
import { compressImage } from '../../utils/file';

export const FileUploader = ({ files, setFiles, label, readOnly }) => (
    <div className={`mt-2 p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 h-full flex flex-col justify-center ${readOnly ? 'opacity-70' : 'hover:border-slate-400 hover:bg-slate-100'} transition`}>
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 flex gap-2 items-center"><Icon name="paperclip" size={12}/> {label}</span>
            {!readOnly && <label className="cursor-pointer bg-white border border-slate-300 text-slate-600 text-xs px-2 py-1 rounded hover:bg-slate-50 shadow-sm">Upload <input type="file" className="hidden" onChange={async (e) => { if(e.target.files[0]) setFiles([...files, {name: e.target.files[0].name, data: await compressImage(e.target.files[0])}]); }} /></label>}
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-24 custom-scrollbar">
            {files.map((f, i) => (<div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-2 py-1.5 rounded text-xs shadow-sm"><span className="text-blue-600 truncate cursor-pointer hover:underline" onClick={()=>{const w=window.open(); w.document.write('<iframe src="'+f.data+'" frameborder="0" style="width:100%;height:100%"></iframe>')}}>{f.name}</span>{!readOnly && <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500"><Icon name="trash-2" size={12}/></button>}</div>))}
        </div>
    </div>
);