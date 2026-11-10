import type { ReactNode } from 'react';
import { Breadcrumb, Icon } from './UI';
import { PageStructuredData } from './StructuredData';
import { dateText } from '@/lib/config';
import { SITE_INFORMATION_PAGES, SITE_INFORMATION_UPDATED_AT } from '@/lib/site-information';
import '../site-information.css';

type InformationPage = { path: string; title: string; description: string };

export function SiteInformation({ page, heading, children }: { page: InformationPage; heading: string; children: ReactNode }) {
  return <div className="container page-shell site-information">
    <Breadcrumb items={[{ label: heading }]} />
    <header className="site-information-header">
      <span className="guide-kicker">피씨이음 운영 안내</span>
      <h1>{heading}</h1>
      <p>{page.description}</p>
      <span className="site-information-date">최종 변경 <time dateTime={SITE_INFORMATION_UPDATED_AT}>{dateText(SITE_INFORMATION_UPDATED_AT)}</time></span>
    </header>
    <div className="site-information-layout">
      <nav className="site-information-nav" aria-label="운영 안내 메뉴">
        {Object.values(SITE_INFORMATION_PAGES).map(item => <a key={item.path} href={item.path} aria-current={page.path === item.path ? 'page' : undefined}>
          <span>{item.path === '/about' ? '운영자 소개' : item.path === '/editorial-policy' ? '편집 기준' : '정정·운영 문의'}</span><Icon name="arrow" size={15} />
        </a>)}
      </nav>
      <div className="site-information-body">{children}</div>
    </div>
    <PageStructuredData path={page.path} title={page.title} description={page.description} modified={SITE_INFORMATION_UPDATED_AT} type={page.path === '/about' ? 'AboutPage' : page.path === '/contact' ? 'ContactPage' : 'WebPage'} />
  </div>;
}

export function InformationSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section className="site-information-section" id={id} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{title}</h2>{children}
  </section>;
}
