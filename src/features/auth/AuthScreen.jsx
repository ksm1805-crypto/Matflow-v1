import React, { useState } from 'react';
import { api } from '../../services/api';
import { Icon } from '../../components/ui/Icon';

export const AuthScreen = ({ onLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true); // 로그인 <-> 가입 전환용
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // 가입할 때만 사용
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let user;
            if (isLoginMode) {
                // 로그인 시도
                user = await api.auth.login(email, password);
            } else {
                // 회원가입 시도
                if (!name.trim()) throw new Error("Please enter your name.");
                user = await api.auth.register(email, password, name);
            }
            onLogin(user); // 성공 시 메인 화면으로 이동
        } catch (err) {
            console.error(err);
            // 에러 메시지 처리
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already in use.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-brand-50 rounded-full">
                            <Icon name="layers" size={40} className="text-brand-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">OLED Matflow</h1>
                    <p className="text-slate-400 text-sm mt-2 font-bold">
                        {isLoginMode ? 'Sign In to Cloud' : 'Create New Account'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-bold text-center border border-rose-100">{error}</div>}
                    
                    {/* 이름 입력 (회원가입일 때만 표시) */}
                    {!isLoginMode && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email</label>
                        <input 
                            type="email" 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-lg font-bold shadow-lg shadow-brand-200 transition flex justify-center items-center gap-2"
                    >
                        {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
                
                <div className="mt-6 text-center border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400 mb-2">
                        {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    </p>
                    <button 
                        onClick={() => {
                            setIsLoginMode(!isLoginMode);
                            setError('');
                            setEmail('');
                            setPassword('');
                            setName('');
                        }}
                        className="text-brand-600 font-bold text-sm hover:underline"
                    >
                        {isLoginMode ? 'Create Account' : 'Back to Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};