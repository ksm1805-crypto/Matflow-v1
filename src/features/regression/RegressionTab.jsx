import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { SimpleScatterChart } from '../../components/charts/SimpleScatterChart';
import { processCrossLotImpurityData } from '../../utils/math';
import { STANDARD_METALS } from '../../constants';

const HALOGEN_KEYS = ['f', 'cl', 'br'];

// --- 1. 다국어 사전 정의 (KO/EN/CN) ---
const TRANSLATIONS = {
    ko: {
        title_reg: "회귀 분석",
        lbl_group: "분석 그룹",
        lbl_target: "분석 대상",
        
        // Groups
        grp_main: "핵심 요인 (종합)",
        grp_peak: "개별 불순물 피크",
        grp_metal: "개별 금속 성분",
        grp_halogen: "개별 할로겐 성분",
        
        // Factors
        fac_purity: "HPLC 순도",
        fac_imp_sum: "총 불순물 합계",
        fac_metal_sum: "총 금속 함량",
        fac_halo_sum: "총 할로겐 함량",
        fac_yield: "전체 수율",
        fac_peak: "불순물 피크",
        fac_metal: "금속",
        fac_halo: "할로겐",
        
        // Top 3
        top3_title: "수명에 영향을 주는 주요 요인 Top 3",
        impact_crit: "매우 높음",
        impact_mod: "높음",
        impact_low: "낮음",
        
        // Correlation Card
        res_corr: "상관계수 (R)",
        res_target: "분석 대상:",
        
        // Chart
        chart_title: "산점도 분석:",
        axis_life: "수명 (Lifetime)",
        
        // Alerts
        msg_no_data: "데이터가 부족합니다",
        msg_req: "유효한 수명 데이터가 있는 Lot이 최소 2개 이상 필요합니다.",
        msg_valid: "유효 Lot:",
        msg_check: "개발자 도구(F12) 콘솔을 확인하세요.",
        alert_no_peak: "범위 내(RRT < 0.95 or > 1.05)의 불순물 피크가 없습니다."
    },
    en: {
        title_reg: "Regression Analysis",
        lbl_group: "Analysis Group",
        lbl_target: "Target Element",
        
        grp_main: "Key Factors (Totals)",
        grp_peak: "Individual HPLC Peaks",
        grp_metal: "Individual Metals",
        grp_halogen: "Individual Halogens",
        
        fac_purity: "HPLC Purity",
        fac_imp_sum: "Total Impurity Sum",
        fac_metal_sum: "Total Metal",
        fac_halo_sum: "Total Halogen",
        fac_yield: "Overall Yield",
        fac_peak: "Impurity Peak",
        fac_metal: "Metal",
        fac_halo: "Halogen",
        
        top3_title: "Top 3 Critical Factors Affecting Lifetime",
        impact_crit: "Critical Impact",
        impact_mod: "Moderate Impact",
        impact_low: "Low Impact",
        
        res_corr: "Correlation (R)",
        res_target: "Target:",
        
        chart_title: "Scatter Plot:",
        axis_life: "Lifetime",
        
        msg_no_data: "Not Enough Data",
        msg_req: "Minimum 2 Lots with valid Lifetime data required.",
        msg_valid: "Valid Lots:",
        msg_check: "Please check the console (F12) for details.",
        alert_no_peak: "No impurity peaks found in range (RRT < 0.95 or > 1.05)"
    },
    zh: {
        title_reg: "回归分析",
        lbl_group: "分析组",
        lbl_target: "目标元素",
        
        grp_main: "关键因素 (综合)",
        grp_peak: "单个杂质峰",
        grp_metal: "单个金属成分",
        grp_halogen: "单个卤素成分",
        
        fac_purity: "HPLC 纯度",
        fac_imp_sum: "杂质总和",
        fac_metal_sum: "金属总含量",
        fac_halo_sum: "卤素总含量",
        fac_yield: "总收率",
        fac_peak: "杂质峰",
        fac_metal: "金属",
        fac_halo: "卤素",
        
        top3_title: "影响寿命的前三大关键因素",
        impact_crit: "极高影响",
        impact_mod: "高影响",
        impact_low: "低影响",
        
        res_corr: "相关系数 (R)",
        res_target: "目标:",
        
        chart_title: "散点图分析:",
        axis_life: "寿命 (Lifetime)",
        
        msg_no_data: "数据不足",
        msg_req: "至少需要 2 个具有有效寿命数据的批次。",
        msg_valid: "有效批次:",
        msg_check: "请检查控制台 (F12) 以获取详细信息。",
        alert_no_peak: "范围内未找到杂质峰 (RRT < 0.95 或 > 1.05)"
    }
};

export const RegressionTab = ({ material, lots = [], lang = 'ko' }) => { // lang 받기
    const t = (key) => TRANSLATIONS[lang][key] || key; // 번역 헬퍼

    const [category, setCategory] = useState('MAIN'); 
    const [selectedDetail, setSelectedDetail] = useState('purity');

    const metalElements = useMemo(() => 
        material?.specification?.metalElements || STANDARD_METALS, 
        [material?.specification?.metalElements]
    );

    const crossLotPeaks = useMemo(() => processCrossLotImpurityData(lots), [lots]);

    const analysisData = useMemo(() => {
        if (!lots || lots.length === 0) {
            console.log("RegressionTab: No lots provided.");
            return [];
        }

        console.group("Regression Analysis Data Check");
        console.log("Raw Lots Data:", lots);

        const data = lots.map(lot => {
            const cleanNumber = (val) => {
                if (val === null || val === undefined || val === '') return 0;
                const strVal = String(val).replace(/,/g, '').trim();
                return parseFloat(strVal);
            };

            const lifetimeRaw = lot.lifetime;
            const lifetime = cleanNumber(lifetimeRaw);
            
            const isValid = !isNaN(lifetime) && lifetime > 0;
            if (!isValid) {
                console.warn(`Lot [${lot.name}] excluded. Raw Lifetime: "${lifetimeRaw}", Parsed: ${lifetime}`);
            }

            const purity = cleanNumber(lot.hplcSub);
            const synY = cleanNumber(lot.synYield);
            const subY = cleanNumber(lot.subYield);
            const overallYield = parseFloat(((synY * subY) / 100).toFixed(2));

            const metalSum = Object.values(lot.metalResults || {}).reduce((a, b) => a + cleanNumber(b), 0);
            const haloSum = HALOGEN_KEYS.reduce((acc, key) => acc + cleanNumber(lot.halogen?.[key]), 0);

            let totalImpuritySum = 0;
            crossLotPeaks.forEach(peak => {
                if (peak.rrt >= 0.95 && peak.rrt <= 1.05) return;
                totalImpuritySum += (peak.contents[lot.id] || 0);
            });

            const dataPoint = {
                id: lot.id, 
                name: lot.name, 
                lifetime: isValid ? lifetime : 0, 
                validLifetime: isValid, 
                purity,
                metal: metalSum, 
                halogen: haloSum,
                overallYield,
                totalImpurity: parseFloat(totalImpuritySum.toFixed(3))
            };

            metalElements.forEach(el => {
                dataPoint[`met_${el}`] = cleanNumber(lot.metalResults?.[el]);
            });
            
            HALOGEN_KEYS.forEach(el => {
                dataPoint[`halo_${el}`] = cleanNumber(lot.halogen?.[el]);
            });
            
            crossLotPeaks.forEach(peak => {
                if (peak.rrt < 0.95 || peak.rrt > 1.05) {
                    const keyName = `peak_${peak.rrt.toFixed(2)}`;
                    dataPoint[keyName] = peak.contents[lot.id] || 0;
                }
            });

            return dataPoint;
        });

        const filtered = data.filter(d => d.validLifetime);
        console.log(`Filtering Result: ${filtered.length} / ${data.length} lots are valid.`);
        console.groupEnd();

        return filtered;

    }, [lots, metalElements, crossLotPeaks]);

    useEffect(() => {
        if (analysisData.length > 0) {
            const firstItem = analysisData[0];
            if (!(selectedDetail in firstItem)) {
                if (category === 'MAIN') setSelectedDetail('purity');
                else if (category === 'PEAK') {
                    const peakKey = Object.keys(firstItem).find(k => k.startsWith('peak_'));
                    setSelectedDetail(peakKey || 'purity');
                }
                else if (category === 'METAL') setSelectedDetail(`met_${metalElements[0]}`);
                else if (category === 'HALOGEN') setSelectedDetail('halo_cl');
            }
        }
    }, [analysisData, category, selectedDetail, metalElements]);

    // Factor Info (번역 적용)
    const getFactorInfo = (key) => {
        if (!key) return { label: 'Select Factor', unit: '' };
        if (key === 'purity') return { label: t('fac_purity'), unit: '%' };
        if (key === 'totalImpurity') return { label: t('fac_imp_sum'), unit: '%' };
        if (key === 'metal') return { label: t('fac_metal_sum'), unit: 'ppm' };
        if (key === 'halogen') return { label: t('fac_halo_sum'), unit: 'ppm' };
        if (key === 'overallYield') return { label: t('fac_yield'), unit: '%' };
        if (key.startsWith('met_')) return { label: `${t('fac_metal')} [${key.split('_')[1]}]`, unit: 'ppm' };
        if (key.startsWith('halo_')) return { label: `${t('fac_halo')} [${key.split('_')[1].toUpperCase()}]`, unit: 'ppm' };
        if (key.startsWith('peak_')) return { label: `${t('fac_peak')} (RRT ${key.split('_')[1]})`, unit: '%' };
        return { label: key, unit: '' };
    };

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
            const denominatorSq = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
            if (denominatorSq <= 0) return 0;

            const denominator = Math.sqrt(denominatorSq);
            return denominator === 0 ? 0 : numerator / denominator;
        };

        const results = {};
        const allFactors = [];

        ['purity', 'totalImpurity', 'metal', 'halogen', 'overallYield'].forEach(k => {
            const r = calcR(k); 
            results[k] = r;
            // 라벨 생성 시 다국어 적용은 렌더링 시점에 getFactorInfo로 처리
            allFactors.push({ key: k, r: r, group: 'MAIN' });
        });

        metalElements.forEach(el => { 
            const k = `met_${el}`; 
            const r = calcR(k); 
            results[k] = r; 
            allFactors.push({ key: k, r: r, group: 'METAL' }); 
        });

        HALOGEN_KEYS.forEach(el => { 
            const k = `halo_${el}`; 
            const r = calcR(k); 
            results[k] = r; 
            allFactors.push({ key: k, r: r, group: 'HALOGEN' }); 
        });

        crossLotPeaks.forEach(peak => {
            if (peak.rrt < 0.95 || peak.rrt > 1.05) {
                const k = `peak_${peak.rrt.toFixed(2)}`; 
                const r = calcR(k); 
                results[k] = r;
                allFactors.push({ key: k, r: r, group: 'PEAK' });
            }
        });

        const sorted = allFactors.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        return { correlations: results, top3Factors: sorted.slice(0, 3) };
    }, [analysisData, metalElements, crossLotPeaks]);

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
            else alert(t('alert_no_peak'));
        }
    };

    if (analysisData.length < 2) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-4 p-8">
                <Icon name="bar-chart-2" size={48} className="opacity-20"/>
                <div className="text-center">
                    <p className="font-bold text-lg text-slate-500">{t('msg_no_data')}</p>
                    <p className="text-sm">{t('msg_req')}</p>
                    <p className="text-xs mt-2 opacity-70">({t('msg_valid')} {analysisData.length} / {lots.length})</p>
                    <p className="text-xs mt-1 text-rose-400">{t('msg_check')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="activity" className="text-purple-600"/> {t('title_reg')}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('lbl_group')}</label>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-purple-500" value={category} onChange={e => handleCategoryChange(e.target.value)}>
                            <option value="MAIN">{t('grp_main')}</option>
                            <option value="PEAK">{t('grp_peak')}</option>
                            <option value="METAL">{t('grp_metal')}</option>
                            <option value="HALOGEN">{t('grp_halogen')}</option>
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('lbl_target')}</label>
                        <select className="bg-white border border-brand-200 rounded-lg px-3 py-1.5 text-sm font-bold text-brand-700 outline-none ring-1 ring-brand-100 focus:ring-brand-300" value={selectedDetail} onChange={e => setSelectedDetail(e.target.value)}>
                            {category === 'MAIN' && <><option value="purity">{t('fac_purity')}</option><option value="totalImpurity">{t('fac_imp_sum')}</option><option value="metal">{t('fac_metal_sum')}</option><option value="halogen">{t('fac_halo_sum')}</option><option value="overallYield">{t('fac_yield')}</option></>}
                            {category === 'METAL' && metalElements.map(el => <option key={el} value={`met_${el}`}>{el}</option>)}
                            {category === 'HALOGEN' && HALOGEN_KEYS.map(el => <option key={el} value={`halo_${el}`}>{el.toUpperCase()}</option>)}
                            {category === 'PEAK' && crossLotPeaks.filter(p => p.rrt < 0.95 || p.rrt > 1.05).map(p => <option key={p.rrt} value={`peak_${p.rrt.toFixed(2)}`}>RRT {p.rrt.toFixed(2)}</option>)}
                        </select>
                    </div>
                </div>
             </div>

             {top3Factors.length > 0 && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-lg animate-in flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold uppercase text-xs tracking-wider"><Icon name="star" size={14} className="fill-current"/> {t('top3_title')}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {top3Factors.map((factor, idx) => {
                            const info = getFactorInfo(factor.key);
                            return (
                                <div key={idx} onClick={() => { setCategory(factor.group); setSelectedDetail(factor.key); }} className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition cursor-pointer border border-white/10">
                                    <div className="flex justify-between items-start">
                                        <div className="text-xs text-slate-300 font-bold mb-1">#{idx+1} {info.label}</div>
                                        <div className={`text-[10px] px-1.5 rounded font-bold ${factor.r < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>R = {factor.r.toFixed(3)}</div>
                                    </div>
                                    <div className="text-xs text-slate-400 truncate">{Math.abs(factor.r) > 0.8 ? t('impact_crit') : Math.abs(factor.r) > 0.5 ? t('impact_mod') : t('impact_low')}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             )}

             <div className="flex-1 grid grid-cols-12 gap-6 min-h-[400px]">
                 <div className="col-span-12 md:col-span-3 flex flex-col gap-6">
                    <Card title="Correlation Result" icon="trending-up" color="text-slate-700">
                        <div className="text-center py-6">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">{t('res_corr')}</div>
                            <div className={`text-4xl font-black ${currentR < -0.7 ? 'text-rose-600' : currentR > 0.7 ? 'text-emerald-600' : 'text-slate-700'}`}>{currentR.toFixed(3)}</div>
                            <div className="mt-4 px-4 py-2 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed border border-slate-100">{t('res_target')} <strong className="text-slate-800">{currentInfo.label}</strong></div>
                        </div>
                    </Card>
                 </div>
                 <div className="col-span-12 md:col-span-9">
                     <Card className="h-full flex flex-col" title={`${t('chart_title')} ${currentInfo.label} vs Lifetime`} icon="scatter-chart">
                        <div className="flex-1 min-h-[350px] mt-4">
                            <SimpleScatterChart data={analysisData} xKey={selectedDetail} xLabel={`${currentInfo.label} (${currentInfo.unit})`} yLabel={t('axis_life')} />
                        </div>
                     </Card>
                 </div>
             </div>
        </div>
    );
};