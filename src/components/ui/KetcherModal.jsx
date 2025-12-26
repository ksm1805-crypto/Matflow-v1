import React, { useRef, useState, useEffect } from 'react';
import { Icon } from './Icon';
// [추가] 방금 만든 API 함수 import
import { identifyStructure } from '../../utils/chemApi';

export const KetcherModal = ({ isOpen, onClose, onSave, initialSmiles }) => {
    const iframeRef = useRef(null);
    const [isKetcherReady, setIsKetcherReady] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false); // [추가] 로딩 상태

    // ... (useEffect: Ketcher 로딩 체크 로직은 기존과 동일) ...
    useEffect(() => {
        if (!isOpen) return;
        let checkInterval;
        const initKetcher = () => {
            const ketcher = iframeRef.current?.contentWindow?.ketcher;
            if (ketcher && typeof ketcher.setMolecule === 'function') {
                setIsKetcherReady(true);
                clearInterval(checkInterval);
                if (initialSmiles) {
                    ketcher.setMolecule(initialSmiles).catch(e => console.error(e));
                }
            }
        };
        checkInterval = setInterval(initKetcher, 100);
        const timeout = setTimeout(() => clearInterval(checkInterval), 5000);
        return () => { clearInterval(checkInterval); clearTimeout(timeout); };
    }, [isOpen, initialSmiles]);


    const handleSave = async () => {
        const ketcher = iframeRef.current?.contentWindow?.ketcher;
        if (!ketcher) return;

        setIsIdentifying(true); // 로딩 시작

        try {
            const smiles = await ketcher.getSmiles();
            const molfile = await ketcher.getMolfile();

            let svg = '';
            try {
                if (ketcher.generateImage) {
                     const blob = await ketcher.generateImage(smiles, { outputFormat: 'svg' });
                     svg = await blob.text();
                } 
            } catch (imgErr) { console.warn(imgErr); }

            // [핵심 추가] PubChem에서 정보 조회 (오프라인이면 null 반환됨)
            let identifiedInfo = null;
            if (navigator.onLine) { // 인터넷 연결되어 있을 때만 시도
                identifiedInfo = await identifyStructure(smiles);
            }

            // 부모에게 구조 + 식별된 정보(identifiedInfo) 함께 전달
            onSave(smiles, molfile, svg, identifiedInfo); 
            onClose();

        } catch (e) {
            alert("Error: " + e);
        } finally {
            setIsIdentifying(false); // 로딩 끝
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-[90%] h-[90%] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Icon name="edit-3" /> Structure Editor
                        {/* 로딩 표시 */}
                        {isIdentifying && <span className="text-xs text-brand-600 animate-pulse flex items-center gap-1"><Icon name="loader" className="animate-spin" size={12}/> Identifying Structure...</span>}
                    </h3>
                    <button onClick={onClose} disabled={isIdentifying} className="p-2 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full transition">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <div className="flex-1 relative bg-white">
                    <iframe ref={iframeRef} src="/ketcher/index.html" className="w-full h-full border-none" title="Ketcher Editor" />
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                    <button onClick={onClose} disabled={isIdentifying} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!isKetcherReady || isIdentifying} // 로딩 중 버튼 비활성화
                        className="px-5 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg transition flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isIdentifying ? 'Analyzing...' : <><Icon name="check" /> Save & Identify</>}
                    </button>
                </div>
            </div>
        </div>
    );
};