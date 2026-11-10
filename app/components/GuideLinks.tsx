import { GUIDE_ARTICLES, guidePath } from '@/lib/guides';

export function GuideLinks({ compact = false }: { compact?: boolean }) {
  return <section className={`verified-guides${compact ? ' verified-guides-compact' : ''}`} aria-labelledby={compact ? 'related-guides-title' : 'verified-guides-title'}>
    <div className="guide-heading">
      <span className="guide-kicker">공식 자료로 확인하는 정보</span>
      <h2 id={compact ? 'related-guides-title' : 'verified-guides-title'}>성인pc 구매·운영 전에 읽어보세요</h2>
      <p>영업 형태와 게임물 등급, 중고 PC 상태를 확인하는 방법을 정리했습니다. 각 글에서 확인 날짜와 원문 출처를 볼 수 있습니다.</p>
    </div>
    <div className="verified-guide-grid">{GUIDE_ARTICLES.map(article => <article className="guide-card" key={article.slug}>
      <span className="guide-kicker">{article.category}</span>
      <h3><a href={guidePath(article.slug)}>{article.title}</a></h3>
      <p>{article.description}</p>
      <a className="guide-link" href={guidePath(article.slug)}>확인 방법 읽기 <span aria-hidden="true">→</span></a>
    </article>)}</div>
    <a className="guide-link guide-index-link" href="/guides">성인pc 정보글 전체 보기 <span aria-hidden="true">→</span></a>
  </section>;
}
