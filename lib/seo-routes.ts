export type PublicPage = { path: string; title: string; description: string };

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

/** Shared canonical route registry for metadata and the XML sitemap. */
export const PUBLIC_PAGES: readonly PublicPage[] = [
  {
    "path": "/",
    "title": "PC방 매매 · 중고장터 · 구인구직",
    "description": "PC방 매매부터 중고 물품 거래, 구인구직, 사장님 커뮤니티까지. 피씨이음에서 지역별 매물과 운영 정보를 확인하세요."
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
    "description": "피씨이음의 매물 검색과 게시판 열람, 서비스 이용 및 거래 시 확인할 사항을 안내합니다. 무료 미니게임과 서비스 운영에 관한 내용도 확인하세요."
  },
  {
    "path": "/privacy",
    "title": "피씨이음 개인정보 안내",
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
    "title": "성인 PC방 팝니다 · PC방 매물 정보",
    "description": "성인 PC방 팝니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
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
    "title": "성인 PC방 삽니다 · PC방 매물 정보",
    "description": "성인 PC방 삽니다 게시글을 모아 확인하세요. 피씨이음에서 지역, 희망 가격, 좌석 수와 거래 조건을 살펴보고 매장 거래 정보를 나눌 수 있습니다."
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
