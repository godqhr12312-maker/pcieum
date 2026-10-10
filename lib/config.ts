import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
export const BRAND = '피씨이음';
export const HOME_TITLE = '피씨이음 - PC방 매매 | 성인PC방 매물 · 구인구직 · 무료슬롯';
export const DESCRIPTION = '피씨이음 - PC방 매매 플랫폼. 성인PC방 매물, 일반PC방 매물, PC방 구인구직, 중고장터와 무료슬롯을 한 곳에서 만나보세요.';
export const SEO_KEYWORDS = [
  'PC방매매', 'PC방팝니다', 'PC방삽니다', '성인피시', '성인피씨', '성인pc',
  '성인피시방', '성인피시매물', '성인피시방매물', '성인pc매물', '성인pc매입',
  '성인피씨방매매', '성인피씨방매물', '성인pc방매매', '성인pc방팝니다', '성인pc방삽니다',
  '일반pc방매매', 'PC방구인구직', 'PC방중고장터', 'PC방인테리어', '게임카페매매',
  '피씨방매물', '피씨방팝니다', '피씨방삽니다', '무료슬롯', '슬롯게임', BRAND,
];
export async function origin() {
  if (env.SITE_URL) {
    const configured = new URL(env.SITE_URL);
    if (!['https:', 'http:'].includes(configured.protocol) || configured.username || configured.password) throw new Error('SITE_URL must be an absolute HTTP(S) URL.');
    return configured.origin;
  }
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  if (!host || !/^(?:[a-z0-9.-]+|\[::1\])(?::\d{1,5})?$/i.test(host)) throw new Error('A valid Host header or SITE_URL is required.');
  const local = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);
  return new URL(`${local ? 'http' : 'https'}://${host}`).origin;
}
// Explicit opt-out for staging. Public routes are crawlable by default.
export function indexable() { return env.SEARCH_INDEXING !== 'false'; }
export const regions = ['서울','경기','인천','부산','대구','대전','광주','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'];
export const categories: Record<string,string> = {ADULT:'성인PC방',NORMAL:'일반PC방',OTHER:'기타업종',PC:'PC · 부품',MONITOR:'모니터',CHAIR:'의자 · 집기',FREE:'자유게시판',TIPS:'매장 노하우',NOTICE:'공지사항',NEWS:'최신 뉴스',GAME:'게임 소식',CUSTOMER:'고객센터',HIRE:'채용정보',RESUME:'인재정보'};
export function postUrl(post: {id:string,kind:string,category:string}) { return `${post.kind==='listing'?'/pc-room':post.kind==='job'?'/job':post.kind==='board'?'/board/'+post.category:'/market'}/${post.id}`; }
export function priceText(price:number|null|undefined) { return price == null ? '가격 협의' : price === 0 ? '무료 나눔' : `${price.toLocaleString('ko-KR')}만원`; }
export function dateText(date:string) { return new Date(date).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}); }
export function jsonLd(data:unknown) { return JSON.stringify(data).replace(/</g,'\\u003c'); }
