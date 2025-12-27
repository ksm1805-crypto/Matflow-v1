import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { api } from '../../services/api';

export const LicenseScreen = ({ onActivate }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // [핵심] 입력 시 자동으로 포맷팅 (AAAA-BBBB-CCCC-DDDD)
    const handleInputChange = (e) => {
        // 1. 하이픈 제거하고 대문자로 변환 (순수 문자만 남김)
        let rawValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        
        // 2. 최대 길이 제한 (16자리)
        if (rawValue.length > 16) rawValue = rawValue.slice(0, 16);

        // 3. 4자리마다 하이픈 추가
        const formatted = rawValue.match(/.{1,4}/g)?.join('-') || rawValue;

        setLicenseKey(formatted);
        setError('');
    };

    const handleActivate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 하이픈이 있든 없든 검증 가능하도록 처리 (서버 로직에 따라 다름)
            const result = await api.license.verify(licenseKey);
            if (result.isValid) {
                onActivate();
            } else {
                setError(result.message || 'Invalid License Key');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-brand-600">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="key" size={32} className="text-brand-600"/>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Product Activation</h1>
                    <p className="text-sm text-slate-500">Please enter your license key to activate <br/><span className="font-bold text-slate-700">OLED Matflow v1.0</span></p>
                </div>

                <form onSubmit={handleActivate} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">License Key</label>
                        <div className="relative">
                            <Icon name="lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="text" 
                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${error ? 'border-rose-300 ring-rose-100' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'} rounded-xl text-center font-mono text-lg font-bold tracking-widest text-slate-700 outline-none focus:ring-4 transition placeholder:text-slate-300`}
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                value={licenseKey}
                                onChange={handleInputChange}
                                maxLength={19} // 하이픈 포함 19자리
                            />
                        </div>
                        {error && <p className="text-xs text-rose-500 font-bold mt-2 text-center flex items-center justify-center gap-1"><Icon name="alert-circle" size={12}/> {error}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || licenseKey.length < 19} // 키가 다 입력되어야 버튼 활성화
                        className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <><Icon name="loader" className="animate-spin"/> Verifying...</>
                        ) : (
                            <><Icon name="check-circle"/> Activate Now</>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400">
                        Need help? Contact support at <a href="mailto:support@oledmatflow.com" className="text-brand-600 hover:underline">support@oledmatflow.com</a>
                    </p>
                </div>
            </Card>
        </div>
    );
};