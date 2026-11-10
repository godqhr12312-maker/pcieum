import { Icon } from "./UI";
import { GuideLinks } from "./GuideLinks";

const guides = [
  {
    icon: "shop",
    title: "성인pc 정보 비교",
    description: "성인pc를 살펴볼 때는 지역과 매장 규모부터 정리해 보세요. 판매 글에서 제시하는 조건과 구매 희망 글에 적힌 예산을 구분하면 필요한 정보를 찾기 쉽습니다.",
    items: [
      ["위치와 규모", "시·도와 세부 지역, 좌석 수를 같은 기준으로 비교합니다."],
      ["가격 항목", "매매 가격, 보증금, 권리금을 구분하고 본문의 포함 항목을 확인합니다."],
      ["매장 설명", "PC 사양과 시설 상태, 양도 범위가 어떻게 적혀 있는지 읽어봅니다."],
    ],
    href: "/pc-room?type=SELL&category=ADULT",
    link: "성인pc 판매 정보와 확인 항목",
    secondaryHref: "/pc-room?type=BUY&category=ADULT",
    secondaryLink: "성인pc 구매 조건과 준비 순서",
  },
  {
    icon: "box",
    title: "PC방 중고장터",
    description: "PC와 부품, 모니터, 의자와 집기를 품목별로 찾아보세요. 같은 제품 이름이라도 사양과 수량, 구성품에 따라 비교할 내용이 달라집니다.",
    items: [
      ["제품 정보", "모델명, 주요 사양, 사용 기간이 기재되어 있는지 살펴봅니다."],
      ["수량과 상태", "개당 가격인지 일괄 가격인지, 사진과 상태 설명이 있는지 확인합니다."],
      ["거래 조건", "거래 지역과 전달 방법, 포함되는 구성품을 함께 읽어봅니다."],
    ],
    href: "/market",
    link: "중고 물품 살펴보기",
  },
  {
    icon: "briefcase",
    title: "PC방 구인구직",
    description: "직원을 찾는 채용정보와 일자리를 찾는 인재정보를 구분해 보세요. 근무 희망 지역을 선택하면 관심 있는 지역의 게시글을 모아 볼 수 있습니다.",
    items: [
      ["근무 일정", "근무 요일과 시간대, 시작 시점이 적혀 있는지 확인합니다."],
      ["담당 업무", "매장 관리와 고객 응대 등 게시글에 설명된 업무를 살펴봅니다."],
      ["조건과 연락", "급여의 기준, 지원 방법, 작성자가 남긴 연락 정보를 함께 읽습니다."],
    ],
    href: "/job",
    link: "구인구직 정보 살펴보기",
  },
];

const steps = [
  { title: "지역과 분류를 선택하세요", body: "PC방 매매는 업종과 판매·구매 유형을, 중고장터는 품목을 선택하세요. 지역 필터를 더하면 관심 있는 범위의 글을 볼 수 있습니다." },
  { title: "검색어와 정렬을 활용하세요", body: "지역명이나 찾는 장비의 이름을 검색해 보세요. 매물 목록은 최신순, 조회순, 가격순으로 정렬할 수 있어 필요한 기준부터 살펴보기 좋습니다." },
  { title: "상세 내용까지 확인하세요", body: "목록의 제목과 가격을 본 다음 상세 화면에서 본문, 사진, 작성일과 거래 상태를 확인하세요. 비교할 때는 각 글의 공유 버튼으로 주소를 복사할 수 있습니다." },
];

const questions = [
  {
    question: "회원가입 없이 이용할 수 있나요?",
    answer: "공개된 매물과 게시판은 로그인 없이 검색하고 열람할 수 있습니다. 현재 로그인·회원가입, 게시글·댓글 작성과 사진 업로드 기능은 제공하지 않습니다. 이용 중인 화면에서는 공개 정보를 살펴보는 기능만 사용할 수 있습니다.",
  },
  {
    question: "검색 결과나 게시판이 비어 있으면 어떻게 하나요?",
    answer: "선택한 조건에 해당하는 글이 없으면 빈 목록으로 표시됩니다. 지역이나 업종을 전체로 바꾸거나 검색어를 줄여 다시 확인해 보세요. 아직 글이 등록되지 않은 게시판은 게시글이 등록된 뒤 목록에서 확인할 수 있습니다.",
  },
  {
    question: "매물의 가격은 어떤 항목을 함께 봐야 하나요?",
    answer: "PC방 매매의 희망 가격과 보증금, 권리금은 별도 항목입니다. 본문에 적힌 금액의 범위와 포함 사항을 함께 확인하세요. 중고 물품은 개당·일괄 판매 여부를 구분하고, 가격이 기재되지 않은 글은 상세 설명을 먼저 살펴보세요.",
  },
];

export function HomeGuide() {
  return <div className="home-guide">
    <GuideLinks />
    <section aria-labelledby="home-guide-title">
      <div className="guide-heading">
        <span className="guide-kicker">피씨이음 이용 가이드</span>
        <h2 id="home-guide-title">성인pc 정보, 조건부터 차근차근</h2>
        <p>피씨이음에서는 성인pc 관련 판매·구매 정보와 PC방 중고 물품, 구인구직을 구분해 살펴볼 수 있습니다. 먼저 공개 목록의 게시글 수와 선택한 지역을 확인하고, 아래 비교 항목으로 필요한 내용을 정리해 보세요.</p>
      </div>
      <div className="guide-grid">
        {guides.map(guide => <article className="guide-card" key={guide.href}>
          <span className="guide-icon"><Icon name={guide.icon} size={25} /></span>
          <h3>{guide.title}</h3>
          <p>{guide.description}</p>
          <dl className="guide-checklist">{guide.items.map(([label, description]) => <div key={label}><dt>{label}</dt><dd>{description}</dd></div>)}</dl>
          <div className="guide-card-links">
            <a className="guide-link" href={guide.href}>{guide.link}<Icon name="arrow" size={13} /></a>
            {guide.secondaryHref && <a className="guide-link" href={guide.secondaryHref}>{guide.secondaryLink}<Icon name="arrow" size={13} /></a>}
          </div>
        </article>)}
      </div>
    </section>

    <section className="guide-browse" aria-labelledby="browse-guide-title">
      <div className="guide-heading"><span className="guide-kicker">목록을 둘러보는 순서</span><h2 id="browse-guide-title">조건을 좁히면 비교가 쉬워집니다</h2></div>
      <ol className="guide-steps">{steps.map((step, index) => <li key={step.title}><span className="guide-step-number" aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
      <div className="guide-availability"><Icon name="monitor" size={21} /><p><strong>현재는 공개 정보 조회 기능을 제공합니다.</strong> 로그인·회원가입과 글쓰기 기능은 준비 중입니다. 서비스 변경 사항은 <a href="/board/NOTICE">공지사항</a>에서 확인할 수 있습니다.</p></div>
    </section>

    <section className="guide-faq" aria-labelledby="home-faq-title">
      <div className="guide-heading"><span className="guide-kicker">이용 전 확인해 보세요</span><h2 id="home-faq-title">자주 묻는 질문</h2></div>
      <div className="guide-faq-list">{questions.map(item => <article key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div>
    </section>
  </div>;
}
