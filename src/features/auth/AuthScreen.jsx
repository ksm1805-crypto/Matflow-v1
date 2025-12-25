import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { generateId } from '../../utils/math';
import { USERS_DB_KEY } from '../../services/api'; // api.js에서 키 가져오거나 상수화

export const AuthScreen = ({ onLogin, users, setUsers }) => {
    const [mode, setMode] = useState('LOGIN'); 
    const [formData, setFormData] = useState({ username: '', password: '', name: '', roleId: 'GUEST' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg('');
        if (mode === 'LOGIN') {
            const user = users.find(u => u.username === formData.username && u.password === formData.password);
            if (!user) return setError('Invalid credentials');
            if (user.status === 'PENDING') return setError('Account pending approval.');
            onLogin(user);
        } else {
            if (!formData.username || !formData.password || !formData.name) return setError('All fields required');
            if (users.some(u => u.username === formData.username)) return setError('Username exists');
            const newUser = { ...formData, id: generateId(), status: 'PENDING', managerRole: 'NONE' };
            const updatedUsers = [...users, newUser];
            setUsers(updatedUsers);
            localStorage.setItem('oled_matflow_users_v1', JSON.stringify(updatedUsers));
            setSuccessMsg('Registration successful!');
            setTimeout(() => setMode('LOGIN'), 1500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-slate-200 shadow-2xl relative z-10 animate-in">
                <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 mb-4 border border-brand-100"><Icon name="fingerprint" size={32} className="text-brand-600"/></div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">OLED Matflow</h1><p className="text-slate-500 text-sm mt-2">v1.0 System</p></div>
                {successMsg ? <div className="text-emerald-600 text-center p-4 bg-emerald-50 rounded border border-emerald-100 mb-4">{successMsg}</div> : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition" value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label><input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/></div>
                        {mode === 'SIGNUP' && (<><div className="animate-in"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-brand-500 transition" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div><div className="animate-in"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role Request</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setFormData({...formData, roleId: 'GUEST'})} className={`p-2 rounded border text-sm font-bold ${formData.roleId==='GUEST'?'bg-brand-600 border-brand-500 text-white':'bg-white border-slate-200 text-slate-500'}`}>Guest</button><button type="button" onClick={()=>setFormData({...formData, roleId: 'RESEARCHER'})} className={`p-2 rounded border text-sm font-bold ${formData.roleId==='RESEARCHER'?'bg-brand-600 border-brand-500 text-white':'bg-white border-slate-200 text-slate-500'}`}>Researcher</button></div></div></>)}
                        {error && <div className="text-rose-500 text-sm text-center bg-rose-50 p-2 rounded border border-rose-100">{error}</div>}
                        <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition shadow-md">{mode === 'LOGIN' ? 'Sign In' : 'Submit Registration'}</button>
                    </form>
                )}
                <div className="mt-6 pt-6 border-t border-slate-100 text-center"><button onClick={()=>{setMode(mode==='LOGIN'?'SIGNUP':'LOGIN'); setError(''); setSuccessMsg('')}} className="text-sm text-brand-600 hover:text-brand-700 font-bold">{mode === 'LOGIN' ? 'Create an Account' : 'Back to Login'}</button></div>
            </div>
        </div>
    );
};