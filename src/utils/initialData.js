/**
 * src/utils/initialData.js
 * 앱 초기화(Load Demo) 시 사용할 실제 데모 데이터입니다.
 */

export const EXAMPLE_LOTS = [
    { 
        id: 'lot_ex_1', 
        name: 'GH_unknown_Ref_Lot', 
        synDateStart: '2025-11-01', 
        synDateEnd: '2025-11-07', 
        synSite: 'Lab A', 
        subSite: 'Lab A',
        synYield: '92.5', 
        subYield: '96.0', 
        hplcSyn: '99.50', 
        hplcSub: '99.95', 
        unitCost: '10500', 
        actualOutput: '950.0', 
        isMix: false, 
        hplcMethodVersion: 'v1.0',
        mainPeakRt: '12.5', 
        hplcGrid: [
            ['Parameter', 'Peak 1', 'Peak 2', 'Peak 3 (Killer)'], 
            ['RT', '10.5', '12.5', '14.0'], 
            ['RRT', '0.84', '1.00', '1.12'], 
            ['Content (%)', '0.03', '99.95', '0.02']
        ], 
        metalResults: {Fe:'1', Na:'0', K:'0', Ca:'0', Cr:'0', Ni:'0', Mg:'0', Cu:'0'}, 
        halogen: { f: '1', cl: '1', br: '0' }, 
        ivlEff: '100', 
        lifetime: '100', 
        shipments: [
            { id: 'ship_1', date: '2025-12-01', customer: 'Samsung Display', purpose: 'MP Qualification', amount: '200', unitPrice: '25000' },
            { id: 'ship_2', date: '2025-12-15', customer: 'LG Display', purpose: 'Sampling', amount: '100', unitPrice: '28000' }
        ],
        costData: { 
            price: 0, 
            fixedCost: 500000, 
            targetMw: 650.5, 
            processCostPerDay: 600000, 
            processDays: 3, 
            subYield1: 96, 
            subYield2: 98, 
            theoreticalOutput: 1500, 
            varCostPerG: 100, 
            steps: [{ id: 's1', name: 'Suzuki Coupling', yield: 92, materials: [{ id: 'm1', name: 'Core A', mw: 320.5, price: 3000, eq: 1.0, mol: 2.30 }] }] 
        } 
    },
    { 
        id: 'lot_ex_2', 
        name: 'GH_unknown_Bad_Lot', 
        synDateStart: '2025-11-10', 
        synDateEnd: '2025-11-15', 
        synSite: 'Lab B', 
        subSite: 'Lab B',
        synYield: '92.0', 
        subYield: '96.0', 
        hplcSyn: '99.10', 
        hplcSub: '99.85', 
        unitCost: '13200', 
        actualOutput: '1100.0', 
        isMix: false, 
        hplcMethodVersion: 'v1.0',
        mainPeakRt: '12.5',
        hplcGrid: [
            ['Parameter', 'Peak 1', 'Peak 2', 'Peak 3 (Killer)'], 
            ['RT', '10.5', '12.5', '14.0'], 
            ['RRT', '0.84', '1.00', '1.12'], 
            ['Content (%)', '0.05', '99.50', '0.45']
        ], 
        metalResults: {Fe:'2', Na:'1', K:'0', Ca:'0', Cr:'0', Ni:'0', Mg:'0', Cu:'0'}, 
        halogen: { f: '2', cl: '1', br: '0' }, 
        ivlEff: '98', 
        lifetime: '55', 
        shipments: [], 
        costData: { 
            price: 0, 
            fixedCost: 500000, 
            targetMw: 650.5, 
            processCostPerDay: 800000, 
            processDays: 3, 
            subYield1: 95, 
            subYield2: 97, 
            theoreticalOutput: 1500, 
            varCostPerG: 200, 
            steps: [{ id: 's1', name: 'Suzuki Coupling', yield: 92, materials: [{ id: 'm1', name: 'Core A', mw: 320.5, price: 5000, eq: 1.0, mol: 2.30 }] }] 
        } 
    },
    { 
        id: 'lot_ex_3', 
        name: 'GH_unknown_Mid_Lot', 
        synDateStart: '2025-11-15', 
        synDateEnd: '2025-11-20', 
        synSite: 'Factory', 
        subSite: 'Factory',
        synYield: '95.0', 
        subYield: '97.0', 
        hplcSyn: '99.30', 
        hplcSub: '99.90', 
        unitCost: '8500', 
        actualOutput: '2500.0', 
        isMix: false, 
        hplcMethodVersion: 'v1.0',
        mainPeakRt: '12.5', 
        hplcGrid: [
            ['Parameter', 'Peak 1', 'Peak 2', 'Peak 3 (Killer)'], 
            ['RT', '10.5', '12.5', '14.0'], 
            ['RRT', '0.84', '1.00', '1.12'], 
            ['Content (%)', '0.04', '99.74', '0.22']
        ], 
        metalResults: {Fe:'1', Na:'0', K:'0', Ca:'0', Cr:'0', Ni:'0', Mg:'0', Cu:'0'}, 
        halogen: { f: '0', cl: '2', br: '0' }, 
        ivlEff: '102', 
        lifetime: '80', 
        shipments: [
            { id: 'ship_3', date: '2025-12-20', customer: 'BOE', purpose: 'Mass Prod (Batch 1)', amount: '1000', unitPrice: '22000' },
            { id: 'ship_4', date: '2025-12-25', customer: 'CSOT', purpose: 'Mass Prod (Batch 2)', amount: '800', unitPrice: '21500' }
        ],
        costData: { 
            price: 0, 
            fixedCost: 1000000, 
            targetMw: 650.5, 
            processCostPerDay: 900000, 
            processDays: 5, 
            subYield1: 95, 
            subYield2: 97, 
            theoreticalOutput: 3000, 
            varCostPerG: 80, 
            steps: [{ id: 's1', name: 'Mass Production', yield: 95, materials: [{ id: 'm1', name: 'Core A', mw: 320.5, price: 2500, eq: 1.0, mol: 5.0 }] }] 
        } 
    },
    { 
        id: 'lot_ex_4', 
        name: 'GH_unknown_Impruved', 
        synDateStart: '2025-11-25', 
        synDateEnd: '2025-11-30', 
        synSite: 'Lab A', 
        subSite: 'Lab A',
        synYield: '88.0', 
        subYield: '94.0', 
        hplcSyn: '99.40', 
        hplcSub: '99.92', 
        unitCost: '12500', 
        actualOutput: '800.0', 
        isMix: false, 
        hplcMethodVersion: 'v1.1',
        mainPeakRt: '12.5', 
        hplcGrid: [
            ['Parameter', 'Peak 1', 'Peak 2', 'Peak 3 (Killer)'], 
            ['RT', '10.5', '12.5', '14.0'], 
            ['RRT', '0.84', '1.00', '1.12'], 
            ['Content (%)', '0.03', '99.92', '0.05']
        ], 
        metalResults: {Fe:'0', Na:'0', K:'0', Ca:'0', Cr:'0', Ni:'0', Mg:'0', Cu:'0'}, 
        halogen: { f: '1', cl: '1', br: '0' }, 
        ivlEff: '101', 
        lifetime: '98', 
        shipments: [
            { id: 'ship_5', date: '2025-12-28', customer: 'Samsung Display', purpose: 'Improved Sample', amount: '50', unitPrice: '35000' }
        ],
        costData: { 
            price: 0, 
            fixedCost: 500000, 
            targetMw: 650.5, 
            processCostPerDay: 500000, 
            processDays: 2, 
            subYield1: 88, 
            subYield2: 94, 
            theoreticalOutput: 1000, 
            varCostPerG: 150, 
            steps: [{ id: 's1', name: 'Recrystallization x2', yield: 88, materials: [{ id: 'm1', name: 'Core A', mw: 320.5, price: 4000, eq: 1.0, mol: 1.5 }] }] 
        } 
    }
];

export const EXAMPLE_INVENTORY = [];

export const DEFAULT_USERS = [
    { id: 'u1', username: 'admin', password: '123', name: 'Chief Manager', roleId: 'ADMIN', status: 'APPROVED', managerRole: 'SYN_MANAGER' },
    { id: 'u2', username: 'lab', password: '123', name: 'Senior Researcher', roleId: 'RESEARCHER', status: 'APPROVED', managerRole: 'ANA_MANAGER' },
    { id: 'u3', username: 'guest', password: '123', name: 'Visitor', roleId: 'GUEST', status: 'APPROVED', managerRole: 'NONE' }
];

export const INITIAL_GLOBAL_INVENTORY = [
    { id: 'ginv_1', fullname: 'Bis(4-biphenyl)amine', manufacturer: 'Alpha Chem', lotNo: 'AC-2025-001', totalQty: '1000', currentStock: '1000', unitPrice: '5000', receiveDate: '2025-01-01', location: 'Cabinet A', structureImg: null }
];