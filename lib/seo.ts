import type { Metadata } from 'next';
import { BRAND, SEO_KEYWORDS, categories, indexable, origin, postUrl, priceText } from './config';
import type { Post } from './types';

type PageSeo = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  image?: string;
  article?: { publishedTime: string; modifiedTime: string; author: string };
};

export const cleanDescription = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 160);

/** Every public page uses this factory, including pages added after launch. */
export async function createPageMetadata(input: PageSeo): Promise<Metadata> {
  const base = await origin();
  const canonical = new URL(input.path, `${base}/`).href;
  if (new URL(canonical).origin !== base) throw new Error('SEO paths must belong to this site.');
  const title = input.title.includes(BRAND) ? input.title : `${input.title} | ${BRAND}`;
  const description = cleanDescription(input.description);
  if (!title.trim() || !description) throw new Error('SEO title and description are required.');
  const image = new URL(input.image || '/hero.jpg', `${base}/`).href;
  const allow = indexable() && input.index !== false;
  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description,
    keywords: SEO_KEYWORDS,
    alternates: { canonical },
    robots: { index: allow, follow: true, googleBot: { index: allow, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
    openGraph: {
      title, description, url: canonical, siteName: BRAND, locale: 'ko_KR',
      ...(input.article ? { type: 'article' as const, publishedTime: input.article.publishedTime, modifiedTime: input.article.modifiedTime, authors: [input.article.author] } : { type: 'website' as const }),
      images: [{ url: image, alt: input.title, ...(!input.image ? { width: 1672, height: 941 } : {}) }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [{ url: image, alt: input.title }] },
  };
}

export async function createPostMetadata(post: Post) {
  const facts = [categories[post.category], post.kind !== 'board' && `${post.region} ${post.district}`.trim(), post.kind !== 'board' && priceText(post.price)].filter(Boolean).join(' · ');
  return createPageMetadata({
    title: post.title,
    description: `${facts}. ${post.body}`,
    path: postUrl(post),
    index: !post.demo && post.status === 'ACTIVE',
    image: post.images[0],
    ...(post.kind === 'board' ? { article: { publishedTime: post.createdAt, modifiedTime: post.updatedAt, author: post.authorName } } : {}),
  });
}

/** Stable canonical queries prevent sort/search and tracking URLs from multiplying in search. */
export function catalogSeoPath(path: string, query: Record<string, string>): string {
  const params = new URLSearchParams();
  const section = path.split('/')[1];
  const validTypes = section === 'job' ? ['HIRE', 'RESUME'] : ['SELL', 'BUY'];
  const type = section === 'job' ? query.type || query.category : query.type;
  if (section !== 'board' && validTypes.includes(type)) params.set('type', type);
  const validCategories = section === 'pc-room' ? ['ADULT', 'NORMAL', 'OTHER'] : section === 'market' ? ['PC', 'MONITOR', 'CHAIR', 'OTHER'] : [];
  if (validCategories.includes(query.category)) params.set('category', query.category);
  const page = Number(query.page);
  if (Number.isInteger(page) && page > 1 && page <= 1000) params.set('page', String(page));
  return path + (params.size ? `?${params}` : '');
}

export function validCatalogQuery(section: string, query: Record<string, string>) {
  if (query.page && (!/^\d+$/.test(query.page) || Number(query.page) < 1 || Number(query.page) > 1000)) return false;
  if (section === 'board') return !query.type && !query.category;
  const types = section === 'job' ? ['HIRE', 'RESUME'] : ['SELL', 'BUY'];
  const cats = section === 'pc-room' ? ['ADULT', 'NORMAL', 'OTHER'] : section === 'market' ? ['PC', 'MONITOR', 'CHAIR', 'OTHER'] : ['HIRE', 'RESUME'];
  if (query.type && !types.includes(query.type) || query.category && !cats.includes(query.category)) return false;
  return !(section === 'job' && query.type && query.category && query.type !== query.category);
}
