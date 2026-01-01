/**
 * 현재 접속한 URL의 서브도메인을 분석하여 업체 ID(tenantId)를 반환합니다.
 */
export const getTenantId = () => {
  const host = window.location.hostname; // 예: samsung.mat-flow.com
  const parts = host.split('.');

  // 1. 로컬 개발 환경 처리 (localhost)
  if (host === 'localhost' || host === '127.0.0.1') {
    // 개발 중에는 테스트용 업체명을 반환하거나, 
    // 로컬에서도 서브도메인 테스트를 하려면 주석을 해제하세요.
    return 'test-company'; 
  }

  // 2. 운영 환경 처리 (mat-flow.com 기반)
  //parts 예시: ['samsung', 'mat-flow', 'com'] -> length: 3
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // 'www'나 'app' 같은 일반적인 서브도메인은 업체명에서 제외
    const reservedSubdomains = ['www', 'app', 'mail', 'admin'];
    if (!reservedSubdomains.includes(subdomain.toLowerCase())) {
      return subdomain.toLowerCase();
    }
  }

  // 3. 서브도메인이 없는 경우 (메인 도메인 접속)
  return 'main';
};

/**
 * 특정 업체 정보를 가져오는 헬퍼 (로고 경로, 회사명 등)
 */
export const getTenantConfig = (tenantId) => {
  const configs = {
    'samsung': { name: 'Samsung Electronics', themeColor: '#0747a6' },
    'lg': { name: 'LG Display', themeColor: '#a50034' },
    'test-company': { name: 'Test Lab', themeColor: '#4f46e5' },
    'main': { name: 'MatFlow Official', themeColor: '#1e293b' }
  };

  return configs[tenantId] || configs['main'];
};