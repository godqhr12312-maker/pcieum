import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
export const BRAND = '피씨이음';
export const DESCRIPTION = 'PC방 매매부터 중고장터, 구인구직, 사장님 커뮤니티까지. 피씨이음에서 새로운 시작을 만나보세요.';
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
