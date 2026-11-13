import type { CatalogGuideContent } from '@/lib/catalog-guides';
import { CATALOG_GUIDE_UPDATED_AT } from '@/lib/catalog-guides';
import './catalog-guide.css';

export function CatalogGuide({ guide }: { guide: CatalogGuideContent }) {
  return <section className="catalog-guide" aria-labelledby="catalog-guide-title">
    <header className="guide-heading">
      <span className="guide-kicker">피씨이음 이용 가이드</span>
      <h2 id="catalog-guide-title">{guide.title}</h2>
      <p>{guide.introduction}</p>
      <div className="catalog-guide-byline"><a href="/about">작성 · 피씨이음</a><span>안내 수정 <time dateTime={CATALOG_GUIDE_UPDATED_AT}>2026. 11. 13.</time></span><a href="/editorial-policy">편집 기준</a></div>
    </header>
    <div className="catalog-guide-table-wrap">
      <table className="catalog-guide-table">
        <caption>{guide.tableTitle}</caption>
        <thead><tr>{guide.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{guide.rows.map(([label, description]) => <tr key={label}><th scope="row">{label}</th><td>{description}</td></tr>)}</tbody>
      </table>
    </div>
    <section className="catalog-guide-steps" aria-labelledby="catalog-guide-steps-title">
      <h3 id="catalog-guide-steps-title">{guide.stepsTitle}</h3>
      <ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <p>{guide.note}</p>
    </section>
    <nav className="catalog-guide-related" aria-label="관련 안내">
      {guide.links.map(link => <a href={link.href} key={link.href}><strong>{link.label} <span aria-hidden="true">→</span></strong><span>{link.description}</span></a>)}
    </nav>
  </section>;
}
