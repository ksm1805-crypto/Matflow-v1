import React from 'react';
import { Icon } from './Icon';

export const FileUploader = ({
  files = [],
  setFiles,
  label,
  readOnly,
  hideList = false,
  accept = ".pdf,.jpg,.jpeg,.png"
}) => {

  const isHttpUrl = (s) => /^https?:\/\//i.test(String(s || ''));
  const isDataUrl = (s) => /^data:/i.test(String(s || ''));

  // ✅ string URL / object(data,url,src) / File 다 대응
  const getUrl = (f) => {
    if (!f) return '';
    if (typeof f === 'string') return f;
    if (f instanceof File) return '';
    return f.data || f.url || f.src || '';
  };

  // ✅ URL에서 파일명 추출(파이어베이스 포함)
  const getNameFromUrl = (url) => {
    try {
      if (!url) return 'Untitled';
      const decoded = decodeURIComponent(url);

      // firebase: .../o/uploads%2F<filename>.pdf?alt=media&token=...
      const m = decoded.match(/\/o\/([^?]+)/);
      const pathPart = m ? m[1] : decoded.split('?')[0];
      const base = (pathPart.split('/').pop() || '').trim();

      // "timestamp_filename.pdf" 형태면 timestamp 제거
      const parts = base.split('_');
      const noTs = (parts.length > 1 ? parts.slice(1).join('_') : base) || base;

      return noTs || base || 'Untitled';
    } catch {
      return 'Untitled';
    }
  };

  const getFileName = (f) => {
    if (!f) return 'Untitled';
    if (f instanceof File) return f.name;

    const url = getUrl(f);
    if (url) return getNameFromUrl(url);

    // object인데 url이 없으면 name이라도
    return f.name || f.originalName || 'Stored File';
  };

  const handleUpload = (e) => {
    if (readOnly) return;
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFiles([...files, newFile]); // File 객체 유지
      e.target.value = ''; // 같은 파일 재업로드 가능하게
    }
  };

  const openFile = (f) => {
    const url = getUrl(f);
    if (!url) return;

    // ✅ URL이면 그냥 새탭으로 열기 (Firebase Storage 포함)
    if (isHttpUrl(url) || isDataUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // ✅ 혹시 base64 “순수 문자열”이 들어오는 케이스 대비:
    // (원래는 data:application/pdf;base64, 로 저장하는게 정석)
    // 여기서는 안전하게 data URL로 만들어서 열어준다.
    const name = getFileName(f).toLowerCase();
    const isPdf = name.endsWith('.pdf');

    if (isPdf) {
      const dataUrl = url.startsWith('data:') ? url : `data:application/pdf;base64,${url}`;
      window.open(dataUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 그 외는 그대로 열어봄
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`mt-2 p-3 border border-dashed rounded-lg bg-slate-50 flex flex-col min-h-[100px] ${readOnly ? 'opacity-60' : 'hover:bg-slate-100'} transition`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-slate-500 flex gap-2 items-center uppercase">
          <Icon name="paperclip" size={14} /> {label}
        </span>

        {!readOnly && (
          <label className="cursor-pointer bg-white border px-3 py-1 rounded text-[11px] font-bold text-brand-600 hover:bg-brand-50 shadow-sm transition active:scale-95">
            UPLOAD FILE
            <input type="file" className="hidden" accept={accept} onChange={handleUpload} />
          </label>
        )}
      </div>

      {!hideList && (
        <div className="space-y-1 overflow-y-auto max-h-40 custom-scrollbar">
          {files.map((f, i) => {
            const url = getUrl(f);
            const name = getFileName(f);
            const isReadyLink = !!url;

            return (
              <div key={i} className="flex items-center justify-between bg-white border p-2 rounded shadow-sm text-xs group">
                {isReadyLink ? (
                  <button
                    type="button"
                    onClick={() => openFile(f)}
                    className="flex-1 truncate text-blue-600 font-bold hover:underline cursor-pointer text-left"
                    title={name}
                  >
                    {name}
                  </button>
                ) : (
                  <span className="flex-1 truncate text-slate-400 italic" title={name}>
                    ⏳ {name} (Click Save to Upload)
                  </span>
                )}

                {!readOnly && (
                  <button
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1"
                    type="button"
                    title="Remove"
                  >
                    <Icon name="trash-2" size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
