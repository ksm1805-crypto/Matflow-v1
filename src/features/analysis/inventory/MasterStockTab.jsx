import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { generateId } from '../../utils/math';
import { fmtN } from '../../utils/format';

export const MasterStockTab = ({ globalInventory, updateGlobalInventory, readOnly }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const addGlobalItem = () => { if(!readOnly) updateGlobalInventory([...globalInventory, { id: generateId(), fullname: 'New Chemical', totalQty: '0', currentStock: '0' }]); };
    // ... updateItem, handlePaste 로직 (HTML 코드 참조) ...

    return (
        <div className="p-4 h-full flex flex-col space-y-4 bg-slate-100">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Icon name="package" className="text-brand-600" size={24}/> MASTER STOCK</h2>
                <div className="flex gap-3"><input className="pl-4 pr-4 py-1.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm outline-none" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." />{!readOnly && <button onClick={addGlobalItem} className="bg-slate-900 text-white px-5 py-1.5 rounded-xl text-xs font-black">+ ADD ITEM</button>}</div>
             </div>
             {/* ... 테이블 구현 (HTML 코드의 MasterStockTab 참조) ... */}
        </div>
    );
};