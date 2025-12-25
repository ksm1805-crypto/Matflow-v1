import React from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { ROLES } from '../../constants';
import { api } from '../../services/api';

export const AdminUserPanel = ({ users, setUsers }) => {
    const updateUsers = (newUsers) => { setUsers(newUsers); api.users.saveAll(newUsers); };
    const approveUser = (id) => updateUsers(users.map(u => u.id === id ? { ...u, status: 'APPROVED' } : u));
    const rejectUser = (id) => updateUsers(users.filter(u => u.id !== id));
    const updateManagerRole = (id, role) => updateUsers(users.map(u => u.id === id ? { ...u, managerRole: role } : u));
    const pendingUsers = users.filter(u => u.status === 'PENDING');

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Icon name="shield" className="text-purple-600"/> Admin Control Panel</h2>
            <Card title={`New Account Requests (${pendingUsers.length})`} icon="users" color="text-brand-600">
                {pendingUsers.length === 0 ? <p className="text-slate-400 text-sm italic">No pending signups.</p> : (
                    <table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-500 text-xs uppercase"><tr><th className="p-3">Name</th><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{pendingUsers.map(u => (<tr key={u.id} className="border-b border-slate-100"><td className="p-3 font-bold text-slate-800">{u.name}</td><td className="p-3 text-slate-500">{u.username}</td><td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-brand-600">{ROLES[u.roleId]?.name}</span></td><td className="p-3 text-right flex justify-end gap-2"><button onClick={()=>approveUser(u.id)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded font-bold">Approve</button><button onClick={()=>rejectUser(u.id)} className="px-3 py-1 bg-rose-600 text-white text-xs rounded font-bold">Reject</button></td></tr>))}</tbody></table>
                )}
            </Card>
            <Card title="All Users" icon="users" color="text-slate-500">
                <table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-500 text-xs uppercase"><tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Mgr Role (Edit)</th><th className="p-3 text-right">Delete</th></tr></thead><tbody>{users.filter(u=>u.status==='APPROVED').map(u => (<tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 text-slate-800 font-medium">{u.name}</td><td className="p-3 text-slate-500">{ROLES[u.roleId]?.name}</td><td className="p-3"><select className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 outline-none" value={u.managerRole} onChange={(e) => updateManagerRole(u.id, e.target.value)}><option value="NONE">None</option><option value="SYN_MANAGER">Synthesis Manager</option><option value="ANA_MANAGER">Analysis Manager</option></select></td><td className="p-3 text-right">{u.roleId !== 'ADMIN' && <button onClick={()=>rejectUser(u.id)} className="text-rose-500 hover:text-rose-700"><Icon name="trash-2" size={14}/></button>}</td></tr>))}</tbody></table>
            </Card>
        </div>
    );
};