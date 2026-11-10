/** Public identity and contact details explicitly provided by the site owner. */
export const PUBLIC_OPERATOR_NAME = '관리자';
export const PUBLIC_CONTACT_EMAIL: string | null = null;
export const PUBLIC_CONTACT_URL: string | null = 'https://t.me/pcem';
export const PUBLIC_CONTACT_LABEL = '텔레그램 @pcem';
export const SITE_INFORMATION_UPDATED_AT = '2026-11-10';

export const SITE_INFORMATION_PAGES = {
  about: {
    path: '/about',
    title: '피씨이음 소개 · 운영자 안내',
    description: '피씨이음의 운영자 관리자와 서비스 목적, 공개 정보글의 작성 책임 및 제공 범위를 안내합니다. 편집 기준과 정정 문의 방법도 확인하세요.',
  },
  editorial: {
    path: '/editorial-policy',
    title: '피씨이음 편집 기준 · 출처 확인과 정정 정책',
    description: '피씨이음 정보글의 공식 출처 선정, 확인 날짜 표기, 사실과 점검 제안의 구분, 오류 검토와 정정 이력 관리 기준을 안내합니다.',
  },
  contact: {
    path: '/contact',
    title: '피씨이음 정정 문의 · 운영자 연락처',
    description: '피씨이음 운영자에게 정보 오류와 출처 변경을 알려주세요. 텔레그램 문의처, 정정 요청에 필요한 항목과 개인정보 최소 제공 안내를 확인할 수 있습니다.',
  },
} as const;

export const CORRECTION_REQUEST_TEMPLATE = [
  '문의 유형: 정보 정정 / 서비스 문의',
  '대상 페이지 주소:',
  '확인이 필요한 문장 또는 항목:',
  '올바르다고 판단한 내용:',
  '확인 근거 (공식 자료 주소·문서명·확인 날짜):',
  '답변받을 연락처 (필요한 경우):',
].join('\n');

export function correctionEmailHref() {
  if (!PUBLIC_CONTACT_EMAIL) return null;
  return `mailto:${PUBLIC_CONTACT_EMAIL}?subject=${encodeURIComponent('[피씨이음] 정보 정정·운영 문의')}&body=${encodeURIComponent(CORRECTION_REQUEST_TEMPLATE)}`;
}
