import type { Metadata } from 'next';
import { Breadcrumb, Icon } from '../components/UI';
import { PageStructuredData } from '../components/StructuredData';
import { GUIDE_ARTICLES, guidePath } from '@/lib/guides';
import { dateText } from '@/lib/config';
import { createPageMetadata } from '@/lib/seo';
import { PAGE_METADATA } from '@/lib/seo-routes';

const page = PAGE_METADATA.find(item => item.path === '/guides')!;

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata(page);
}

export default function GuidesPage() {
  return <div className="container page-shell information-guides">
    <Breadcrumb items={[{ label: '성인pc 정보글' }]} />
    <header className="information-index-heading">
      <span className="guide-kicker">피씨이음 정보글</span>
      <h1>{page.title}</h1>
      <p>{page.description}</p>
    </header>
    <div className="information-card-grid">
      {GUIDE_ARTICLES.map((article, index) => <article className="information-card" key={article.slug}>
        <div className="information-card-top"><span>{article.category}</span><span aria-hidden="true">0{index + 1}</span></div>
        <h2><a href={guidePath(article.slug)}>{article.title}</a></h2>
        <p>{article.description}</p>
        <div className="information-card-meta"><a href="/about">피씨이음</a><time dateTime={article.updatedAt}>{dateText(article.updatedAt)} 확인</time><span>출처 {article.sources.length}개</span></div>
        <a className="information-read-link" href={guidePath(article.slug)} aria-label={`${article.title} 읽기`}>정보글 읽기 <Icon name="arrow" size={16} /></a>
      </article>)}
    </div>
    <section className="information-browse" aria-labelledby="information-browse-title">
      <div><h2 id="information-browse-title">확인한 조건으로 목록 살펴보기</h2><p>정보글에서 정리한 항목을 판매 조건이나 구매 희망 조건과 함께 비교해 보세요.</p></div>
      <div className="information-browse-links"><a href="/pc-room?type=SELL&category=ADULT">성인pc 매물 보기 <Icon name="arrow" size={16} /></a><a href="/pc-room?type=BUY&category=ADULT">성인pc 구합니다 <Icon name="arrow" size={16} /></a></div>
    </section>
    <nav className="information-policy-links" aria-label="정보글 운영 안내"><a href="/about">운영자 소개</a><a href="/editorial-policy">편집 기준</a><a href="/contact">오류·정정 문의</a></nav>
    <PageStructuredData path="/guides" title={page.title} description={page.description} type="CollectionPage" modified="2026-11-10"
      items={GUIDE_ARTICLES.map((article, index) => ({ path: guidePath(article.slug), title: article.title, position: index + 1 }))} />
  </div>;
}
