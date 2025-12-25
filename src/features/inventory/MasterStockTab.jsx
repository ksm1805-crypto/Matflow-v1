import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { generateId } from '../../utils/math';

// [수정] materials prop 추가 (전체 프로젝트 사용량 계산용)
export const MasterStockTab = ({ globalInventory, updateGlobalInventory, materials = [], readOnly }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const updateItem = (id, field, val) => {
        if (readOnly) return;
        updateGlobalInventory(globalInventory.map(item => item.id === id ? { ...item, [field]: val, lastUpdated: new Date().toISOString().slice(0, 10) } : item));
    };

    const addItem = () => {
        if (readOnly) return;
        const newItem = {
            id: generateId(),
            name: '',
            casNo: '',
            category: 'Raw Material',
            purity: '',
            currentStock: 0,
            unit: 'g',
            location: '',
            lastUpdated: new Date().toISOString().slice(0, 10)
        };
        updateGlobalInventory([...globalInventory, newItem]);
    };

    const deleteItem = (id) => {
        if (readOnly) return;
        if (window.confirm('Delete this item?')) {
            updateGlobalInventory(globalInventory.filter(item => item.id !== id));
        }
    };

    const filteredItems = globalInventory.filter(item => 
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.casNo || '').includes(searchTerm) || 
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-slate-50 space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-500">
                        <Icon name="package" size={20}/>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Master Inventory</h2>
                        <p className="text-xs text-slate-500">Real-time stock monitoring across all projects.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            className="pl-8 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500 w-64 shadow-sm"
                            placeholder="Search by Name, CAS No..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {!readOnly && (
                        <button onClick={addItem} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition shadow-md">
                            <Icon name="plus" size={16}/> Add Item
                        </button>
                    )}
                </div>
            </div>

            {/* Inventory Table */}
            <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3 w-16 text-center">Status</th>
                                <th className="px-4 py-3 w-40">Material Name</th>
                                <th className="px-4 py-3 w-28">CAS No.</th>
                                <th className="px-4 py-3 w-28">Category</th>
                                <th className="px-4 py-3 w-20">Purity</th>
                                {/* [수정] 재고 컬럼 분리: 실제가용 / 총재고 */}
                                <th className="px-4 py-3 w-32 text-right">Available <span className="text-[9px] text-slate-400 normal-case">(Real)</span></th>
                                <th className="px-4 py-3 w-24 text-right">Total Stock</th>
                                <th className="px-4 py-3 w-20">Unit</th>
                                <th className="px-4 py-3 w-24">Location</th>
                                <th className="px-4 py-3 w-28">Last Updated</th>
                                <th className="px-4 py-3 w-16 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredItems.length > 0 ? filteredItems.map(item => {
                                // [핵심 로직] 전체 프로젝트를 뒤져서 이 재료(masterId)를 쓰고 있는 양을 합산
                                const totalAllocated = materials.reduce((acc, mat) => {
                                    const matInv = mat.inventory || [];
                                    const itemInProject = matInv.find(i => i.masterId === item.id);
                                    return acc + (itemInProject ? (parseFloat(itemInProject.projectStock) || 0) : 0);
                                }, 0);

                                const totalStock = parseFloat(item.currentStock) || 0;
                                const availableStock = totalStock - totalAllocated;
                                const isLow = availableStock < 10;
                                const isShortage = availableStock < 0; // 마이너스 재고 경고

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-4 py-3 text-center">
                                            <div className={`w-2 h-2 rounded-full mx-auto ${isShortage ? 'bg-rose-600 animate-pulse' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`} title={isShortage ? 'Stock Shortage!' : isLow ? 'Low Stock' : 'Sufficient'}></div>
                                        </td>
                                        
                                        <td className="px-4 py-3">
                                            <input disabled={readOnly} className="w-full bg-transparent outline-none font-bold text-slate-700 focus:text-brand-600 transition" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder="Name"/>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input disabled={readOnly} className="w-full bg-transparent outline-none font-mono text-slate-500 text-xs" value={item.casNo || ''} onChange={(e) => updateItem(item.id, 'casNo', e.target.value)} placeholder="-"/>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select disabled={readOnly} className="w-full bg-transparent outline-none text-slate-600 cursor-pointer text-xs" value={item.category} onChange={(e) => updateItem(item.id, 'category', e.target.value)}>
                                                <option value="Raw Material">Raw Material</option><option value="Reagent">Reagent</option><option value="Solvent">Solvent</option><option value="Catalyst">Catalyst</option><option value="Consumable">Consumable</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input disabled={readOnly} type="number" className="w-full bg-transparent outline-none text-slate-600 text-right" value={item.purity} onChange={(e) => updateItem(item.id, 'purity', e.target.value)} placeholder="-"/>
                                        </td>

                                        {/* [수정] Available Stock (자동 계산) */}
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {availableStock.toFixed(1)}
                                            </span>
                                            {totalAllocated > 0 && (
                                                <div className="text-[9px] text-slate-400">-{totalAllocated.toFixed(1)} used</div>
                                            )}
                                        </td>

                                        {/* Total Stock (입력 가능) */}
                                        <td className="px-4 py-3">
                                            <input 
                                                disabled={readOnly}
                                                type="number"
                                                className="w-full bg-transparent outline-none font-bold text-slate-800 text-right border-b border-transparent hover:border-slate-200 focus:border-brand-500 transition" 
                                                value={item.currentStock} 
                                                onChange={(e) => updateItem(item.id, 'currentStock', e.target.value)}
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <select disabled={readOnly} className="w-full bg-transparent outline-none text-slate-500 text-xs cursor-pointer" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)}>
                                                <option value="g">g</option><option value="kg">kg</option><option value="mg">mg</option><option value="L">L</option><option value="mL">mL</option><option value="ea">ea</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-500 text-xs" value={item.location} onChange={(e) => updateItem(item.id, 'location', e.target.value)} placeholder="-"/>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{item.lastUpdated}</td>
                                        <td className="px-4 py-3 text-center">
                                            {!readOnly && <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-rose-500 transition"><Icon name="trash-2" size={14}/></button>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="11" className="p-8 text-center text-slate-400 italic bg-slate-50/50">No items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};