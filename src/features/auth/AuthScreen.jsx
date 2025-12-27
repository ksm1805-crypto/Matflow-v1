import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';

export const AuthScreen = ({ onLogin, users }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 로딩 효과
        setTimeout(() => {
            // [수정] 아이디/비번만 확인하고 isActive 여부는 무시합니다.
            const user = users.find(u => 
                u.username.toLowerCase() === username.toLowerCase() && 
                u.password === password
            );

            if (user) {
                // 계정 상태(isActive) 체크 로직 제거 -> 바로 로그인 성공 처리
                onLogin(user);
            } else {
                setError('Invalid username or password.');
            }
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md p-8 shadow-2xl border-t-4 border-t-brand-600">
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <Icon name="layers" size={32} className="text-brand-600"/>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">OLED <span className="text-brand-600">Matflow</span></h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Material Data Management System</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Username</label>
                        <div className="relative">
                            <Icon name="user" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                                placeholder="Enter your ID"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Icon name="lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-500 text-xs font-bold p-3 rounded-lg flex items-center gap-2 animate-pulse">
                            <Icon name="alert-circle" size={16}/> {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Icon name="loader" className="animate-spin"/> : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">
                        Default Admin: <strong className="text-slate-600">admin / admin123</strong>
                    </p>
                </div>
            </Card>
        </div>
    );
};