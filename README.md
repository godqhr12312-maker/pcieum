# 피씨이음

PC방 매매 · 중고장터 · 구인구직 · 사장님 커뮤니티. 참고 사이트의 남색 헤더, 배경 배너, 파란 검색 버튼, 매물 목록과 게시판 구성을 새 브랜드로 구현했습니다.

현재 공개 버전은 회원 기능을 비활성화한 열람용 사이트입니다. 로그인·회원가입·마이페이지·글쓰기 화면과 관련 버튼을 표시하지 않고, 회원 관련 API 쓰기도 차단합니다. Supabase 회원 연결은 추후 진행합니다.

## 구현 기능

- 반응형 홈, 지역/업종/거래 유형/검색어 필터, 가격/조회/최신 정렬, 페이지 이동
- 독립 URL의 서버 렌더링 게시물 상세, 프로필, 게시글 작성·수정·숨김 삭제·거래 완료
- 사진 업로드(검증된 JPG/PNG/WebP), 관심 글, 댓글, 주소 공유
- 일반/성인/기타 PC방 매매, 중고장터, 구인/구직, 자유·노하우·공지·뉴스·게임·고객센터 게시판
- 관리자 게시물 공개/숨김/거래 완료, 관리자 전용 공지 작성
- 실제 금전과 무관한 가상 점수 무료 슬롯 체험

예시 게시물은 모두 제거했으며, 목록과 전체 건수는 데이터베이스에 등록된 실제 글만 표시합니다. 등록된 글이 없으면 빈 상태를 안내합니다. 원본 사이트의 실매물, 회원, 연락처는 복사하지 않았습니다. 관리자 배너 편집, 외부 게임 공급사 연동, 결제, SMS/이메일 발송은 구현하지 않았습니다.

## 기술과 데이터

Vinext + React + TypeScript, Cloudflare D1, R2. `app/[...route]/page.tsx`가 목록/상세/회원 화면을 서버에서 렌더링하고 `app/api/`에서 데이터 접근과 쓰기 권한을 검사합니다. SQL은 매개변수 바인딩하며, 모든 변경 API는 로그인/Origin/작성자 권한을 검사합니다.

인증 관련 기존 코드는 ChatGPT 계정 연동이지만, 현재 lib/member-features.ts의 MEMBER_FEATURES_ENABLED=false로 화면과 API를 비활성화했습니다. 회원 기능을 다시 제공하기 전에 Supabase 인증·권한 처리를 연결하고 검증해야 합니다. 현재 모드에서 /join, /mypage, /write, /admin은 404를 반환합니다.

## 로컬 실행

Node.js 22.13 이상. 일반 환경에서는 아래 npm 명령을 사용합니다. 이 Windows 환경에서 npm.cmd 경로 해석 문제가 있으면 `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'`를 npm 대신 사용합니다.

```powershell
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_jittery_johnny_blaze.sql
npm run dev -- --hostname 127.0.0.1
```

마이그레이션은 비어 있는 로컬 데이터베이스에 한 번 적용합니다. 데이터는 `.wrangler/state`에 저장되며 서버 재시작 후 유지됩니다. `http://127.0.0.1:5173`에서 개발용 로그인을 하면 `local_seedy` 식별자의 테스트 계정이 사용됩니다. 이 모의 로그인 코드는 배포에 포함되지 않습니다.

## 운영 설정

GitHub 저장소는 이 프로젝트의 소스 보관과 버전 관리를 담당합니다. 현재 앱은 서버 렌더링과 `/api/` 처리가 필요하므로 GitHub Pages에 그대로 배포할 수 없습니다. 소스를 GitHub에 업로드한 뒤에도 실행 호스팅에 별도로 배포해야 합니다.

운영 도메인은 `pcieum.com`입니다. 배포할 호스팅에서 도메인을 등록하고, 해당 호스팅이 발급한 DNS 값을 도메인 관리 화면에 적용합니다. 로컬 주소를 DNS 연결 대상으로 사용하지 않습니다.

Sites 런타임 환경변수:

| 키 | 용도 |
|---|---|
| `SITE_URL` | 정식 배포 시 실제 운영 도메인 지정 필수. canonical/OG/sitemap에 공통 사용하며, 미설정 로컬 환경에서는 요청 Host로 자동 감지 |
| `SEARCH_INDEXING` | 기본적으로 공개 페이지 색인 허용. 비공개 미리보기·스테이징은 `false`로 명시하여 차단 |
| `ADMIN_USER_IDS` | 관리자 사이트별 사용자 ID, 쉼표 구분. 기본값 없음 |

관리자는 해당 사이트 로그인 후 `/api/me`의 `user.userId`를 확인하여 `ADMIN_USER_IDS`에 지정합니다. 첫 가입자에게 자동으로 관리자 권한을 부여하지 않습니다. 환경변수 변경은 저장 버전을 다시 배포해야 반영됩니다. 로컬 테스트용 `.dev.vars`는 Git/배포에서 제외됩니다.

## SEO

공개 페이지는 기본적으로 색인을 허용합니다. 정식 배포에서는 `SITE_URL=https://실제운영도메인`을 지정하여 canonical, Open Graph, sitemap의 주소를 일치시킵니다. `SITE_URL`이 없는 로컬 환경에서는 현재 요청의 Host를 사용하므로 미리보기 포트가 바뀌어도 주소를 자동으로 맞춥니다. 비공개 미리보기나 스테이징은 `SEARCH_INDEXING=false`로 별도 설정합니다.

- 주요 텍스트 서버 렌더링, `<html lang="ko">`, 각 페이지의 고유 title·description·canonical·Open Graph·Twitter 메타데이터
- `lib/seo.ts`의 `createPageMetadata`·`createPostMetadata`로 메타데이터 생성 방식 통일
- `lib/seo-routes.ts`의 `PUBLIC_PAGES`를 페이지 메타데이터와 sitemap에서 함께 사용
- `/sitemap.xml`에 등록된 공개 경로와 실제 `ACTIVE` 게시글 자동 반영; 상세 글은 실제 수정일 사용, 대량 게시글은 sitemap index로 분할
- `/robots.txt`에서 공개 화면과 첨부 이미지(`/api/media/`) 수집 허용, 내부 API와 인증 경로 수집 제외
- 홈페이지 WebSite, 상세 BreadcrumbList, 실제 커뮤니티 글 DiscussionForumPosting 구조화 데이터

회원가입·마이페이지·글쓰기·관리 화면, 검색 및 중복 파생 URL, 거래 완료 글, 404 화면의 `noindex`는 의도된 동작입니다. 비공개 HTML 화면은 robots.txt로 막지 않아 크롤러가 `noindex`를 확인할 수 있게 합니다. 삭제·숨김 글과 제거된 예시 주소는 일반 방문자에게 404로 응답합니다. 숨김·거래 완료 게시물은 sitemap에 넣지 않습니다.

### 새 페이지를 추가할 때

1. 공개 정적 URL을 `PUBLIC_PAGES`에 고유한 `path`, `title`, `description`과 함께 등록합니다. 레지스트리는 외부 import 없이 독립적인 상수로 유지합니다.
2. 해당 `app/**/page.tsx` 파일에서 `generateMetadata` 또는 `metadata`를 export하고, `lib/seo`의 공통 factory를 호출합니다. 경로 그룹 `(group)`은 URL에 포함하지 않습니다. 네 개의 비공개 경로(`/join`, `/mypage`, `/write`, `/admin`)는 공개 레지스트리 등록만 제외하며 메타데이터는 필요합니다.
3. 동적 상세 페이지도 공통 factory를 사용하고, 공개 대상 데이터가 sitemap 수집 코드에 포함되는지 확인합니다. 실제 신규 게시글을 생성하는 HTTP 검사는 별도로 실행합니다.
4. 소스 검사와 실행 중인 사이트의 HTTP·Lighthouse 검사를 모두 통과시킵니다.

`npm run seo:source`는 TypeScript AST로 페이지의 메타데이터 export, 공통 factory import 및 호출, 정적 URL의 레지스트리 등록을 검사합니다. 빈 제목·설명, 중복 제목·설명, 잘못되거나 중복된 canonical 경로도 실패 처리합니다. 이 검사는 `npm run build`의 사전 검사로 실행되므로 새 페이지의 SEO 누락을 빌드 단계에서 발견할 수 있습니다.

```powershell
# 소스만 검사: 서버 실행 불필요
npm run seo:source

# 실행 중인 사이트를 재귀적으로 순회하며 메타데이터·canonical·sitemap 검사
npm run seo:check -- http://localhost:51694

# 발견된 공개 URL 전체에 실제 Lighthouse SEO 검사를 실행, 100점 기준 검증
npm run seo:audit -- http://localhost:51694

# HTTP 검사와 Lighthouse 검사를 함께 실행
npm run seo:verify

# 로컬 전용: 네 종류의 실제 게시글 생성·반영·상태 변경 및 Lighthouse 검사
npm run seo:check -- http://localhost:51694 --fixture --lighthouse
```

`--fixture`는 회원 기능이 활성화된 로컬 개발 환경에서 테스트 계정과 테스트 게시글을 사용하는 검사입니다. 현재 회원 기능 비활성 모드에서는 실행하지 않습니다. `node scripts/member-disabled-smoke.mjs http://localhost:51694`로 회원 API 차단을 확인할 수 있습니다. 공개 서비스에서 실행하지 않습니다. 미리보기의 색인 차단 설정을 검사할 때는 `seo:check`에 `--preview`를 전달합니다. Lighthouse 점수는 검사 시점의 실행 결과이며, 검색 순위나 검색엔진의 실제 색인 완료를 뜻하지 않습니다.

정식 공개 후 Google Search Console과 네이버 서치어드바이저에서 도메인 소유 확인, sitemap 제출, 수집 결과 확인을 진행합니다. 운영 도메인이나 색인 설정을 변경하면 같은 검사를 다시 실행합니다.

참고: [네이버 JavaScript/SSR 가이드](https://searchadvisor.naver.com/guide/seo-advanced-javascript), [Google URL 구조](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites), [Google 게시판 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/discussion-forum).

## 확인 방법

```powershell
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

`scripts/backend-smoke.mjs`는 로컬 Worker에 대해서만 두 테스트 계정의 권한, 실제 DB/R2 저장, 댓글·찜, 삭제, 입력 검증을 검사합니다. Vite 개발 서버는 임의 인증 헤더를 제거하므로 빌드된 Worker를 127.0.0.1의 별도 포트에서 실행한 뒤 검사해야 합니다. 테스트 데이터는 로컬 전용이며 공개 서비스에 쓰지 않습니다.

운영자 상호·문의처·실제 약관/개인정보처리방침, 도메인과 관리자 ID는 정식 운영 전 확정할 항목입니다. 현재 안내 페이지에는 미확정 정보를 허위로 기재하지 않았습니다.

## 이미지

`public/hero.jpg`는 이 프로젝트를 위해 생성한 독자적인 PC방 이미지입니다. 로고/아이콘은 SVG로 제작했습니다. 한글 폰트는 Noto Sans KR(Google Fonts)을 사용하며 네트워크 실패 시 시스템 폰트로 표시됩니다.
