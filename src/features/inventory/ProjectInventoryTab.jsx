import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { generateId } from '../../utils/math';

export const ProjectInventoryTab = ({ material, updateMaterial, readOnly, globalInventory = [], updateGlobalInventory }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const projectInventory = Array.isArray(material.inventory) ? material.inventory : [];

    const addToProject = (masterItem) => {
        if (readOnly) return;
        if (projectInventory.find(i => i.masterId === masterItem.id)) {
            alert("Already added to this project.");
            return;
        }

        const newItem = {
            id: generateId(),
            masterId: masterItem.id,
            name: masterItem.name,
            casNo: masterItem.casNo || '',
            purity: masterItem.purity || '',
            unit: masterItem.unit || 'g',
            projectStock: 0, 
            location: '',
            note: ''
        };

        updateMaterial({ ...material, inventory: [...projectInventory, newItem] });
    };

    const updateProjectItem = (id, field, val) => {
        if (readOnly) return;
        const newInv = projectInventory.map(item => item.id === id ? { ...item, [field]: val } : item);
        updateMaterial({ ...material, inventory: newInv });
    };

    const removeFromProject = (id) => {
        if (readOnly) return;
        updateMaterial({ ...material, inventory: projectInventory.filter(item => item.id !== id) });
    };

    const filteredMaster = globalInventory.filter(item => 
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.casNo || '').includes(searchTerm) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full gap-6 p-6 bg-slate-50">
            {/* [Left Panel] Master Database Source */}
            <div className="w-1/2 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Icon name="database" size={16} className="text-slate-400"/> Master DB Source
                    </h3>
                    <div className="relative">
                        <Icon name="search" size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-brand-500 w-48 shadow-sm"
                            placeholder="Search Name or CAS..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="flex-1 p-0 overflow-hidden border border-slate-200 shadow-sm">
                    <div className="h-full overflow-y-auto custom-scrollbar bg-white">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 w-10 text-center"></th>
                                    <th className="px-3 py-2">Material / CAS No.</th>
                                    <th className="px-3 py-2 w-20">Purity</th>
                                    {/* [수정] 헤더 변경: Available (Total) */}
                                    <th className="px-3 py-2 w-24 text-right">Available <span className="text-[9px] normal-case opacity-70">(Total)</span></th>
                                    <th className="px-3 py-2 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMaster.map(item => {
                                    // [핵심 로직] 현재 프로젝트에서 사용 중인 수량 계산
                                    const projectItem = projectInventory.find(pi => pi.masterId === item.id);
                                    const isAdded = !!projectItem;
                                    const allocated = projectItem ? (parseFloat(projectItem.projectStock) || 0) : 0;
                                    
                                    // [핵심 로직] 마스터 재고 - 프로젝트 할당량 = 가용 재고
                                    const masterStock = parseFloat(item.currentStock) || 0;
                                    const availableStock = masterStock - allocated;
                                    const isShortage = availableStock < 0;

                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition ${isAdded ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-3 py-2 text-center">
                                                <div className={`w-1.5 h-1.5 rounded-full mx-auto ${availableStock < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-slate-700">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{item.casNo || '-'}</div>
                                            </td>
                                            <td className="px-3 py-2 text-slate-600">{item.purity}%</td>
                                            
                                            {/* [수정] 재고 표시: 가용재고 (전체재고) */}
                                            <td className="px-3 py-2 text-right">
                                                <div className={`font-bold ${isShortage ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                    {availableStock.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">/ {masterStock}</span>
                                                </div>
                                                <div className="text-[9px] text-slate-400">{item.unit}</div>
                                            </td>

                                            <td className="px-3 py-2 text-center">
                                                {!readOnly && (
                                                    <button 
                                                        onClick={() => addToProject(item)} 
                                                        disabled={isAdded}
                                                        className={`p-1.5 rounded transition ${isAdded ? 'text-blue-300 cursor-default' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}
                                                    >
                                                        <Icon name={isAdded ? "check-circle" : "plus-circle"} size={16}/>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* [Right Panel] Project Inventory */}
            <div className="w-1/2 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Icon name="package" size={16} className="text-brand-600"/> Project Inventory
                    </h3>
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">{projectInventory.length} Items</span>
                </div>

                <Card className="flex-1 p-0 overflow-hidden border border-brand-100 shadow-sm ring-1 ring-brand-50">
                    <div className="h-full overflow-y-auto custom-scrollbar bg-white">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2">Material / CAS No.</th>
                                    <th className="px-3 py-2 w-24 text-center">Usage</th>
                                    <th className="px-3 py-2 w-20">Unit</th>
                                    <th className="px-3 py-2 w-24">Location</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projectInventory.length > 0 ? projectInventory.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{item.casNo || '-'}</div>
                                        </td>
                                        {/* [수정] Usage 입력 강조 */}
                                        <td className="px-3 py-2">
                                            <input 
                                                disabled={readOnly}
                                                type="number" 
                                                className="w-full bg-slate-50 border border-brand-200 rounded px-2 py-1 text-right font-bold text-brand-700 outline-none focus:border-brand-500 focus:bg-white transition"
                                                value={item.projectStock}
                                                onChange={(e) => updateProjectItem(item.id, 'projectStock', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                                        <td className="px-3 py-2">
                                            <input 
                                                disabled={readOnly}
                                                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 outline-none text-slate-600 focus:border-brand-500 text-center"
                                                placeholder="Loc"
                                                value={item.location}
                                                onChange={(e) => updateProjectItem(item.id, 'location', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {!readOnly && (
                                                <button 
                                                    onClick={() => removeFromProject(item.id)} 
                                                    className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                                                >
                                                    <Icon name="x" size={14}/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400 italic">
                                            Click <Icon name="plus-circle" size={12} className="inline"/> on the left to add materials.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};