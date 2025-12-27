// src/utils/chemApi.js
import { getRDKit } from './rdkit';

// CAS 번호 정규식 (이게 있어야 CAS 번호만 걸러냅니다)
const CAS_RE = /^\d{2,7}-\d{2}-\d{1}$/;

// =========================
// 공통 유틸
// =========================
const fetchWithRetry = async (url, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (res.status === 429) { // Too Many Requests
        await new Promise(r => setTimeout(r, 800));
        continue;
      }
    } catch (e) {}
  }
  return fetch(url);
};

const safeTrim = (s) => (typeof s === 'string' ? s.trim() : '');

// CAS 후보군 추출 및 정렬 함수 (이게 빠져서 선택창이 안 떴음)
const extractAllCas = (list) => {
  if (!Array.isArray(list)) return [];
  const candidates = list.filter(item => CAS_RE.test(safeTrim(String(item))));
  const unique = [...new Set(candidates)];
  
  // 길이 짧은 순 -> 알파벳 순 정렬
  unique.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });
  
  return unique;
};

// RDKit 로컬 계산 유틸
const getLocalMolInfo = (mol) => {
  try {
    const formula = mol.get_mol_formula ? mol.get_mol_formula() : '';
    const mw = mol.get_molecular_weight ? mol.get_molecular_weight().toFixed(2) : '';
    return { formula, mw };
  } catch (e) {
    return { formula: '', mw: '' };
  }
};

// =========================
// 구조(SMILES) → 정보 식별 (CAS 후보군 수집 포함)
// =========================
export const identifyStructure = async (smiles, extraInfo = {}) => {
  if (!smiles) return null;

  let rdkit;
  try { rdkit = await getRDKit(); } catch (e) {}

  // 1. RDKit 유효성 검사
  let queryMol = null;
  try {
    if (rdkit) queryMol = rdkit.get_mol(smiles);
  } catch (e) {
    console.warn('Invalid SMILES:', smiles);
    return null;
  }

  // 기본 로컬 정보 계산
  const localInfo = queryMol ? getLocalMolInfo(queryMol) : { formula: '', mw: '' };
  
  // 2. PubChem API로 상세 정보 및 CAS 후보군 조회
  try {
    const encoded = encodeURIComponent(safeTrim(smiles));
    const cidsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/cids/JSON`;
    const cidsRes = await fetchWithRetry(cidsUrl);
    
    if (cidsRes.ok) {
      const cidsData = await cidsRes.json();
      const cids = cidsData?.IdentifierList?.CID || [];
      
      if (cids.length > 0) {
        const cid = cids[0]; // 가장 정확한 CID 하나만 사용

        // 2-1. 기본 물성 정보 (이름, 분자량 등)
        const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/Title,MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`;
        const propRes = await fetchWithRetry(propUrl);
        let props = {};
        
        if (propRes.ok) {
          const propData = await propRes.json();
          props = propData?.PropertyTable?.Properties?.[0] || {};
        }

        // 2-2. [복구됨] CAS 후보군 수집 (Synonyms + RN)
        // 이 부분이 있어야 UI에서 선택창을 띄울 수 있습니다.
        let candidates = [];
        
        // (A) Synonyms에서 CAS 찾기
        try {
            const synUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
            const synRes = await fetchWithRetry(synUrl);
            if (synRes.ok) {
                const synData = await synRes.json();
                candidates = candidates.concat(synData?.InformationList?.Information?.[0]?.Synonyms || []);
            }
        } catch(e) {}

        // (B) RN(Registry Number)에서 CAS 찾기
        try {
            const rnUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/xrefs/RN/JSON`;
            const rnRes = await fetchWithRetry(rnUrl);
            if (rnRes.ok) {
                const rnData = await rnRes.json();
                candidates = candidates.concat(rnData?.InformationList?.Information?.[0]?.RN || []);
            }
        } catch(e) {}

        const sortedCandidates = extractAllCas(candidates);

        if (queryMol) queryMol.delete();

        // 결과 반환 (casCandidates 포함)
        return {
          smiles: props.CanonicalSMILES || smiles,
          name: props.Title || props.IUPACName || 'Unknown Name',
          formula: props.MolecularFormula || localInfo.formula,
          mw: props.MolecularWeight || localInfo.mw,
          casNo: sortedCandidates[0] || '', // 가장 유력한 것 1개
          casCandidates: sortedCandidates,  // [중요] 선택창을 위한 전체 목록
          description: `Source: PubChem (CID: ${cid})`,
        };
      }
    }
  } catch (e) {
    console.warn('PubChem identification failed, using local fallback:', e);
  }

  // 3. API 실패 시 로컬 정보 반환
  if (queryMol) queryMol.delete();

  return {
    smiles: smiles,
    name: 'Unknown Compound',
    formula: localInfo.formula,
    mw: localInfo.mw,
    casNo: '',
    casCandidates: [],
    description: 'Calculated locally',
  };
};