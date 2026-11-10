export type GuideArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  lead: string[];
  sections: { id: string; title: string; paragraphs: string[]; points?: string[]; sourceIds?: string[] }[];
  checklist: string[];
  sources: { id: string; title: string; organization: string; url: string; note?: string }[];
  scopeNote: string;
};

export const guidePath = (slug: string) => '/guides/' + slug;

export const GUIDE_ARTICLES: readonly GuideArticle[] = [
  {
    slug: 'adult-pc-business-and-game-check',
    title: '성인pc 계약 전 확인할 영업 형태와 게임물 등급',
    description: '성인pc 매장을 알아볼 때 확인할 허가·등록의 차이, 게임물 등급과 실제 내용의 대조 방법, 계약 전 준비할 자료를 현행 법령과 공식 안내로 정리했습니다.',
    category: '영업·게임물 확인',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    lead: [
      '성인pc 매물 설명에서 먼저 확인할 것은 해당 장소의 영업 형태와 제공하는 게임입니다. 간판이나 광고에 쓰인 명칭만으로 필요한 허가·등록이나 게임의 적법성을 판단하기 어렵습니다.',
      '이 글은 국가법령정보센터와 법제처의 안내를 바탕으로, 계약을 검토하는 사람이 확인할 자료를 정리한 정보글입니다. 아래 확인 순서와 메모 항목은 피씨이음이 제안하는 점검 방법입니다.',
    ],
    sections: [
      {
        id: 'business-type', title: '1. 간판 이름보다 허가·등록증의 업종을 확인하세요',
        paragraphs: [
          '법령은 일반게임제공업과 인터넷컴퓨터게임시설제공업을 구분합니다. 게임산업법 제26조에 따르면 일반게임제공업에는 관할 지자체의 허가가, 인터넷컴퓨터게임시설제공업에는 시설 요건을 갖춘 등록이 요구됩니다. 두 절차를 같은 것으로 취급하면 안 됩니다.',
          '따라서 매물명에 성인PC가 적혀 있다는 이유로 업종을 정하지 말고, 제시된 허가·등록증의 업종명과 실제 영업 내용을 함께 확인하세요. 해당 주소에서 계획한 방식으로 영업할 수 있는지는 관할 시·군·구 담당 부서에 구체적인 자료를 제시해 확인하는 것이 좋습니다.',
        ],
        points: ['확인 메모: 영업소 주소, 서류에 적힌 업종, 허가·등록 번호, 확인 날짜', '관할 부서에 물을 내용: 실제 제공할 게임과 설비에 필요한 절차, 인수 시 확인할 서류'],
        sourceIds: ['business-guide', 'law26'],
      },
      {
        id: 'game-identity', title: '2. 게임명과 등급분류 자료를 함께 대조하세요',
        paragraphs: [
          '게임물관리위원회가 공공데이터포털에 제공하는 게임 정보에는 게임명 외에 등급분류번호, 신청업체, 결정등급, 플랫폼, 등급분류 취소 여부 등이 포함됩니다. 이름이 비슷한 게임을 혼동하지 않도록 여러 항목을 함께 대조하는 방식이 유용합니다.',
          '판매자에게 게임의 정확한 이름과 공급 주체, 등급분류 근거를 요청하고, 확인한 자료의 날짜를 남겨 두세요. 공공데이터 안내는 조회 항목을 설명하는 출처이며, 이 글에서 특정 게임의 등급이나 상태를 확인해 보증한 것은 아닙니다.',
          '등급분류에는 법정 예외와 자체등급분류 등의 체계도 있습니다. 한 곳의 검색에서 결과가 나오지 않았다는 이유만으로 결론을 내리지 말고, 해당 게임에 적용되는 분류 근거와 담당 기관을 추가 확인하세요.',
        ],
        sourceIds: ['game-data', 'rating-guide'],
      },
      {
        id: 'installed-content', title: '3. 등급번호와 설치된 게임 내용이 맞는지 확인하세요',
        paragraphs: [
          '게임산업법 제32조는 등급 대상 게임물을 필요한 등급 없이 제공하는 행위, 심사받은 내용과 다른 게임을 제공하는 행위, 이용등급을 어겨 제공하는 행위 등을 금지합니다. 등급번호를 제시받았다는 사실만으로 설치된 프로그램의 내용까지 확인된 것은 아닙니다.',
          '현장에서 확인한 게임명·버전·화면과 공급자가 설명한 자료가 다르면 그 차이를 기록하세요. 내용 변경의 처리 여부가 불명확할 때는 공급자에게 관련 근거를 요청하고 담당 기관에 문의할 자료로 정리합니다.',
        ],
        sourceIds: ['law32'],
      },
      {
        id: 'exchange', title: '4. 환전이 포함된 설명은 별도로 확인해야 합니다',
        paragraphs: [
          '게임산업법 제32조제1항제7호는 법령에서 정한 게임 결과물의 환전·환전 알선·재매입을 업으로 하는 행위를 금지합니다. 제28조는 사업자가 게임을 통한 도박이나 사행행위를 하도록 하거나 이를 방치하지 않도록 규정합니다.',
          '청소년이용불가 등급이나 영업 관련 서류가 있다는 설명이 환전까지 허용한다는 뜻은 아닙니다. 매물 설명에 환전 또는 결과물 재매입이 수익 구조로 제시되면, 그 내용을 일반적인 시설 인계와 구분해 기록하고 계약 전에 관할 기관 또는 변호사에게 검토받으세요.',
        ],
        sourceIds: ['law32', 'law28'],
      },
      {
        id: 'record', title: '5. 설명·직접 확인·미확인을 나눠 기록하세요',
        paragraphs: [
          '비교표에 항목, 판매자의 설명, 확인한 자료, 확인 날짜, 남은 질문을 각각 적어 보세요. 자료를 받았다는 사실과 자료의 내용이 현재 매장과 일치한다는 판단을 분리하면, 계약 전에 다시 물어볼 내용이 선명해집니다.',
          '예를 들어 허가·등록증을 보았더라도 주소와 업종을 대조하지 않았다면 해당 칸은 미확인으로 남깁니다. 게임물 자료 역시 등급분류 근거 확인과 실제 설치 내용 확인을 별도 항목으로 두세요.',
        ],
      },
    ],
    checklist: [
      '허가·등록증의 업종명과 영업소 주소를 대조했나요?',
      '게임명, 공급 주체, 플랫폼과 등급분류 근거를 받았나요?',
      '설치된 내용과 제공받은 설명이 다른 부분을 기록했나요?',
      '환전·알선·재매입이 포함된 제안인지 확인했나요?',
      '인수 절차와 미확인 사항을 관할 부서에 문의할 목록으로 정리했나요?',
    ],
    scopeNote: '2026년 11월 10일 확인한 자료 기준입니다. 법령 인용은 시행 2025년 10월 23일, 법률 제20485호의 해당 조문을 기준으로 했습니다. 개별 매장의 적법성이나 인수 후 영업 가능 여부를 판정하는 글은 아니며, 구체적인 허가·등록 및 계약 사항은 관할 지자체나 법률 전문가에게 확인하세요.',
    sources: [
      { id: 'business-guide', title: '온라인 게임의 제작 및 제공', organization: '법제처 찾기쉬운 생활법령정보', url: 'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=2&cnpClsNo=1&csmSeq=2858&popMenu=ov', note: '업종 구분과 허가·등록 안내. 자료 기준일 2026-10-15.' },
      { id: 'law26', title: '게임산업진흥에 관한 법률 제26조', organization: '국가법령정보센터', url: 'https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1025570525', note: '일반게임제공업 허가, 인터넷컴퓨터게임시설제공업 등록.' },
      { id: 'game-data', title: '게임물관리위원회 게임 정보', organization: '공공데이터포털 · 제공기관 게임물관리위원회', url: 'https://www.data.go.kr/data/15120667/openapi.do', note: '등급분류번호·업체·플랫폼·취소 여부 등 제공 항목의 설명.' },
      { id: 'rating-guide', title: '온라인 게임과 등급분류', organization: '법제처 찾기쉬운 생활법령정보', url: 'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=1&cciNo=1&cnpClsNo=1&csmSeq=2858', note: '등급분류와 예외·자체등급분류 체계 안내.' },
      { id: 'law32', title: '게임산업진흥에 관한 법률 제32조', organization: '국가법령정보센터', url: 'https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1021741027', note: '게임물 제공과 결과물 환전 등에 관한 금지 규정.' },
      { id: 'law28', title: '게임산업진흥에 관한 법률 제28조', organization: '국가법령정보센터', url: 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1032690569', note: '게임물 관련사업자의 준수사항.' },
    ],
  },
  {
    slug: 'adult-pc-used-computer-check',
    title: '성인pc 중고 PC 인수 점검: 사양·Windows·저장장치',
    description: '성인pc 매장이나 중고 PC 인수 전에 CPU·RAM, SSD 상태, Windows 정품 인증과 인계 조건을 확인하는 순서를 Microsoft 공식 문서에 근거해 안내합니다.',
    category: '장비·Windows 점검',
    publishedAt: '2026-11-10',
    updatedAt: '2026-11-10',
    lead: [
      '중고 PC를 여러 대 인수할 때는 같은 외관이나 판매 설명만으로 전체 사양을 판단하기 쉽습니다. 기기별로 실제 설정 화면을 확인하고, 저장 공간·저장장치 상태·Windows 사용 조건을 나누어 기록해 보세요.',
      '아래 메뉴 경로는 Windows 11 기준이며 버전과 장치 구성에 따라 표시가 달라질 수 있습니다. Microsoft 공식 안내를 바탕으로 정리한 점검 방법으로, 특정 매물의 상태나 성능을 시험한 결과는 아닙니다.',
    ],
    sections: [
      {
        id: 'specifications', title: '1. PC마다 CPU·RAM·Windows 에디션을 기록하세요',
        paragraphs: [
          '설정에서 시스템, 정보를 차례로 열면 프로세서와 설치된 RAM, 시스템 종류 및 Windows 에디션·버전 등을 확인할 수 있습니다. 각 기기에 구분 번호를 붙인 뒤 판매 설명과 화면의 항목을 대조하세요.',
          '기록할 때는 i5처럼 제품군만 적기보다 화면에 표시된 전체 모델명을 남기는 편이 좋습니다. 이 단계는 부품을 식별하는 과정이며, 실제 작업 속도나 장시간 안정성을 측정한 것은 아닙니다.',
        ],
        points: ['기기 번호별로 CPU 모델, RAM 용량, Windows 에디션·버전을 기록합니다.', '설명과 다른 항목, 화면에서 확인할 수 없는 항목을 따로 남깁니다.'],
        sourceIds: ['device-info'],
      },
      {
        id: 'storage', title: '2. 저장 공간과 저장장치 상태를 구분하세요',
        paragraphs: [
          '설정의 시스템, 저장소 화면에서 확인하는 여유 공간은 디스크 상태와 다른 정보입니다. Windows의 상태 정보는 고급 저장소 설정, 디스크 및 볼륨에서 해당 디스크의 속성을 열어 확인합니다.',
          'Microsoft가 안내하는 이 상태 모니터링은 NVMe SSD를 대상으로 하며 SATA SSD와 HDD는 포함하지 않습니다. 상태 항목이 없으면 정상으로 판단하지 말고, 해당 장치의 상태 정보는 확인하지 못했다고 기록하세요.',
          '예비 용량 부족, 안정성 저하, 읽기 전용 등의 경고가 있는지 확인합니다. 표시된 예상 수명은 제조사의 예측을 바탕으로 한 추정치입니다. 경고가 없거나 수치가 높더라도 앞으로 고장이 없다는 보장은 아닙니다.',
        ],
        sourceIds: ['storage-health'],
      },
      {
        id: 'activation', title: '3. 정품 인증 화면과 인계 자료를 별도로 확인하세요',
        paragraphs: [
          'Windows 11에서는 설정의 시스템, 정품 인증에서 인증 상태를 확인할 수 있습니다. Windows 에디션과 표시된 상태를 기록하세요.',
          'Microsoft는 정품 인증을 제품 키나 디지털 권한과 하드웨어 구성을 연결하는 기술 절차로 설명하며, 인증 성공 자체가 Windows 복사본의 정품성을 보장하지는 않는다고 안내합니다. 인증 화면만 보고 구매 자료와 사용권 확인을 생략하지 마세요.',
        ],
        sourceIds: ['activation'],
      },
      {
        id: 'license-transfer', title: '4. Windows를 어떻게 취득했는지 확인하세요',
        paragraphs: [
          'Microsoft의 Windows 11 한국어 사용 조건 4항은 사전 설치와 독립형 소프트웨어의 양도 조건을 구분합니다. 사전 설치된 소프트웨어는 라이선스가 허가된 장치와 함께 양도하는 조건 등이 있으며, 독립형에도 기존 장치에서 제거하는 등의 조건이 적용됩니다. 볼륨 라이선스에는 별도 계약이 적용됩니다.',
          '판매자에게 취득 형태와 구매·라이선스 자료를 확인하고 해당 약관 또는 계약에 맞는 인계인지 검토하세요. 기기 인수와 소프트웨어 사용권, 사업장에서의 이용 조건은 각각 확인할 항목입니다. Microsoft 계정이나 비밀번호를 넘겨받는 것을 사용권 확인의 대체 수단으로 삼지 마세요.',
        ],
        sourceIds: ['license'],
      },
      {
        id: 'windows-support', title: '5. 운영체제의 지원 상태도 비용 검토에 포함하세요',
        paragraphs: [
          'Microsoft는 일반 Windows 10의 지원이 2025년 10월 14일 종료됐다고 안내합니다. PC가 켜지고 프로그램이 실행된다는 사실과 운영체제가 계속 보안 지원을 받는지는 별개의 확인 항목입니다.',
          'Windows 10 장비라면 정확한 에디션·버전, 적용되는 지원 수명 주기와 별도 연장 보안 업데이트 가입 여부를 확인하세요. Windows 11로 바꾸려면 해당 PC의 요구 사항 충족 여부도 확인해야 합니다. 업그레이드나 장비 교체가 필요한지는 기기별로 판단하고, 확인 전에 비용이 들지 않는다고 가정하지 마세요.',
        ],
        sourceIds: ['support-end'],
      },
      {
        id: 'handover-note', title: '6. 인수 기록에 미확인 항목을 남기세요',
        paragraphs: [
          '피씨이음이 제안하는 기록 항목은 기기 번호, 확인 날짜, CPU·RAM, 저장장치 종류·용량, 상태 화면 확인 여부와 경고, Windows 에디션·인증 상태, 취득·인계 자료입니다. 실제로 확인한 내용과 판매자의 설명을 구분해 적습니다.',
          '점검하지 못한 장비가 있으면 확인한 장비의 결과를 전체에 적용하지 말고 해당 기기를 따로 표시하세요. 수량, 포함 구성품, 확인하지 못한 상태와 추가 점검 방법을 인계 전에 정리하면 같은 항목을 기준으로 다시 비교할 수 있습니다.',
        ],
      },
    ],
    checklist: [
      'PC별 CPU·RAM·Windows 에디션을 실제 화면에서 확인했나요?',
      '저장 공간과 저장장치 상태를 각각 기록했나요?',
      '상태 표시가 없는 장비를 미확인으로 구분했나요?',
      'Windows 인증 상태와 취득·인계 자료를 별도로 확인했나요?',
      '운영체제 지원 상태와 추가 점검이 필요한 기기를 정리했나요?',
    ],
    scopeNote: '2026년 11월 10일 Microsoft 공식 자료를 확인해 작성했습니다. 메뉴는 Windows 11 기준이며, 체크리스트는 피씨이음이 정리한 확인 보조 자료입니다. 제조사의 진단 인증이나 개별 장비의 무고장 보증이 아니며, 사업장에 적용되는 라이선스는 해당 계약과 공급자에게 확인하세요.',
    sources: [
      { id: 'device-info', title: 'Windows 장치에 대한 정보 찾기', organization: 'Microsoft Support', url: 'https://support.microsoft.com/ko-kr/windows/experience/find-information-about-your-windows-device', note: '장치 사양과 Windows 에디션·버전 확인 방법.' },
      { id: 'storage-health', title: '저장 장치에 대한 중요 경고에 대한 조치', organization: 'Microsoft Support', url: 'https://support.microsoft.com/ko-kr/windows/experience/storage-filemanagement/what-to-do-about-a-critical-warning-for-a-storage-device', note: 'NVMe SSD 상태 표시의 범위와 경고·추정 수명 해석.' },
      { id: 'activation', title: 'Windows 정품 인증', organization: 'Microsoft Support', url: 'https://support.microsoft.com/ko-kr/windows/activation/activate-windows', note: '정품 인증 확인 방법과 인증 절차의 범위.' },
      { id: 'license', title: 'Windows 11 한국어 소프트웨어 사용 조건 (PDF)', organization: 'Microsoft', url: 'https://www.microsoft.com/content/dam/microsoft/usetm/documents/windows/11/oem-%28pre-installed%29/Useterms_OEM_Windows_11_Korean.pdf', note: '2024년 4월 수정본. 서두의 적용 계약 구분과 4항 양도 조건.' },
      { id: 'support-end', title: 'Windows 지원 종료 안내', organization: 'Microsoft Windows', url: 'https://www.microsoft.com/en-us/windows/end-of-support', note: 'Windows 10 지원 종료와 Windows 11 전환·연장 보안 업데이트 안내.' },
    ],
  },
];
