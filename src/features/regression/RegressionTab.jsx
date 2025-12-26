import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { SimpleScatterChart } from '../../components/charts/SimpleScatterChart';
import { processCrossLotImpurityData } from '../../utils/math';
import { STANDARD_METALS } from '../../constants';

// 변하지 않는 상수는 컴포넌트 외부로 분리
const HALOGEN_KEYS = ['f', 'cl', 'br'];

export const RegressionTab = ({ material, lots = [] }) => {
    const [category, setCategory] = useState('MAIN'); 
    const [selectedDetail, setSelectedDetail] = useState('purity');

    // material 전체가 아닌 필요한 하위 값만 의존성 배열에 넣어 최적화
    const metalElements = useMemo(() => 
        material?.specification?.metalElements || STANDARD_METALS, 
        [material?.specification?.metalElements]
    );

    // Lot들의 Peak 데이터를 RRT 기준으로 정렬 및 병합
    const crossLotPeaks = useMemo(() => processCrossLotImpurityData(lots), [lots]);

    // 분석용 데이터 생성
    const analysisData = useMemo(() => {
        if (!lots || lots.length === 0) return [];

        return lots.map(lot => {
            const lifetime = parseFloat(lot.lifetime) || 0;
            const purity = parseFloat(lot.hplcSub) || 0;
            
            const synY = parseFloat(lot.synYield) || 0;
            const subY = parseFloat(lot.subYield) || 0;
            const overallYield = parseFloat(((synY * subY) / 100).toFixed(2));

            const metalSum = Object.values(lot.metalResults || {}).reduce((a, b) => a + (parseFloat(b)||0), 0);
            const haloSum = (parseFloat(lot.halogen?.f)||0) + (parseFloat(lot.halogen?.cl)||0) + (parseFloat(lot.halogen?.br)||0);

            let totalImpuritySum = 0;
            crossLotPeaks.forEach(peak => {
                if (peak.rrt >= 0.95 && peak.rrt <= 1.05) return; 
                totalImpuritySum += (peak.contents[lot.id] || 0);
            });

            const dataPoint = {
                id: lot.id, 
                name: lot.name, 
                lifetime, 
                purity,
                metal: metalSum, 
                halogen: haloSum,
                overallYield: overallYield,
                totalImpurity: parseFloat(totalImpuritySum.toFixed(3))
            };

            metalElements.forEach(el => dataPoint[`met_${el}`] = parseFloat(lot.metalResults?.[el] || 0));
            
            HALOGEN_KEYS.forEach(el => dataPoint[`halo_${el}`] = parseFloat(lot.halogen?.[el] || 0));
            
            crossLotPeaks.forEach(peak => {
                if (peak.rrt < 0.95 || peak.rrt > 1.05) {
                    const keyName = `peak_${peak.rrt.toFixed(2)}`;
                    dataPoint[keyName] = peak.contents[lot.id] || 0;
                }
            });

            return dataPoint;
        }).filter(d => d.lifetime > 0); 
    }, [lots, metalElements, crossLotPeaks]);

    // 상관관계(R) 계산 및 Top 3 추천
    const { correlations, top3Factors } = useMemo(() => {
        if (analysisData.length < 2) return { correlations: {}, top3Factors: [] };
        
        const calcR = (key) => {
            const n = analysisData.length;
            const x = analysisData.map(d => d[key] || 0);
            const y = analysisData.map(d => d.lifetime);
            
            const allSame = x.every(v => v === x[0]);
            if (allSame) return 0;

            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = analysisData.reduce((a, b) => a + ((b[key]||0) * b.lifetime), 0);
            const sumX2 = x.reduce((a, b) => a + b*b, 0);
            const sumY2 = y.reduce((a, b) => a + b*b, 0);
            
            const numerator = (n * sumXY) - (sumX * sumY);
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            
            return denominator === 0 ? 0 : numerator / denominator;
        };

        const results = {};
        const allFactors = [];

        ['purity', 'totalImpurity', 'metal', 'halogen', 'overallYield'].forEach(k => {
            const r = calcR(k); 
            results[k] = r;
            let label = k.charAt(0).toUpperCase() + k.slice(1);
            if (k === 'totalImpurity') label = 'Total Impurity Sum';
            if (k === 'overallYield') label = 'Overall Yield';
            allFactors.push({ key: k, r: r, group: 'MAIN', label });
        });

        metalElements.forEach(el => { 
            const k = `met_${el}`; 
            const r = calcR(k); 
            results[k] = r; 
            allFactors.push({ key: k, r: r, group: 'METAL', label: `Metal [${el}]` }); 
        });

        HALOGEN_KEYS.forEach(el => { 
            const k = `halo_${el}`; 
            const r = calcR(k); 
            results[k] = r; 
            allFactors.push({ key: k, r: r, group: 'HALOGEN', label: `Halogen [${el.toUpperCase()}]` }); 
        });

        crossLotPeaks.forEach(peak => {
            if (peak.rrt < 0.95 || peak.rrt > 1.05) {
                const k = `peak_${peak.rrt.toFixed(2)}`; 
                const r = calcR(k); 
                results[k] = r;
                allFactors.push({ key: k, r: r, group: 'PEAK', label: `Peak (RRT ${peak.rrt.toFixed(2)})` });
            }
        });

        const sorted = allFactors.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        return { correlations: results, top3Factors: sorted.slice(0, 3) };
    }, [analysisData, metalElements, crossLotPeaks]);

    // 라벨 헬퍼
    const getFactorInfo = (key) => {
        if (key === 'purity') return { label: 'HPLC Purity', unit: '%' };
        if (key === 'totalImpurity') return { label: 'Total Impurity Sum', unit: '%' };
        if (key === 'metal') return { label: 'Total Metal', unit: 'ppm' };
        if (key === 'halogen') return { label: 'Total Halogen', unit: 'ppm' };
        if (key === 'overallYield') return { label: 'Overall Yield', unit: '%' };
        if (key.startsWith('met_')) return { label: `Metal [${key.split('_')[1]}]`, unit: 'ppm' };
        if (key.startsWith('halo_')) return { label: `Halogen [${key.split('_')[1].toUpperCase()}]`, unit: 'ppm' };
        if (key.startsWith('peak_')) return { label: `Impurity Peak (RRT ${key.split('_')[1]})`, unit: '%' };
        return { label: key, unit: '' };
    };

    const currentInfo = getFactorInfo(selectedDetail);
    const currentR = correlations[selectedDetail] !== undefined ? correlations[selectedDetail] : 0;

    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        if (newCat === 'MAIN') setSelectedDetail('purity');
        else if (newCat === 'METAL') setSelectedDetail(`met_${metalElements[0]}`);
        else if (newCat === 'HALOGEN') setSelectedDetail(`halo_${HALOGEN_KEYS[0]}`);
        else if (newCat === 'PEAK') {
            const firstPeak = crossLotPeaks.find(p => p.rrt < 0.95 || p.rrt > 1.05);
            if(firstPeak) setSelectedDetail(`peak_${firstPeak.rrt.toFixed(2)}`);
        }
    };

    return (
        // [수정] overflow-y-auto와 custom-scrollbar를 추가하여 스크롤 문제 해결
        <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
             {/* 상단 컨트롤 바 */}
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="activity" className="text-purple-600"/> Regression Analysis
                </h2>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Analysis Group</label>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-purple-500" value={category} onChange={e => handleCategoryChange(e.target.value)}>
                            <option value="MAIN">Key Factors (Totals)</option>
                            <option value="PEAK">Individual HPLC Peaks</option>
                            <option value="METAL">Individual Metals</option>
                            <option value="HALOGEN">Individual Halogens</option>
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Element</label>
                        <select className="bg-white border border-brand-200 rounded-lg px-3 py-1.5 text-sm font-bold text-brand-700 outline-none ring-1 ring-brand-100 focus:ring-brand-300" value={selectedDetail} onChange={e => setSelectedDetail(e.target.value)}>
                            {category === 'MAIN' && <><option value="purity">HPLC Purity</option><option value="totalImpurity">Total Impurity Sum</option><option value="metal">Total Metal</option><option value="halogen">Total Halogen</option><option value="overallYield">Overall Yield</option></>}
                            {category === 'METAL' && metalElements.map(el => <option key={el} value={`met_${el}`}>{el}</option>)}
                            {category === 'HALOGEN' && HALOGEN_KEYS.map(el => <option key={el} value={`halo_${el}`}>{el.toUpperCase()}</option>)}
                            {category === 'PEAK' && crossLotPeaks.filter(p => p.rrt < 0.95 || p.rrt > 1.05).map(p => <option key={p.rrt} value={`peak_${p.rrt.toFixed(2)}`}>RRT {p.rrt.toFixed(2)}</option>)}
                        </select>
                    </div>
                </div>
             </div>

             {/* Top 3 추천 */}
             {top3Factors.length > 0 && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-lg animate-in flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold uppercase text-xs tracking-wider"><Icon name="star" size={14} className="fill-current"/> Top 3 Critical Factors Affecting Lifetime</div>
                    <div className="grid grid-cols-3 gap-4">
                        {top3Factors.map((factor, idx) => (
                            <div key={idx} onClick={() => { setCategory(factor.group); setSelectedDetail(factor.key); }} className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition cursor-pointer border border-white/10">
                                <div className="flex justify-between items-start"><div className="text-xs text-slate-300 font-bold mb-1">#{idx+1} {factor.label}</div><div className={`text-[10px] px-1.5 rounded font-bold ${factor.r < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>R = {factor.r.toFixed(3)}</div></div>
                                <div className="text-xs text-slate-400 truncate">{Math.abs(factor.r) > 0.8 ? 'Critical Impact' : Math.abs(factor.r) > 0.5 ? 'Moderate Impact' : 'Low Impact'}</div>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             {/* 차트 및 요약 */}
             <div className="flex-1 grid grid-cols-12 gap-6 min-h-[400px]">
                 <div className="col-span-12 md:col-span-3 flex flex-col gap-6">
                    <Card title="Correlation Result" icon="trending-up" color="text-slate-700">
                        <div className="text-center py-6">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Correlation (R)</div>
                            <div className={`text-4xl font-black ${currentR < -0.7 ? 'text-rose-600' : currentR > 0.7 ? 'text-emerald-600' : 'text-slate-700'}`}>{currentR.toFixed(3)}</div>
                            <div className="mt-4 px-4 py-2 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed border border-slate-100">Target: <strong className="text-slate-800">{currentInfo.label}</strong></div>
                        </div>
                    </Card>
                 </div>
                 <div className="col-span-12 md:col-span-9">
                     <Card className="h-full flex flex-col" title={`Scatter Plot: ${currentInfo.label} vs Lifetime`} icon="scatter-chart">
                        <div className="flex-1 min-h-[350px] mt-4">
                            <SimpleScatterChart data={analysisData} xKey={selectedDetail} xLabel={`${currentInfo.label} (${currentInfo.unit})`} yLabel="Lifetime" />
                        </div>
                     </Card>
                 </div>
             </div>
        </div>
    );
};