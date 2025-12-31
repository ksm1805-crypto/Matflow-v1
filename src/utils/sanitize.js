// src/utils/sanitize.js
import { generateId } from './math';
import { STANDARD_METALS } from '../constants';

export const sanitizeLot = (lot) => {
    let metalResults = lot.metalResults || {};
    
    const defaultHeader = ['Parameter', 'Peak 1', 'Peak 2', 'Peak 3', 'Peak 4'];
    const defaultRows = (cols) => [['RT', ...Array(cols).fill('')], ['RRT', ...Array(cols).fill('')], ['Content (%)', ...Array(cols).fill('')]];
    const ensureGrid = (grid) => Array.isArray(grid) && grid.length > 0 ? grid : [defaultHeader, ...defaultRows(4)];

    return {
        id: lot.id || generateId(),
        name: lot.name || 'New Lot',
        
        synDateStart: lot.synDateStart || '',
        synDateEnd: lot.synDateEnd || '',
        synSite: lot.synSite || '',
        subSite: lot.subSite || '',
        
        synYield: lot.synYield || '', subYield: lot.subYield || '',
        unitCost: lot.unitCost || '', actualOutput: lot.actualOutput || '',
        hplcSyn: lot.hplcSyn || '', hplcSub: lot.hplcSub || '', 
        
        isMix: lot.isMix || false,
        mixCount: lot.mixCount || 2,
        comp1Label: lot.comp1Label || 'P', comp2Label: lot.comp2Label || 'N', comp3Label: lot.comp3Label || '3rd',
        pRatio: lot.pRatio || '', nRatio: lot.nRatio || '', mixRatio3: lot.mixRatio3 || '',
        
        synYieldP: lot.synYieldP || '', subYieldP: lot.subYieldP || '',
        hplcSynP: lot.hplcSynP || '', hplcSubP: lot.hplcSubP || '', dRateP: lot.dRateP || '',
        synYieldN: lot.synYieldN || '', subYieldN: lot.subYieldN || '',
        hplcSynN: lot.hplcSynN || '', hplcSubN: lot.hplcSubN || '', dRateN: lot.dRateN || '',
        synYield3: lot.synYield3 || '', subYield3: lot.subYield3 || '',
        hplcSyn3: lot.hplcSyn3 || '', hplcSub3: lot.hplcSub3 || '', dRate3: lot.dRate3 || '',

        dRate: lot.dRate || '',
        hplcMethodVersion: lot.hplcMethodVersion || '',
        synHistory: lot.synHistory || '',
        
        hplcGrid: ensureGrid(lot.hplcGrid),
        hplcGridP: ensureGrid(lot.hplcGridP),
        hplcGridN: ensureGrid(lot.hplcGridN),
        hplcGrid3: ensureGrid(lot.hplcGrid3),
        
        hplcSynFiles: Array.isArray(lot.hplcSynFiles) ? lot.hplcSynFiles : [],
        hplcSubFiles: Array.isArray(lot.hplcSubFiles) ? lot.hplcSubFiles : [],
        
        td1: lot.td1 || '', td5: lot.td5 || '',
        metalResults: metalResults,
        halogen: lot.halogen || { f: '', cl: '', br: '' },
        ivlEff: lot.ivlEff || '', lifetime: lot.lifetime || '',
        deviceImages: Array.isArray(lot.deviceImages) ? lot.deviceImages : [],
        tgaImages: Array.isArray(lot.tgaImages) ? lot.tgaImages : [],
        dscImages: Array.isArray(lot.dscImages) ? lot.dscImages : [],
        shipments: Array.isArray(lot.shipments) ? lot.shipments : [],
        costData: lot.costData || { steps: [] }
    };
};

export const sanitizeMaterial = (mat) => {
    return {
        id: mat.id || generateId(),
        name: mat.name || 'New Material',
        year: mat.year || new Date().getFullYear(),
        stage: mat.stage || 'DEV',
        
        // [추가됨] 프로젝트 구조식 필드 (이 부분이 없으면 저장이 안 됩니다)
        structureSmiles: mat.structureSmiles || '',
        structureMol: mat.structureMol || '',
        structureSvg: mat.structureSvg || '',

        lots: Array.isArray(mat.lots) ? mat.lots.map(sanitizeLot) : [],
        thermalData: Array.isArray(mat.thermalData) ? mat.thermalData : Array(5).fill(null).map(() => ({ temp: '', hplc: '', device: '', hplcImg: null, deviceImg: null })),
        residueData: Array.isArray(mat.residueData) ? mat.residueData : [],
        impurityData: { peaks: Array.from({ length: 10 }, (_, i) => mat.impurityData?.peaks?.[i] || { id: generateId(), rt: '', rrt: '', mw: '', content: '' }) },
        methods: mat.methods || [],
        salesParams: mat.salesParams || { fixedRatio: '10' },
        specification: {
            subPurityMin: mat.specification?.subPurityMin || '99.9',
            halogen: mat.specification?.halogen || { f: '2', cl: '2', br: '2' },
            metalElements: mat.specification?.metalElements || [...STANDARD_METALS],
            metal: mat.specification?.metal || {},
            ivl: mat.specification?.ivl || { min: '97', max: '103' },
            life: mat.specification?.life || { min: '90', max: '110' },
            dsc: mat.specification?.dsc || { ref: '', range: '' }
        },
        inventory: Array.isArray(mat.inventory) ? mat.inventory : []
    };
};