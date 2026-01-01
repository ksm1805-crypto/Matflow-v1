import React from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { calculateLotMetrics, generateId } from '../../utils/math';
import { fmtN, fmtK } from '../../utils/format';

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        // 대시보드
        total_stock: "총 재고",
        total_revenue: "총 매출",
        op_profit: "영업 이익",
        margin: "마진율",
        fixed_ratio: "프로젝트 고정비 비율",
        fixed_ratio_desc: "매출액 대비 적용",
        
        // 화폐 및 단위
        currency: "₩",
        unit_large: "억", // 100,000,000
        
        // 카드 및 테이블
        stock_label: "재고",
        mfg_cost: "제조원가",
        ship_history: "출하 이력",
        new_ship: "출하 추가",
        no_history: "출하 기록이 없습니다.",
        
        // 테이블 헤더
        col_date: "날짜",
        col_cust: "고객사",
        col_purpose: "용도",
        col_mfg_cost: "제조단가",
        col_price: "판매단가",
        col_amount: "수량",
        col_revenue: "매출액",
        col_profit: "영업이익",
        
        // 입력창 및 알림
        ph_cust: "고객사명",
        ph_purpose: "용도 입력",
        delete_confirm: "정말 삭제하시겠습니까?"
    },
    en: {
        total_stock: "Total Stock",
        total_revenue: "Total Revenue",
        op_profit: "Operating Profit",
        margin: "Margin",
        fixed_ratio: "Project Fixed Ratio",
        fixed_ratio_desc: "Applied to Sales Revenue",
        
        currency: "$",
        unit_large: "M", // Million
        
        stock_label: "Stock",
        mfg_cost: "Mfg Cost",
        ship_history: "Shipment History",
        new_ship: "New Shipment",
        no_history: "No shipment history",
        
        col_date: "Date",
        col_cust: "Customer",
        col_purpose: "Purpose",
        col_mfg_cost: "Mfg Cost",
        col_price: "Sales Price",
        col_amount: "Amount",
        col_revenue: "Revenue",
        col_profit: "Op. Profit",
        
        ph_cust: "Customer",
        ph_purpose: "Purpose",
        delete_confirm: "Delete?"
    },
    zh: {
        total_stock: "总库存",
        total_revenue: "总收入",
        op_profit: "营业利润",
        margin: "利润率",
        fixed_ratio: "项目固定比例",
        fixed_ratio_desc: "应用于销售收入",
        
        currency: "¥",
        unit_large: "亿", // 100,000,000
        
        stock_label: "库存",
        mfg_cost: "制造成本",
        ship_history: "出货记录",
        new_ship: "新增出货",
        no_history: "无出货记录",
        
        col_date: "日期",
        col_cust: "客户",
        col_purpose: "用途",
        col_mfg_cost: "制造单价",
        col_price: "销售单价",
        col_amount: "数量",
        col_revenue: "销售额",
        col_profit: "营业利润",
        
        ph_cust: "客户名称",
        ph_purpose: "输入用途",
        delete_confirm: "确定删除？"
    }
};

// [중요] lang Props를 받아서 처리합니다
export const ProductStockTab = ({ material, updateMaterial, readOnly, lang = 'ko' }) => { 
    const t = (key) => TRANSLATIONS[lang][key] || key; // 번역 헬퍼 함수

    const updateLot = (lotId, newLotData) => { if(!readOnly) updateMaterial({ ...material, lots: material.lots.map(l => l.id === lotId ? newLotData : l) }); };
    
    const addShipment = (lot) => { if(!readOnly) updateLot(lot.id, { ...lot, shipments: [...(lot.shipments || []), { id: generateId(), date: new Date().toISOString().split('T')[0], customer: '', purpose: '', amount: '', unitPrice: '' }] }); };
    
    const updateShipment = (lot, shipmentId, field, val) => { if(!readOnly) updateLot(lot.id, { ...lot, shipments: lot.shipments.map(s => s.id === shipmentId ? { ...s, [field]: val } : s) }); };
    
    const removeShipment = (lot, shipmentId) => { if(!readOnly && window.confirm(t('delete_confirm'))) updateLot(lot.id, { ...lot, shipments: lot.shipments.filter(s => s.id !== shipmentId) }); };

    const fixedRatio = parseFloat(material.salesParams?.fixedRatio) || 0;
    const updateFixedRatio = (val) => { if(!readOnly) updateMaterial({ ...material, salesParams: { ...material.salesParams, fixedRatio: val } }); };

    const totalStats = material.lots.reduce((acc, lot) => {
        const costMetrics = calculateLotMetrics(lot.costData);
        const unitCost = parseFloat(costMetrics.unitCost) || 0;
        
        const prod = parseFloat(lot.actualOutput) || 0; 
        const shipped = (lot.shipments || []).reduce((sAcc, s) => sAcc + (parseFloat(s.amount) || 0), 0);
        
        const revenue = (lot.shipments || []).reduce((rAcc, s) => rAcc + ((parseFloat(s.amount)||0) * (parseFloat(s.unitPrice)||0)), 0);
        
        const variableCost = (lot.shipments || []).reduce((cAcc, s) => cAcc + ((parseFloat(s.amount)||0) * unitCost), 0);
        
        return { 
            currentStock: acc.currentStock + (prod - shipped), 
            totalShipped: acc.totalShipped + shipped, 
            totalRevenue: acc.totalRevenue + revenue,
            totalVariableCost: acc.totalVariableCost + variableCost
        };
    }, { currentStock: 0, totalShipped: 0, totalRevenue: 0, totalVariableCost: 0 });

    const totalFixedCost = totalStats.totalRevenue * (fixedRatio / 100);
    const totalOpProfit = totalStats.totalRevenue - totalStats.totalVariableCost - totalFixedCost;
    
    // [다국어 지원] 큰 금액 포맷팅 함수 (억/M/亿)
    const formatBigMoney = (val) => {
        if (!val) return '0';
        const v = parseFloat(val);
        if (isNaN(v)) return '0';

        if (lang === 'en') {
            return (v / 1000000).toFixed(2); // M (Million)
        } else {
            return (v / 100000000).toFixed(2); // 억/亿
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* 상단 통계 대시보드 */}
            <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t('total_stock')}</h4>
                    <div className="text-2xl font-black text-slate-800">{fmtN(totalStats.currentStock, 1)} <span className="text-sm font-normal text-slate-400">g</span></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t('total_revenue')}</h4>
                    <div className="text-2xl font-black text-brand-600">
                        {t('currency')}{formatBigMoney(totalStats.totalRevenue)}{t('unit_large')}
                    </div>
                </div>
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group text-white">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{t('op_profit')}</h4>
                    <div className={`text-2xl font-black ${totalOpProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t('currency')}{formatBigMoney(totalOpProfit)}{t('unit_large')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t('margin')}: {totalStats.totalRevenue > 0 ? ((totalOpProfit/totalStats.totalRevenue)*100).toFixed(1) : 0}%</div>
                </div>
                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden group">
                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1"><Icon name="coins" size={12}/> {t('fixed_ratio')}</h4>
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
                    <div className="text-[10px] text-amber-600/70 mt-1">{t('fixed_ratio_desc')}</div>
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
                        <Card 
                            key={lot.id} 
                            title={`${lot.name} (${t('stock_label')}: ${fmtN(stock, 1)} g)`} 
                            icon="box" 
                            className="p-0" 
                            action={
                                <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                    {t('mfg_cost')}: {t('currency')}{fmtK(unitCost)}/g
                                </div>
                            }
                        >
                            <div className="p-4 bg-slate-50">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Icon name="truck" size={14}/> {t('ship_history')}</h5>
                                    {!readOnly && <button onClick={() => addShipment(lot)} className="text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded transition flex items-center gap-1 shadow-sm"><Icon name="plus" size={12}/> {t('new_ship')}</button>}
                                </div>
                                
                                {lot.shipments && lot.shipments.length > 0 ? (
                                    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-100 text-slate-500 uppercase">
                                                <tr>
                                                    <th className="p-2 w-24">{t('col_date')}</th>
                                                    <th className="p-2">{t('col_cust')}</th>
                                                    <th className="p-2">{t('col_purpose')}</th>
                                                    <th className="p-2 text-right w-24 text-slate-400">{t('col_mfg_cost')}</th>
                                                    <th className="p-2 text-right w-24 text-blue-600">{t('col_price')}</th>
                                                    <th className="p-2 text-right w-20">{t('col_amount')}</th>
                                                    <th className="p-2 text-right w-28">{t('col_revenue')}</th>
                                                    <th className="p-2 text-right w-28 text-emerald-600 font-bold">{t('col_profit')}</th>
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
                                                            <td className="p-2"><input disabled={readOnly} className="bg-transparent text-slate-800 w-full outline-none" placeholder={t('ph_cust')} value={ship.customer} onChange={e => updateShipment(lot, ship.id, 'customer', e.target.value)} /></td>
                                                            <td className="p-2"><input disabled={readOnly} className="bg-transparent text-slate-600 w-full outline-none" placeholder={t('ph_purpose')} value={ship.purpose} onChange={e => updateShipment(lot, ship.id, 'purpose', e.target.value)} /></td>
                                                            <td className="p-2 text-right font-mono text-slate-400">{t('currency')}{fmtK(unitCost)}</td>
                                                            <td className="p-2"><input disabled={readOnly} type="number" className="bg-transparent text-blue-600 font-bold text-right w-full outline-none" placeholder="0" value={ship.unitPrice} onChange={e => updateShipment(lot, ship.id, 'unitPrice', e.target.value)} /></td>
                                                            <td className="p-2"><input disabled={readOnly} type="number" className="bg-transparent text-slate-700 font-bold text-right w-full outline-none" placeholder="0.0" value={ship.amount} onChange={e => updateShipment(lot, ship.id, 'amount', e.target.value)} /></td>
                                                            <td className="p-2 text-right font-mono text-slate-700">
                                                                {revenue > 0 ? `${t('currency')}${formatBigMoney(revenue)}${t('unit_large')}` : '-'}
                                                            </td>
                                                            <td className={`p-2 text-right font-mono font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                {revenue > 0 ? `${t('currency')}${formatBigMoney(profit)}${t('unit_large')}` : '-'}
                                                            </td>
                                                            <td className="p-2 text-center">{!readOnly && <button onClick={() => removeShipment(lot, ship.id)} className="text-slate-400 hover:text-rose-500"><Icon name="x" size={14}/></button>}</td>
                                                        </tr>
                                                    ); 
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (<div className="text-center p-4 text-xs text-slate-400 italic border border-dashed border-slate-300 rounded-lg">{t('no_history')}</div>)}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};