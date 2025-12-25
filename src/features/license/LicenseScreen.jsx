import React, { useState } from 'react';
import { api } from '../../services/api';
import { Icon } from '../../components/ui/Icon';

export const LicenseScreen = ({ onActivate }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');

    const handleActivate = async () => {
        const res = await api.license.activate(key); // 여기서 날짜가 저장됨
        if (res.success) {
            onActivate();
        } else {
            setError('Invalid License Key');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center border border-slate-200">
                <div className="flex justify-center mb-6">
                    <div className="bg-brand-100 p-4 rounded-full text-brand-600">
                        <Icon name="key" size={32}/>
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Product Activation</h2>
                <p className="text-sm text-slate-500 mb-6">Enter your product key to activate your 1-year license.</p>
                
                <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center font-mono font-bold text-slate-700 outline-none focus:border-brand-500 mb-4 transition"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={key}
                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                />
                
                {error && <div className="text-xs text-rose-500 font-bold mb-4 flex items-center justify-center gap-1"><Icon name="alert-circle" size={12}/> {error}</div>}
                
                <button 
                    onClick={handleActivate}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition shadow-md shadow-brand-200"
                >
                    Activate License
                </button>
                <div className="mt-4 text-[10px] text-slate-400">
                    License valid for 365 days from activation.
                </div>
            </div>
        </div>
    );
};