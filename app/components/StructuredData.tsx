import { BRAND, DESCRIPTION, jsonLd, origin } from '@/lib/config';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_URL } from '@/lib/site-information';

export async function SiteStructuredData() {
  const base = await origin();
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${base}/#organization`, name: BRAND, url: base,
        description: '성인pc 정보글과 PC방 매물·중고장터·구인구직 정보를 제공하는 피씨이음입니다.',
        publishingPrinciples: `${base}/editorial-policy`, correctionsPolicy: `${base}/editorial-policy#corrections`,
        contactPoint: { '@type': 'ContactPoint', contactType: '정정 문의 및 서비스 문의', url: PUBLIC_CONTACT_URL || `${base}/contact`, availableLanguage: 'ko', ...(PUBLIC_CONTACT_EMAIL ? { email: PUBLIC_CONTACT_EMAIL } : {}) },
        logo: { '@type': 'ImageObject', '@id': `${base}/#logo`, url: `${base}/logo.png`, width: 512, height: 512 },
      },
      {
        '@type': 'WebSite', '@id': `${base}/#website`, name: BRAND, alternateName: 'PC IEUM',
        url: `${base}/`, description: DESCRIPTION, inLanguage: 'ko-KR',
        publisher: { '@id': `${base}/#organization` },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${base}/pc-room?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
      },
    ],
  }) }} />;
}

type PageProps = {
  path: string; title: string; description?: string;
  parents?: { path: string; title: string }[];
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage';
  items?: { path: string; title: string; position: number }[];
  modified?: string;
};

export async function PageStructuredData({ path, title, description, parents = [], type = 'WebPage', items, modified }: PageProps) {
  const base = await origin();
  const url = new URL(path, `${base}/`).href;
  const crumbs = [{ path: '/', title: BRAND }, ...parents, ...(path === '/' ? [] : [{ path, title }])];
  const breadcrumbId = `${url}#breadcrumb`;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': type, '@id': `${url}#webpage`, url, name: title, description, inLanguage: 'ko-KR',
        isPartOf: { '@id': `${base}/#website` }, publisher: { '@id': `${base}/#organization` },
        ...(crumbs.length > 1 ? { breadcrumb: { '@id': breadcrumbId } } : {}), ...(modified ? { dateModified: modified } : {}),
        ...(items ? { mainEntity: { '@type': 'ItemList', itemListElement: items.map(item => ({ '@type': 'ListItem', position: item.position, name: item.title, url: new URL(item.path, base).href })) } } : {}),
      },
      ...(crumbs.length > 1 ? [{
        '@type': 'BreadcrumbList', '@id': breadcrumbId,
        itemListElement: crumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, item: new URL(item.path, base).href })),
      }] : []),
    ],
  }) }} />;
}
