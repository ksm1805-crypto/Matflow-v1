import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { ExcelGrid } from '../../components/ui/ExcelGrid'; 
import { KetcherModal } from '../../components/ui/KetcherModal'; 

export const MasterStockTab = ({ globalInventory = [], updateGlobalInventory, materials, readOnly }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isKetcherOpen, setIsKetcherOpen] = useState(false);
    const [targetItemId, setTargetItemId] = useState(null);

    // 새 아이템 추가
    const addNewItem = () => {
        if (readOnly) return;
        const newItem = {
            id: Date.now(),
            name: 'New Material',
            casNo: '',
            purity: '',       
            unit: 'g',        
            currentStock: 0,  
            location: '',     
            maker: '',
            description: '',
            structureSmiles: '',
            structureMol: '',
            structureSvg: '',
            hasStructure: false
        };
        updateGlobalInventory([...globalInventory, newItem]);
    };

    const updateItem = (id, key, value) => {
        if (readOnly) return;
        const updated = globalInventory.map(item => 
            item.id === id ? { ...item, [key]: value } : item
        );
        updateGlobalInventory(updated);
    };

    const deleteItem = (id) => {
        if (readOnly) return;
        if (window.confirm('Delete this item?')) {
            updateGlobalInventory(globalInventory.filter(item => item.id !== id));
        }
    };

    const openStructureEditor = (id) => {
        if (readOnly) return;
        setTargetItemId(id);
        setIsKetcherOpen(true);
    };

    // 구조 저장 및 자동 정보 입력 핸들러
    const handleStructureSave = (smiles, molfile, svg, identifiedInfo) => {
        if (!targetItemId) return;

        const updated = globalInventory.map(item => {
            if (item.id === targetItemId) {
                const newItem = {
                    ...item,
                    structureSmiles: smiles,
                    structureMol: molfile,
                    structureSvg: svg,
                    hasStructure: !!smiles
                };

                // PubChem 정보 자동 입력
                if (identifiedInfo) {
                    if (!item.name || item.name === 'New Material') newItem.name = identifiedInfo.name;
                    if (!item.casNo && identifiedInfo.casNo) newItem.casNo = identifiedInfo.casNo;
                    if (!item.description) newItem.description = identifiedInfo.description;
                }
                return newItem;
            }
            return item;
        });

        updateGlobalInventory(updated);
        setIsKetcherOpen(false);
    };

    const currentStructure = globalInventory.find(item => item.id === targetItemId)?.structureSmiles || '';

    const filteredInventory = globalInventory.filter(item => {
        const name = item.name || '';
        const cas = item.casNo || '';
        const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || cas.includes(searchTerm);
        return matchSearch;
    });

    return (
        <div className="flex h-full bg-slate-50 flex-col p-6 space-y-4">
            {/* Header Control */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-50 p-2 rounded-lg text-brand-600"><Icon name="database" size={24}/></div>
                    <div><h2 className="text-lg font-bold text-slate-800">Master Stock List</h2><p className="text-xs text-slate-500 font-medium">Global Inventory Management</p></div>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 w-64 transition" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    {!readOnly && <button onClick={addNewItem} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition"><Icon name="plus" size={16}/> Add Item</button>}
                </div>
            </div>

            {/* Grid Table */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 w-24 text-center">Structure</th>
                                <th className="p-3 w-12 text-center">No.</th>
                                <th className="p-3">Material Name</th>
                                <th className="p-3 w-32">CAS No.</th>
                                <th className="p-3 w-20">Purity</th>
                                {/* [수정] 너비를 w-24에서 w-36으로 확장 */}
                                <th className="p-3 w-36">Total Stock</th>
                                <th className="p-3 w-24">Maker</th>
                                <th className="p-3 w-24">Location</th>
                                <th className="p-3">Note</th>
                                {!readOnly && <th className="p-3 w-10 text-center"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInventory.length > 0 ? (
                                filteredInventory.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                                        {/* Structure Thumbnail */}
                                        <td className="p-2 align-middle">
                                            <div 
                                                onClick={() => openStructureEditor(item.id)}
                                                className={`
                                                    w-20 h-16 mx-auto rounded-lg border flex items-center justify-center cursor-pointer overflow-hidden bg-white relative
                                                    ${item.hasStructure ? 'border-brand-200 shadow-sm' : 'border-slate-200 border-dashed hover:border-slate-400'}
                                                `}
                                                title={item.hasStructure ? "Edit Structure" : "Add Structure"}
                                            >
                                                {item.structureSvg ? (
                                                    <div 
                                                        className="w-full h-full p-1 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                                                        dangerouslySetInnerHTML={{ __html: item.structureSvg }}
                                                    />
                                                ) : (
                                                    <Icon name="hexagon" size={20} className={item.hasStructure ? "text-brand-500" : "text-slate-300"}/>
                                                )}
                                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition pointer-events-none">
                                                    <Icon name="edit-2" size={16} className="text-slate-700"/>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>

                                        {/* Name */}
                                        <td className="p-3">
                                            <input disabled={readOnly} className="w-full bg-transparent font-bold text-slate-700 outline-none focus:text-brand-600 focus:border-b focus:border-brand-500 transition px-1 py-0.5" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Material Name"/>
                                        </td>

                                        {/* CAS No */}
                                        <td className="p-3">
                                            <input disabled={readOnly} className="w-full bg-transparent font-mono text-xs text-slate-500 outline-none focus:text-slate-700 focus:border-b focus:border-brand-500 transition px-1 py-0.5" value={item.casNo} onChange={e => updateItem(item.id, 'casNo', e.target.value)} placeholder="00-00-0"/>
                                        </td>

                                        {/* Purity */}
                                        <td className="p-3">
                                            <div className="flex items-center gap-1">
                                                <input disabled={readOnly} className="w-full bg-transparent text-right outline-none font-bold text-slate-600" value={item.purity} onChange={e => updateItem(item.id, 'purity', e.target.value)} placeholder="99.9"/>
                                                <span className="text-slate-400">%</span>
                                            </div>
                                        </td>

                                        {/* Total Stock (칸 넓힘) */}
                                        <td className="p-3">
                                            <div className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1 border border-slate-200 w-full">
                                                <input disabled={readOnly} type="number" className="w-full bg-transparent text-right outline-none font-bold text-slate-700" value={item.currentStock} onChange={e => updateItem(item.id, 'currentStock', e.target.value)} placeholder="0"/>
                                                <input disabled={readOnly} className="w-10 bg-transparent text-xs text-center text-slate-500 outline-none font-bold" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} placeholder="g"/>
                                            </div>
                                        </td>

                                        {/* Maker */}
                                        <td className="p-3">
                                            <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-600 focus:border-b focus:border-brand-500 px-1" value={item.maker} onChange={e => updateItem(item.id, 'maker', e.target.value)} placeholder="-"/>
                                        </td>

                                        {/* Location */}
                                        <td className="p-3">
                                            <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-600 focus:border-b focus:border-brand-500 px-1" value={item.location} onChange={e => updateItem(item.id, 'location', e.target.value)} placeholder="-"/>
                                        </td>

                                        {/* Note */}
                                        <td className="p-3">
                                            <input disabled={readOnly} className="w-full bg-transparent outline-none text-slate-500 focus:border-b focus:border-brand-500 px-1" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Memo"/>
                                        </td>

                                        {!readOnly && (
                                            <td className="p-3 text-center">
                                                <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-rose-500 transition"><Icon name="trash-2" size={14}/></button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={10} className="p-12 text-center text-slate-400">No items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
                    <div>Total Items: <span className="text-slate-800 font-bold">{globalInventory.length}</span></div>
                    <div>OLED Matflow Master Database</div>
                </div>
            </div>

            {isKetcherOpen && (
                <KetcherModal 
                    isOpen={isKetcherOpen} 
                    onClose={() => setIsKetcherOpen(false)} 
                    onSave={handleStructureSave}
                    initialSmiles={currentStructure}
                />
            )}
        </div>
    );
};