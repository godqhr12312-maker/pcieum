export type PublicPage = { path: string; title: string; description: string; lastModified?: string };

export const ADULT_PC_LANDING_PATHS = {
  SELL: '/pc-room?type=SELL&category=ADULT',
  BUY: '/pc-room?type=BUY&category=ADULT',
} as const;

export const CATALOG_QUERY_OPTIONS = {
  "/pc-room": {
    "types": [
      "SELL",
      "BUY"
    ],
    "categories": [
      "ADULT",
      "NORMAL",
      "OTHER"
    ]
  },
  "/market": {
    "types": [
      "SELL",
      "BUY"
    ],
    "categories": [
      "PC",
      "MONITOR",
      "CHAIR",
      "OTHER"
    ]
  },
  "/job": {
    "types": [
      "HIRE",
      "RESUME"
    ],
    "categories": [
      "HIRE",
      "RESUME"
    ]
  }
} as const;

/** Metadata also covers browse filters; PUBLIC_PAGES selects search landing pages. */
export const PAGE_METADATA: readonly PublicPage[] = [
  {
    path: '/about',
    title: '피씨이음 소개 · 운영자 안내',
    description: '피씨이음의 운영자 관리자와 서비스 목적, 공개 정보글의 작성 책임 및 제공 범위를 안내합니다. 편집 기준과 정정 문의 방법도 확인하세요.',
    lastModified: '2026-11-10',
  },
  {
    path: '/editorial-policy',
    title: '피씨이음 편집 기준 · 출처 확인과 정정 정책',
    description: '피씨이음 정보글의 공식 출처 선정, 확인 날짜 표기, 사실과 점검 제안의 구분, 오류 검토와 정정 이력 관리 기준을 안내합니다.',
    lastModified: '2026-11-10',
  },
  {
    path: '/contact',
    title: '피씨이음 정정 문의 · 운영자 연락처',
    description: '피씨이음 운영자에게 정보 오류와 출처 변경을 알려주세요. 텔레그램 문의처, 정정 요청에 필요한 항목과 개인정보 최소 제공 안내를 확인할 수 있습니다.',
    lastModified: '2026-11-10',
  },
  {
    "path": "/guides",
    "title": "성인pc 정보글 · 구매·운영 확인 가이드",
    "description": "성인pc를 알아볼 때 필요한 영업 형태와 게임물 등급, 중고 PC 사양·Windows·저장장치 확인 방법을 공식 출처와 함께 살펴보세요.",
    "lastModified": "2026-11-10"
  },
  {
    "path": "/guides/adult-pc-business-and-game-check",
    "title": "성인pc 계약 전 확인할 영업 형태와 게임물 등급",
    "description": "성인pc 매장을 알아볼 때 확인할 허가·등록의 차이, 게임물 등급과 실제 내용의 대조 방법, 계약 전 준비할 자료를 현행 법령과 공식 안내로 정리했습니다.",
    "lastModified": "2026-11-10"
  },
  {
    "path": "/guides/adult-pc-used-computer-check",
    "title": "성인pc 중고 PC 인수 점검: 사양·Windows·저장장치",
    "description": "성인pc 매장이나 중고 PC 인수 전에 CPU·RAM, SSD 상태, Windows 정품 인증과 인계 조건을 확인하는 순서를 Microsoft 공식 문서에 근거해 안내합니다.",
    "lastModified": "2026-11-10"
  },
  {
    "path": "/",
    "title": "성인pc 정보·매물 찾기 | 피씨이음",
    "description": "성인pc 정보를 찾는 분을 위한 피씨이음. 성인PC방 매물과 구매 희망 정보를 살펴보고, 지역·보증금·월세·권리금·시설 조건을 비교하는 방법과 중고장터·구인구직 정보를 확인하세요."
  },
  {
    "path": "/pc-room",
    "title": "PC방 매매 · 전국 PC방 매물",
    "description": "전국 성인 PC방, 일반 PC방과 기타 업종의 판매·구매 게시글을 찾아보세요. 지역과 업종별 매물, 가격, 좌석 수와 거래 조건을 확인할 수 있습니다."
  },
  {
    "path": "/market",
    "title": "PC방 중고장터 · PC·모니터·집기 거래",
    "description": "PC, 부품, 모니터, 의자와 매장 집기를 거래하는 피씨이음 중고장터입니다. 지역별 판매·구매 글과 물품 상태, 희망 가격을 확인하세요."
  },
  {
    "path": "/job",
    "title": "PC방 구인구직 · 채용정보와 인재정보",
    "description": "PC방 직원 채용 공고와 일자리를 찾는 구직자의 정보를 만나보세요. 지역과 구인·구직 유형별로 근무 조건과 연락 방법을 확인할 수 있습니다."
  },
  {
    "path": "/board/FREE",
    "title": "PC방 사장님 자유게시판",
    "description": "PC방 사장님들의 일상과 경험, 궁금한 이야기를 나누는 자유게시판입니다. PC방 운영과 일상에 관한 다양한 이야기를 살펴보세요."
  },
  {
    "path": "/board/TIPS",
    "title": "PC방 운영 노하우 · 매장 관리 정보",
    "description": "PC방 운영과 매장 관리에 관한 경험을 나누세요. 시설 관리, PC 유지보수, 고객 응대 등 사장님들의 실무 노하우를 모으는 공간입니다."
  },
  {
    "path": "/board/NOTICE",
    "title": "피씨이음 공지사항",
    "description": "피씨이음의 서비스 이용 안내와 운영 공지를 확인하세요. 관리자가 전하는 주요 소식과 변경 사항을 모아 안내합니다."
  },
  {
    "path": "/board/NEWS",
    "title": "PC방 업계 소식 · 최신 뉴스",
    "description": "PC방과 게임 업계의 소식을 공유하는 게시판입니다. 매장 운영에 참고할 만한 뉴스와 회원들이 전하는 정보를 확인하세요."
  },
  {
    "path": "/board/GAME",
    "title": "게임 소식 · PC방 게임 이야기",
    "description": "PC방에서 즐기는 게임과 업데이트, 이용 경험을 나누는 공간입니다. PC방에서 관심을 두는 게임과 이용자들의 이야기를 살펴보세요."
  },
  {
    "path": "/board/CUSTOMER",
    "title": "피씨이음 고객센터 · 문의와 제안",
    "description": "피씨이음 서비스 이용과 고객지원에 관한 안내를 확인하는 공간입니다. 서비스에 관한 소식과 게시판의 안내 내용을 살펴보세요."
  },
  {
    "path": "/slot",
    "title": "무료 슬롯 체험 · 가상 포인트 미니게임",
    "description": "피씨이음의 무료 슬롯 미니게임으로 잠깐 쉬어 가세요. 금전적 가치가 없는 가상 포인트만 사용하며 결제, 환전, 경품 지급 기능은 없습니다."
  },
  {
    "path": "/terms",
    "title": "피씨이음 이용 안내",
    "lastModified": "2026-11-10",
    "description": "피씨이음의 매물 검색과 게시판 열람, 서비스 이용 및 거래 시 확인할 사항을 안내합니다. 무료 미니게임과 서비스 운영에 관한 내용도 확인하세요."
  },
  {
    "path": "/privacy",
    "title": "피씨이음 개인정보 안내",
    "lastModified": "2026-11-10",
    "description": "피씨이음의 공개 콘텐츠와 현재 서비스에서 제공하는 정보 입력 기능, 호스팅을 통한 서비스 제공 및 개인정보 관련 안내를 확인하세요."
  },
  {
    "path": "/pc-room?type=SELL",
    "title": "전국 PC방 팝니다 · PC방 매물 정보",
    "description": "전국 PC방 팝니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?type=BUY",
    "title": "전국 PC방 삽니다 · PC방 매물 정보",
    "description": "전국 PC방 삽니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?category=ADULT",
    "title": "성인 PC방 매매 · PC방 매물 정보",
    "description": "성인 PC방 매매 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?category=NORMAL",
    "title": "일반 PC방 매매 · PC방 매물 정보",
    "description": "일반 PC방 매매 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?category=OTHER",
    "title": "기타 업종 매매 · PC방 매물 정보",
    "description": "기타 업종 매매 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?type=SELL&category=ADULT",
    "title": "성인pc 매물·운영 정보",
    "description": "성인pc 매물을 살펴볼 때 확인할 지역, 시설, 가격 항목과 운영 정보를 안내합니다. 피씨이음에서 성인pc 판매 목록과 거래 전 확인 사항을 함께 살펴보세요."
  },
  {
    "path": "/pc-room?type=SELL&category=NORMAL",
    "title": "일반 PC방 팝니다 · PC방 매물 정보",
    "description": "일반 PC방 팝니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?type=SELL&category=OTHER",
    "title": "기타 업종 팝니다 · PC방 매물 정보",
    "description": "기타 업종 팝니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?type=BUY&category=ADULT",
    "title": "성인pc 구합니다·인수 준비",
    "description": "성인pc를 찾는 분을 위한 인수 준비 정보를 안내합니다. 희망 지역과 예산, 시설과 거래 조건을 정리하고 피씨이음의 성인pc 구매 희망 목록을 살펴보세요."
  },
  {
    "path": "/pc-room?type=BUY&category=NORMAL",
    "title": "일반 PC방 삽니다 · PC방 매물 정보",
    "description": "일반 PC방 삽니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/pc-room?type=BUY&category=OTHER",
    "title": "기타 업종 삽니다 · PC방 매물 정보",
    "description": "기타 업종 삽니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
  },
  {
    "path": "/market?type=SELL",
    "title": "PC방 중고 물품 판매 · PC방 중고장터",
    "description": "PC방 중고 물품 판매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=BUY",
    "title": "PC방 중고 물품 구매 · PC방 중고장터",
    "description": "PC방 중고 물품 구매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?category=PC",
    "title": "PC·부품 거래 · PC방 중고장터",
    "description": "PC·부품 거래 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?category=MONITOR",
    "title": "모니터 거래 · PC방 중고장터",
    "description": "모니터 거래 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?category=CHAIR",
    "title": "의자·집기 거래 · PC방 중고장터",
    "description": "의자·집기 거래 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?category=OTHER",
    "title": "기타 PC방 용품 거래 · PC방 중고장터",
    "description": "기타 PC방 용품 거래 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=SELL&category=PC",
    "title": "PC·부품 판매 · PC방 중고장터",
    "description": "PC·부품 판매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=SELL&category=MONITOR",
    "title": "모니터 판매 · PC방 중고장터",
    "description": "모니터 판매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=SELL&category=CHAIR",
    "title": "의자·집기 판매 · PC방 중고장터",
    "description": "의자·집기 판매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=SELL&category=OTHER",
    "title": "기타 PC방 용품 판매 · PC방 중고장터",
    "description": "기타 PC방 용품 판매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=BUY&category=PC",
    "title": "PC·부품 구매 · PC방 중고장터",
    "description": "PC·부품 구매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=BUY&category=MONITOR",
    "title": "모니터 구매 · PC방 중고장터",
    "description": "모니터 구매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=BUY&category=CHAIR",
    "title": "의자·집기 구매 · PC방 중고장터",
    "description": "의자·집기 구매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/market?type=BUY&category=OTHER",
    "title": "기타 PC방 용품 구매 · PC방 중고장터",
    "description": "기타 PC방 용품 구매 게시글을 확인하세요. 피씨이음 중고장터에서 지역별 물품 상태와 희망 가격, 거래 조건 및 연락 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/job?type=HIRE",
    "title": "PC방 직원 채용 · 구인 공고",
    "description": "전국 PC방의 직원 채용 공고를 확인하세요. 피씨이음에서 지역별 담당 업무, 근무 시간, 급여 조건과 지원 방법을 살펴볼 수 있습니다."
  },
  {
    "path": "/job?type=RESUME",
    "title": "PC방 구직 · 일자리 찾는 인재정보",
    "description": "PC방 일자리를 찾는 구직자의 게시글을 확인하세요. 희망 근무 지역과 업무 경험을 나누고 매장에 필요한 인재를 만나보세요."
  }
];

// Content revision, not build/request time. Update only when these pages change.
export const PUBLIC_PAGES: readonly PublicPage[] = PAGE_METADATA
  .filter(page => !page.path.includes('?') || Object.values(ADULT_PC_LANDING_PATHS).some(path => page.path === path))
  .map(page => ({ ...page, lastModified: page.lastModified || (page.path === '/' || Object.values(ADULT_PC_LANDING_PATHS).some(path => page.path === path) ? '2026-11-10' : '2026-11-04') }));

export const FILTER_PAGES = PAGE_METADATA.filter(page => page.path.includes('?') && !PUBLIC_PAGES.some(publicPage => publicPage.path === page.path));
