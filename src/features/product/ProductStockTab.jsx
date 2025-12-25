import React from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { calculateLotMetrics, generateId } from '../../utils/math';
import { fmtN, fmtK } from '../../utils/format';

export const ProductStockTab = ({ material, updateMaterial, readOnly }) => {
    const updateLot = (lotId, newLotData) => { if(!readOnly) updateMaterial({ ...material, lots: material.lots.map(l => l.id === lotId ? newLotData : l) }); };
    
    const addShipment = (lot) => { if(!readOnly) updateLot(lot.id, { ...lot, shipments: [...(lot.shipments || []), { id: generateId(), date: new Date().toISOString().split('T')[0], customer: '', purpose: '', amount: '', unitPrice: '' }] }); };
    
    const updateShipment = (lot, shipmentId, field, val) => { if(!readOnly) updateLot(lot.id, { ...lot, shipments: lot.shipments.map(s => s.id === shipmentId ? { ...s, [field]: val } : s) }); };
    
    const removeShipment = (lot, shipmentId) => { if(!readOnly && confirm("Delete?")) updateLot(lot.id, { ...lot, shipments: lot.shipments.filter(s => s.id !== shipmentId) }); };

    // [핵심] 고정비율은 Project 레벨에서 관리
    const fixedRatio = parseFloat(material.salesParams?.fixedRatio) || 0;
    const updateFixedRatio = (val) => { if(!readOnly) updateMaterial({ ...material, salesParams: { ...material.salesParams, fixedRatio: val } }); };

    // 전체 통계 계산 (All Lots)
    const totalStats = material.lots.reduce((acc, lot) => {
        // Cost 탭의 계산 로직을 빌려와서 Unit Cost(제조원가)를 가져옴 -> 변동비로 사용
        const costMetrics = calculateLotMetrics(lot.costData);
        const unitCost = parseFloat(costMetrics.unitCost) || 0;
        
        const prod = parseFloat(lot.actualOutput) || 0; 
        const shipped = (lot.shipments || []).reduce((sAcc, s) => sAcc + (parseFloat(s.amount) || 0), 0);
        
        // 매출액 합계
        const revenue = (lot.shipments || []).reduce((rAcc, s) => rAcc + ((parseFloat(s.amount)||0) * (parseFloat(s.unitPrice)||0)), 0);
        
        // 변동비(매출원가) 합계 = 출하량 * 제조단가(Unit Cost)
        const variableCost = (lot.shipments || []).reduce((cAcc, s) => cAcc + ((parseFloat(s.amount)||0) * unitCost), 0);
        
        return { 
            currentStock: acc.currentStock + (prod - shipped), 
            totalShipped: acc.totalShipped + shipped, 
            totalRevenue: acc.totalRevenue + revenue,
            totalVariableCost: acc.totalVariableCost + variableCost
        };
    }, { currentStock: 0, totalShipped: 0, totalRevenue: 0, totalVariableCost: 0 });

    // [전체 영업이익 계산]
    const totalFixedCost = totalStats.totalRevenue * (fixedRatio / 100);
    const totalOpProfit = totalStats.totalRevenue - totalStats.totalVariableCost - totalFixedCost;
    
    const fmtEok = (val) => { if (!val) return '0'; const v = parseFloat(val); return isNaN(v) ? '0' : (v / 100000000).toFixed(2); };

    return (
        <div className="p-6 space-y-6">
            {/* 상단 통계 대시보드 */}
            <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Total Stock</h4>
                    <div className="text-2xl font-black text-slate-800">{fmtN(totalStats.currentStock, 1)} <span className="text-sm font-normal text-slate-400">g</span></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Total Revenue</h4>
                    <div className="text-2xl font-black text-brand-600">₩{fmtEok(totalStats.totalRevenue)}억</div>
                </div>
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group text-white">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Operating Profit</h4>
                    <div className={`text-2xl font-black ${totalOpProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₩{fmtEok(totalOpProfit)}억
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Margin: {totalStats.totalRevenue > 0 ? ((totalOpProfit/totalStats.totalRevenue)*100).toFixed(1) : 0}%</div>
                </div>
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden group">
                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1"><Icon name="coins" size={12}/> Project Fixed Ratio</h4>
                    <div className="flex items-center gap-2">
                        <input 
                            disabled={readOnly} 
                            type="number" 
                            className="bg-white border border-amber-200 rounded px-2 py-1 text-xl font-bold text-amber-800 w-24 outline-none focus:border-amber-500 text-right" 
                            value={fixedRatio} 
                            onChange={e => updateFixedRatio(e.target.value)} 
                        />
                        <span className="text-sm font-bold text-amber-600">%</span>
                    </div>
                    <div className="text-[10px] text-amber-600/70 mt-1">Applied to Sales Revenue</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {material.lots.map(lot => {
                    const prod = parseFloat(lot.actualOutput) || 0; 
                    const shipped = (lot.shipments || []).reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0); 
                    const stock = prod - shipped;
                    const lotMetrics = calculateLotMetrics(lot.costData);
                    const unitCost = parseFloat(lotMetrics.unitCost) || 0;

                    return (
                        <Card key={lot.id} title={`${lot.name} (Stock: ${fmtN(stock, 1)} g)`} icon="box" className="p-0" action={<div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">Mfg Cost: ₩{fmtK(unitCost)}/g</div>}>
                            <div className="p-4 bg-slate-50">
                                <div className="flex justify-between items-center mb-2"><h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Icon name="truck" size={14}/> Shipment History</h5>{!readOnly && <button onClick={() => addShipment(lot)} className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded transition flex items-center gap-1 shadow-sm"><Icon name="plus" size={12}/> New Shipment</button>}</div>
                                {lot.shipments && lot.shipments.length > 0 ? (
                                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-100 text-slate-500 uppercase">
                                                <tr>
                                                    <th className="p-2 w-24">Date</th>
                                                    <th className="p-2">Customer</th>
                                                    <th className="p-2">Purpose</th>
                                                    <th className="p-2 text-right w-24 text-slate-400">Mfg Cost</th>
                                                    <th className="p-2 text-right w-24 text-blue-600">Sales Price</th>
                                                    <th className="p-2 text-right w-20">Amount</th>
                                                    <th className="p-2 text-right w-28">Revenue</th>
                                                    <th className="p-2 text-right w-28 text-emerald-600 font-bold">Op. Profit</th>
                                                    <th className="p-2 w-10 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {lot.shipments.map(ship => { 
                                                    const price = parseFloat(ship.unitPrice) || 0;
                                                    const amt = parseFloat(ship.amount) || 0;
                                                    const revenue = price * amt;
                                                    const variableCost = unitCost * amt;
                                                    const allocatedFixedCost = revenue * (fixedRatio / 100);
                                                    const profit = revenue - variableCost - allocatedFixedCost;
                                                    
                                                    return (
                                                        <tr key={ship.id} className="hover:bg-slate-50">
                                                            <td className="p-2"><input disabled={readOnly} type="date" className="bg-transparent text-slate-600 w-full outline-none" value={ship.date} onChange={e => updateShipment(lot, ship.id, 'date', e.target.value)} /></td>
                                                            <td className="p-2"><input disabled={readOnly} className="bg-transparent text-slate-800 w-full outline-none" placeholder="Customer" value={ship.customer} onChange={e => updateShipment(lot, ship.id, 'customer', e.target.value)} /></td>
                                                            <td className="p-2"><input disabled={readOnly} className="bg-transparent text-slate-600 w-full outline-none" placeholder="Purpose" value={ship.purpose} onChange={e => updateShipment(lot, ship.id, 'purpose', e.target.value)} /></td>
                                                            <td className="p-2 text-right font-mono text-slate-400">₩{fmtK(unitCost)}</td>
                                                            <td className="p-2"><input disabled={readOnly} type="number" className="bg-transparent text-blue-600 font-bold text-right w-full outline-none" placeholder="0" value={ship.unitPrice} onChange={e => updateShipment(lot, ship.id, 'unitPrice', e.target.value)} /></td>
                                                            <td className="p-2"><input disabled={readOnly} type="number" className="bg-transparent text-slate-700 font-bold text-right w-full outline-none" placeholder="0.0" value={ship.amount} onChange={e => updateShipment(lot, ship.id, 'amount', e.target.value)} /></td>
                                                            <td className="p-2 text-right font-mono text-slate-700">{revenue > 0 ? `₩${fmtEok(revenue)}억` : '-'}</td>
                                                            <td className={`p-2 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{revenue > 0 ? `₩${fmtEok(profit)}억` : '-'}</td>
                                                            <td className="p-2 text-center">{!readOnly && <button onClick={() => removeShipment(lot, ship.id)} className="text-slate-400 hover:text-rose-500"><Icon name="x" size={14}/></button>}</td>
                                                        </tr>
                                                    ); 
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (<div className="text-center p-4 text-xs text-slate-400 italic border border-dashed border-slate-300 rounded-lg">No shipment history</div>)}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};