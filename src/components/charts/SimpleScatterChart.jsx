import React, { useMemo } from 'react';

export const SimpleScatterChart = ({ data, xKey, xLabel, yLabel, width = 600, height = 400 }) => {
    // 1. 데이터가 없으면 표시 안 함
    if (!data || data.length === 0) return <div className="flex h-full items-center justify-center text-slate-400">No Data</div>;

    // 2. [핵심 수정] 유효한 숫자 데이터만 필터링 (NaN, Infinity 방지)
    const validData = data.filter(d => {
        const x = parseFloat(d[xKey]);
        const y = parseFloat(d.lifetime);
        return !isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y);
    });

    if (validData.length === 0) return <div className="flex h-full items-center justify-center text-slate-400">Invalid Data</div>;

    const xValues = validData.map(d => d[xKey]);
    const yValues = validData.map(d => d.lifetime);
    
    // 3. 범위 계산 (모든 값이 같을 때를 대비한 안전장치)
    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    if (xMin === xMax) { xMin -= 1; xMax += 1; } // 강제로 범위 벌림
    xMin *= 0.95; xMax *= 1.05;

    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    yMin *= 0.95; yMax *= 1.05;
    if (yMax < 100) yMax = 105; // 기본 상한 보정

    const padding = 40;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const getX = (val) => padding + ((val - xMin) / xRange) * plotW;
    const getY = (val) => height - padding - ((val - yMin) / yRange) * plotH;

    // 4. 선형 회귀(Linear Regression) 계산 (분모 0 방지)
    const n = validData.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = validData.reduce((a, b) => a + (b[xKey] * b.lifetime), 0);
    const sumXX = validData.reduce((a, b) => a + (b[xKey] * b[xKey]), 0);
    
    const slopeDenom = (n * sumXX - sumX * sumX);
    const slope = slopeDenom === 0 ? 0 : (n * sumXY - sumX * sumY) / slopeDenom;
    const intercept = n === 0 ? 0 : (sumY - slope * sumX) / n;

    const x1 = xMin;
    const y1_line = slope * x1 + intercept;
    const x2 = xMax;
    const y2_line = slope * x2 + intercept;

    const machineErrorUpper = getY(103);
    const machineErrorLower = getY(97);

    const clipId = useMemo(() => "chart-clip-" + Math.random().toString(36).substr(2, 9), []);

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
                <clipPath id={clipId}>
                    <rect x={padding} y={padding} width={plotW} height={plotH} />
                </clipPath>
            </defs>

            {/* 축 그리기 */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#cbd5e1" strokeWidth="1" />
            
            <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="bold">{xLabel}</text>
            <text x={10} y={height / 2} textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="bold" transform={`rotate(-90, 10, ${height/2})`}>{yLabel} (%)</text>

            <g clipPath={`url(#${clipId})`}>
                {/* 에러 범위 박스 */}
                {yMax >= 103 && yMin <= 97 && (
                    <rect x={padding} y={machineErrorUpper} width={plotW} height={Math.abs(machineErrorLower - machineErrorUpper)} fill="#e2e8f0" opacity="0.5" />
                )}
                {/* 추세선 */}
                {!isNaN(slope) && slope !== 0 && (
                    <line x1={getX(x1)} y1={getY(y1_line)} x2={getX(x2)} y2={getY(y2_line)} stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" opacity="0.6"/>
                )}
            </g>

            {yMax >= 103 && yMin <= 97 && (
                <text x={width-padding-10} y={machineErrorUpper + 15} textAnchor="end" fontSize="10" fill="#94a3b8">Machine Error Range (±3%)</text>
            )}

            {/* 데이터 포인트 */}
            {validData.map((d, i) => {
                const cx = getX(d[xKey]);
                const cy = getY(d.lifetime);
                // 좌표 유효성 재확인
                if (!isFinite(cx) || !isFinite(cy)) return null;

                const isErrorRange = d.lifetime >= 97 && d.lifetime <= 103;
                
                // 그래프 영역 밖으로 나가는 점 숨김
                if (cx < padding || cx > width - padding || cy < padding || cy > height - padding) return null;

                return (
                    <g key={i} className="group/scatter">
                        <circle cx={cx} cy={cy} r={isErrorRange ? 4 : 5} fill={isErrorRange ? "#94a3b8" : "#3b82f6"} stroke="white" strokeWidth="1.5" className="hover:scale-150 transition cursor-pointer" />
                        <title>{`${d.name}\n${xLabel}: ${d[xKey]}\nLife: ${d.lifetime}%`}</title>
                    </g>
                );
            })}
        </svg>
    );
};