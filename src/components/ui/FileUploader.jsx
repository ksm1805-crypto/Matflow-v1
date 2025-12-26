import React from 'react';
import { Icon } from './Icon';
import { compressImage } from '../../utils/file';

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// [수정] h-full 제거 및 min-h 설정으로 변경
export const FileUploader = ({ files, setFiles, label, readOnly, hideList = false }) => (
    <div className={`mt-2 p-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col justify-center min-h-[80px] ${readOnly ? 'opacity-70' : 'hover:border-slate-400 hover:bg-slate-100'} transition`}>
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 flex gap-2 items-center">
                <Icon name="paperclip" size={12}/> {label}
            </span>
            {!readOnly && (
                <label className="cursor-pointer bg-white border border-slate-300 text-slate-600 text-xs px-2 py-1 rounded hover:bg-slate-50 shadow-sm">
                    Upload 
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        onChange={async (e) => { 
                            if(e.target.files[0]) {
                                const file = e.target.files[0];
                                let fileData;
                                try {
                                    if (file.type.startsWith('image/')) {
                                        fileData = await compressImage(file);
                                    } else {
                                        fileData = await fileToBase64(file);
                                    }
                                    setFiles([...files, {
                                        name: file.name, 
                                        data: fileData,
                                        type: file.type
                                    }]);
                                } catch (err) {
                                    console.error("File upload error:", err);
                                    alert("파일 업로드 실패");
                                }
                            }
                        }} 
                    />
                </label>
            )}
        </div>
        
        {!hideList && (
            <div className="flex flex-col gap-1 overflow-y-auto max-h-24 custom-scrollbar">
                {files.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-2 py-1.5 rounded text-xs shadow-sm">
                        <span className="text-blue-600 truncate">{f.name}</span>
                        {!readOnly && (
                            <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500">
                                <Icon name="trash-2" size={12}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
);