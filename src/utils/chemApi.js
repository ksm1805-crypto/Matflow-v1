export const identifyStructure = async (smiles) => {
    if (!smiles) return null;

    try {
        // 특수문자 처리를 위해 인코딩
        const encodedSmiles = encodeURIComponent(smiles);
        
        // 1. 기본 정보 조회 (이름, 분자식, 분자량, CID)
        const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/property/Title,MolecularFormula,MolecularWeight,IUPACName/JSON`;
        const propRes = await fetch(propUrl);
        if (!propRes.ok) throw new Error('Unknown Structure');
        
        const propData = await propRes.json();
        const props = propData.PropertyTable.Properties[0];
        const cid = props.CID; // PubChem ID

        // 2. CAS No 정밀 조회 (XRefs/RN 엔드포인트 사용)
        // Synonyms(동의어)는 데이터가 너무 커서 실패할 수 있으므로, 
        // Registry Number(RN)만 따로 조회하는 것이 훨씬 가볍고 정확합니다.
        let casNo = '';
        
        if (cid) {
            try {
                // RN(등록번호) 목록 조회
                const rnUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/xrefs/RN/JSON`;
                const rnRes = await fetch(rnUrl);
                
                if (rnRes.ok) {
                    const rnData = await rnRes.json();
                    const rns = rnData.InformationList.Information[0].RN;
                    
                    // CAS No 정규식 (숫자 2~7자리 - 숫자 2자리 - 숫자 1자리)
                    const casPattern = /^\d{2,7}-\d{2}-\d{1}$/;
                    
                    // 목록 중에서 CAS 패턴과 일치하는 첫 번째 번호 선택
                    // PubChem은 보통 가장 대표적인 CAS를 앞쪽에 배치합니다.
                    const found = rns.find(rn => casPattern.test(rn));
                    if (found) casNo = found;
                }
            } catch (e) {
                console.warn("CAS Lookup via XRefs failed, trying Synonyms fallback...");
                
                // 만약 RN 조회에 실패하면, 기존 방식(Synonyms)으로 한 번 더 시도 (백업)
                try {
                     const synUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
                     const synRes = await fetch(synUrl);
                     if(synRes.ok) {
                        const synData = await synRes.json();
                        const synonyms = synData.InformationList.Information[0].Synonyms;
                        const casPattern = /^\d{2,7}-\d{2}-\d{1}$/;
                        // 동의어 중 앞에서부터 CAS 패턴 찾기
                        const found = synonyms.find(s => casPattern.test(s));
                        if(found) casNo = found;
                     }
                } catch(synErr) {
                    console.warn("CAS Lookup completely failed");
                }
            }
        }

        return {
            name: props.Title || props.IUPACName || '',
            formula: props.MolecularFormula || '',
            mw: props.MolecularWeight || '',
            casNo: casNo || '', 
            description: `IUPAC: ${props.IUPACName || '-'}`
        };

    } catch (error) {
        console.error("Structure ID Error:", error);
        return null;
    }
};