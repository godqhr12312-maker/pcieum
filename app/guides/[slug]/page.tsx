import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb, Icon } from '../../components/UI';
import { PageStructuredData } from '../../components/StructuredData';
import { GUIDE_ARTICLES, guidePath } from '@/lib/guides';
import { BRAND, dateText, jsonLd, origin } from '@/lib/config';
import { createPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = GUIDE_ARTICLES.find(item => item.slug === slug);
  if (!article) return createPageMetadata({ title: '정보글을 찾을 수 없습니다', description: '주소를 확인하거나 피씨이음의 공개된 정보글을 살펴보세요.', path: `/guides/${encodeURIComponent(slug)}`, index: false });
  return createPageMetadata({
    title: article.title, description: article.description, path: guidePath(article.slug),
    article: { publishedTime: article.publishedAt, modifiedTime: article.updatedAt, author: BRAND },
  });
}

export default async function GuideArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = GUIDE_ARTICLES.find(item => item.slug === slug);
  if (!article) notFound();
  const base = await origin();
  const path = guidePath(article.slug);
  const url = `${base}${path}`;
  const related = GUIDE_ARTICLES.filter(item => item.slug !== article.slug);
  const articleBody = [...article.lead, ...article.sections.flatMap(section => [section.title, ...section.paragraphs, ...(section.points || [])]), ...article.checklist, article.scopeNote].join('\n\n');
  return <div className="container page-shell information-guides">
    <Breadcrumb items={[{ label: '성인pc 정보글', href: '/guides' }, { label: article.category }]} />
    <article className="information-article" aria-labelledby="information-article-title">
      <header className="information-article-heading">
        <span className="guide-kicker">{article.category}</span>
        <h1 id="information-article-title">{article.title}</h1>
        <p className="information-deck">{article.description}</p>
        <div className="information-byline"><span>작성 · {BRAND}</span><span>게시 <time dateTime={article.publishedAt}>{dateText(article.publishedAt)}</time></span><span>최종 확인 <time dateTime={article.updatedAt}>{dateText(article.updatedAt)}</time></span></div>
      </header>
      <div className="information-article-layout">
        <nav className="information-toc" aria-label="이 글의 목차">
          <h2>이 글에서 확인할 내용</h2>
          <ol>{article.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}<li><a href="#article-checklist">확인 항목 정리</a></li><li><a href="#article-sources">출처와 확인 범위</a></li></ol>
        </nav>
        <div className="information-prose">
          <div className="information-lead">{article.lead.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          {article.sections.map(section => <section className="information-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {!!section.points?.length && <ul>{section.points.map((point, index) => <li key={index}>{point}</li>)}</ul>}
            {!!section.sourceIds?.length && <div className="information-section-sources"><span>관련 출처</span><ul>{section.sourceIds.map(id => {
              const source = article.sources.find(item => item.id === id);
              if (!source) throw new Error(`Missing source ${id} in guide ${article.slug}`);
              return <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.organization} · {source.title}<span className="sr-only"> (새 창)</span></a></li>;
            })}</ul></div>}
          </section>)}
          <section className="information-checklist information-section" id="article-checklist" aria-labelledby="article-checklist-title">
            <h2 id="article-checklist-title">확인 항목 정리</h2>
            <ul>{article.checklist.map((item, index) => <li key={index}><span aria-hidden="true">✓</span><span>{item}</span></li>)}</ul>
          </section>
          <section className="information-sources information-section" id="article-sources" aria-labelledby="article-sources-title">
            <h2 id="article-sources-title">출처와 확인 범위</h2>
            <p>{article.scopeNote}</p>
            <ol>{article.sources.map(source => <li id={`source-${source.id}`} key={source.id}>
              <span className="information-source-organization">{source.organization}</span>
              <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span className="sr-only"> (새 창)</span></a>
              {source.note && <p>{source.note}</p>}
            </li>)}</ol>
          </section>
        </div>
      </div>
    </article>
    <section className="information-related" aria-labelledby="information-related-title">
      <h2 id="information-related-title">이어서 살펴보기</h2>
      <div className="information-related-links">{related.map(item => <a href={guidePath(item.slug)} key={item.slug}><span>{item.title}</span><Icon name="arrow" size={18} /></a>)}<a href="/pc-room?type=SELL&category=ADULT"><span>성인pc 매물·운영 정보</span><Icon name="arrow" size={18} /></a><a href="/pc-room?type=BUY&category=ADULT"><span>성인pc 구합니다·인수 준비</span><Icon name="arrow" size={18} /></a></div>
      <a className="information-back" href="/guides">전체 정보글 보기</a>
    </section>
    <PageStructuredData path={path} title={article.title} description={article.description} parents={[{ path: '/guides', title: '성인pc 정보글' }]} modified={article.updatedAt} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      '@context': 'https://schema.org', '@type': 'Article', '@id': `${url}#article`, url,
      headline: article.title, description: article.description, articleSection: article.category, articleBody,
      datePublished: article.publishedAt, dateModified: article.updatedAt, inLanguage: 'ko-KR',
      mainEntityOfPage: { '@id': `${url}#webpage` },
      author: { '@type': 'Organization', '@id': `${base}/#organization`, name: BRAND, url: base },
      publisher: { '@id': `${base}/#organization` },
      citation: article.sources.map(source => ({ '@type': 'CreativeWork', name: source.title, url: source.url, publisher: { '@type': 'Organization', name: source.organization } })),
    }) }} />
  </div>;
}
