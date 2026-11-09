type GuideIntent = "SELL" | "BUY";

const guides = {
  SELL: {
    title: "성인pc 판매 정보를 살펴보는 기준",
    introduction: "피씨이음의 성인pc 분류는 PC방 판매 글과 구매 희망 글을 나누어 살펴보는 공간입니다. 판매 목록에서는 제목의 희망 금액만 보기보다 지역, 공간 규모, 설비와 인계 범위를 같은 기준으로 정리해 보세요. 공개 목록의 게시글 수와 선택한 필터도 먼저 확인하세요.",
    checklistTitle: "판매 설명에서 함께 볼 네 가지",
    checklist: [
      ["지역과 공간", "시·군·구와 세부 위치, 층수, 면적, 좌석 수를 함께 봅니다. 면적의 표기 기준과 실제 이용 가능한 공간이 무엇인지 확인할 항목으로 남겨 두세요."],
      ["보증금·월세·권리금", "세 금액을 별도 칸에 적고, 희망 가격에 포함된 항목을 구분합니다. 월세와 별도로 표시된 관리비가 있는지도 살펴보세요."],
      ["PC와 매장 설비", "PC 사양과 수량, 모니터, 냉난방과 집기 상태를 확인합니다. 사진만으로 알기 어려운 작동 상태나 제외 물품은 따로 적어 두세요."],
      ["인계 범위와 시점", "인계할 물품 목록과 희망 일정을 비교합니다. 본문의 설명과 사진이 같은 시점의 정보인지, 달라진 항목은 없는지 확인하세요."],
    ],
    stepsTitle: "비교할 내용을 정리하는 순서",
    steps: [
      "관심 지역과 규모를 정한 뒤 성인PC방 분류와 판매 유형으로 목록을 좁힙니다.",
      "게시글 주소와 확인 날짜를 남기고 금액, 설비, 인계 조건을 같은 표에 옮깁니다.",
      "기재된 내용과 추가 확인할 내용을 구분한 후 변경 사항을 날짜와 함께 기록합니다.",
    ],
    questions: [
      ["희망 가격에 보증금도 포함되나요?", "게시글마다 금액을 적는 방식이 다를 수 있습니다. 별도 항목과 본문을 함께 읽고 포함 여부가 적혀 있지 않으면 미확인으로 남겨 두세요."],
      ["사진과 설명 중 무엇을 기준으로 보나요?", "둘을 함께 비교하세요. 사진의 촬영 시점, 장비 수량과 모델명 등 서로 맞지 않거나 빠진 항목을 확인 목록에 적습니다."],
      ["판매 글을 바로 등록할 수 있나요?", "현재는 공개 정보를 조회하는 기능을 제공합니다. 로그인·회원가입과 글쓰기는 제공하지 않으며, 변경 사항은 공지사항에서 확인할 수 있습니다."],
    ],
    relatedHref: "/pc-room?type=BUY&category=ADULT",
    relatedLabel: "구매 조건과 준비 순서도 살펴보기",
  },
  BUY: {
    title: "성인pc 구매 전 정리할 조건",
    introduction: "성인pc 구매를 알아볼 때는 원하는 지역과 규모, 지출 항목을 먼저 나누면 서로 다른 조건을 비교하기 쉽습니다. 이 목록은 구매 희망 정보를 보는 곳이며, 판매자가 제시한 조건은 판매 목록에서 따로 확인할 수 있습니다. 선택한 지역과 공개 게시글 수부터 살펴보세요.",
    checklistTitle: "구매 검토를 위한 네 가지 메모",
    checklist: [
      ["예산을 항목별로 구분", "보증금과 권리금, 장비 교체에 생각하는 금액을 나누어 적습니다. 월세와 관리비처럼 매달 확인할 항목도 별도 칸에 두세요."],
      ["원하는 조건의 우선순위", "희망 지역, 층수, 면적, 좌석 수를 정리합니다. 꼭 필요한 조건과 조정 가능한 조건을 구분하면 비교 범위를 좁히기 쉽습니다."],
      ["현장에서 확인할 내용", "출입 동선과 공간 배치, PC·모니터의 수량과 작동 상태를 설명과 대조합니다. 냉난방과 집기의 상태도 빠뜨리지 않고 기록하세요."],
      ["확인 기록을 한곳에", "게시글 주소, 확인 날짜, 설명된 금액과 물품을 함께 남깁니다. 직접 본 내용, 전달받은 설명, 아직 확인하지 못한 내용을 구분하세요."],
    ],
    stepsTitle: "찾기 전부터 현장 확인까지",
    steps: [
      "희망 지역과 규모를 정하고 일회성 지출 항목과 매월 확인할 항목을 나누어 적습니다.",
      "구매 희망 글과 판매 글을 구분해 읽고, 관심 조건에서 빠진 정보를 질문 목록으로 만듭니다.",
      "현장에서 확인한 내용과 게시글을 대조하고, 달라진 조건과 확인 날짜를 비교 메모에 반영합니다.",
    ],
    questions: [
      ["구매 목록과 판매 목록은 어떻게 다른가요?", "구매 목록은 찾는 사람의 희망 조건을, 판매 목록은 내놓는 사람의 설명을 보는 곳입니다. 같은 지역이라도 게시글의 목적을 구분해 읽으세요."],
      ["가격만 낮으면 비교가 끝나나요?", "표시 금액에 포함된 설비와 별도 비용 항목을 함께 봐야 합니다. 장비 수량이나 인계 범위가 다르면 같은 금액도 조건은 달라질 수 있습니다."],
      ["원하는 조건의 글이 없으면 어떻게 하나요?", "지역과 검색어를 넓혀 다시 살펴볼 수 있습니다. 목록이 비어 있으면 표시할 글이 없는 상태입니다. 현재는 회원가입과 구매 글 작성 기능을 제공하지 않습니다."],
    ],
    relatedHref: "/pc-room?type=SELL&category=ADULT",
    relatedLabel: "판매 설명에서 확인할 항목 살펴보기",
  },
};

export function AdultPcGuide({ intent }: { intent: GuideIntent }) {
  const guide = guides[intent];
  const headingId = `adult-pc-${intent.toLowerCase()}-guide`;

  return <section className="adult-pc-guide" aria-labelledby={headingId}>
    <div className="guide-heading">
      <span className="guide-kicker">피씨이음 정보 가이드</span>
      <h2 id={headingId}>{guide.title}</h2>
      <p>{guide.introduction}</p>
    </div>
    <div className="adult-guide-grid">
      <article className="adult-guide-panel">
        <h3>{guide.checklistTitle}</h3>
        <dl className="guide-checklist">{guide.checklist.map(([label, description]) => <div key={label}><dt>{label}</dt><dd>{description}</dd></div>)}</dl>
      </article>
      <article className="adult-guide-panel">
        <h3>{guide.stepsTitle}</h3>
        <ol className="adult-guide-steps">{guide.steps.map((step, index) => <li key={step}><span className="guide-step-number" aria-hidden="true">0{index + 1}</span><p>{step}</p></li>)}</ol>
        <a className="guide-link" href={guide.relatedHref}>{guide.relatedLabel} <span aria-hidden="true">→</span></a>
      </article>
    </div>
    <section className="adult-guide-faq" aria-labelledby={`${headingId}-faq`}>
      <h3 id={`${headingId}-faq`}>자주 묻는 질문</h3>
      <div className="guide-faq-list">{guide.questions.map(([question, answer]) => <article key={question}><h4>{question}</h4><p>{answer}</p></article>)}</div>
    </section>
  </section>;
}
