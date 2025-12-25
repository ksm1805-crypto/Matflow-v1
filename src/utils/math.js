// src/utils/math.js

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const calculateLotMetrics = (costData) => {
    if (!costData) return { synYield: 0, subYield: 0, unitCost: 0, actualOutput: 0, theoreticalOutput: 0 };
    
    const synYieldDecimal = costData.steps.reduce((acc, step) => acc * (parseFloat(step.yield || 0) / 100), 1.0);
    const synYield = (synYieldDecimal * 100).toFixed(1);
    
    const sub1 = parseFloat(costData.subYield1 || 0) / 100;
    const sub2 = parseFloat(costData.subYield2 || 0) / 100;
    const subYield = (sub1 * sub2 * 100).toFixed(1);
    
    const totalYield = synYieldDecimal * sub1 * sub2;

    const limitMol = costData.steps[0]?.materials[0]?.mol || 0;
    const theoreticalOutput = limitMol * (costData.targetMw || 0);
    const actualOutputG = theoreticalOutput * totalYield;
    const actualOutput = actualOutputG.toFixed(1);

    let totalMat = 0;
    costData.steps.forEach(s => s.materials.forEach(m => { 
        totalMat += (m.mol * m.mw / 1000) * m.price; 
    }));
    const procCostTotal = (costData.processCostPerDay || 0) * (costData.processDays || 0);
    const totalCost = totalMat + procCostTotal;
    const unitCost = actualOutputG > 0 ? (totalCost / actualOutputG).toFixed(0) : 0;

    return { synYield, subYield, unitCost, actualOutput, theoreticalOutput };
};

export const recalculateMols = (currentSteps) => {
    let currentScale = 1.0;
    let globalLimitMol = 0;
    return currentSteps.map((step, sIdx) => {
        if (sIdx === 0) { currentScale = 1.0; globalLimitMol = parseFloat(step.materials[0]?.mol) || 0; } 
        else { currentScale *= (parseFloat(currentSteps[sIdx - 1].yield) || 100) / 100; }
        const newMaterials = step.materials.map((m, mIdx) => {
            if (sIdx === 0 && mIdx === 0) return m; 
            if (sIdx > 0 && mIdx === 0) return { ...m, eq: 1.0, mol: globalLimitMol * currentScale }; 
            return { ...m, mol: globalLimitMol * currentScale * (m.eq || 0) };
        });
        return { ...step, materials: newMaterials };
    });
};

// [안전장치 추가] 데이터가 없거나 깨져있을 때 에러 없이 빈 배열 반환
export const processCrossLotImpurityData = (lots) => {
    if (!lots || !Array.isArray(lots)) return [];
    
    const allPeaks = [];
    const RRT_TOLERANCE = 0.05; 
    
    lots.forEach(lot => {
        if (!lot || !lot.hplcGrid || !Array.isArray(lot.hplcGrid) || lot.hplcGrid.length < 4) return;
        
        // 안전하게 인덱스 찾기
        const rrtRowIdx = lot.hplcGrid.findIndex(r => r[0] && String(r[0]).trim().toUpperCase() === 'RRT');
        const contentRowIdx = lot.hplcGrid.findIndex(r => r[0] && String(r[0]).includes('Content'));
        
        if (rrtRowIdx === -1 || contentRowIdx === -1) return;
        
        for (let c = 1; c < lot.hplcGrid[rrtRowIdx].length; c++) {
            const rrtVal = parseFloat(lot.hplcGrid[rrtRowIdx][c]);
            const contentVal = parseFloat(lot.hplcGrid[contentRowIdx][c]);
            
            if (!isNaN(rrtVal) && rrtVal >= 0 && !isNaN(contentVal)) {
                let existingPeak = allPeaks.find(p => Math.abs(p.rrt - rrtVal) <= RRT_TOLERANCE);
                if (existingPeak) { 
                    existingPeak.contents[lot.id] = contentVal; 
                } else { 
                    allPeaks.push({ rrt: rrtVal, contents: { [lot.id]: contentVal } }); 
                }
            }
        }
    });
    
    return allPeaks.sort((a, b) => a.rrt - b.rrt);
};