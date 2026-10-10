import type {Post} from './types';
const base = {authorId:'demo',authorName:'피씨이음 예시',status:'ACTIVE' as const,createdAt:'2026-10-09T00:00:00.000Z',updatedAt:'2026-10-09T00:00:00.000Z',views:0,demo:true,images:[],district:'',price:null,seats:null,contact:'',premium:null,deposit:null};
export const samplePosts:Post[] = [
 {id:'sample-seoul',kind:'listing',category:'NORMAL',type:'SELL',title:'서울 역세권, 80석 프리미엄 PC방',region:'서울',district:'관악구',price:8500,seats:80,premium:6000,deposit:2500,body:'밝고 쾌적한 공간에서 새로운 시작을 준비해 보세요.\n\n80석 규모의 PC방 매매 화면을 보여주기 위한 예시 매물입니다. 역세권 입지, 매장 시설, PC 사양, 보증금과 권리금 등 실제 거래에 필요한 내용을 이곳에 작성할 수 있습니다.\n\n이 게시물은 디자인 확인용 예시이며 실제로 거래할 수 없습니다.'},
 {id:'sample-gyeonggi',kind:'listing',category:'NORMAL',type:'SELL',title:'수원 대학가 100석 PC방 양도합니다',region:'경기',district:'수원시',price:12000,seats:100,body:'대학가 PC방 매매 화면의 예시입니다.\n\n좌석 구성, 시설 상태, 운영 현황과 양도 조건을 상세하게 소개할 수 있습니다. 실제 매물이 아닙니다.'},
 {id:'sample-incheon',kind:'listing',category:'ADULT',type:'SELL',title:'인천 주안동, 소형 성인PC방 매매',region:'인천',district:'미추홀구',price:2800,seats:12,body:'소형 매장 정보를 소개하는 예시 게시물입니다.\n\n보증금과 권리금, 운영 설비 및 업종을 상세하게 기록할 수 있습니다. 실제 거래 매물이 아닙니다.'},
 {id:'sample-busan',kind:'listing',category:'NORMAL',type:'SELL',title:'부산 신도시 60석, 시설 좋은 PC방',region:'부산',district:'해운대구',price:6500,seats:60,body:'PC방 매물 등록 화면을 설명하는 예시입니다. 지역별로 매물을 검색하고 관심 매물을 비교할 수 있습니다. 실제 매물이 아닙니다.'},
 {id:'sample-buy',kind:'listing',category:'NORMAL',type:'BUY',title:'서울·경기 50석 이상 PC방 찾습니다',region:'경기',district:'전 지역',price:10000,seats:50,body:'PC방 양수를 위한 조건 등록 예시입니다.\n\n희망 지역과 예산, 좌석 수, 시설 조건을 작성하여 원하는 매장을 찾을 수 있습니다. 실제 구매 요청이 아닙니다.'},
 {id:'sample-other',kind:'listing',category:'OTHER',type:'SELL',title:'대전 복합 게임 라운지 양도',region:'대전',district:'유성구',price:4300,seats:30,body:'기타업종 매물 화면의 예시입니다. 실제 거래 매물이 아닙니다.'},
 {id:'sample-monitor',kind:'market',category:'MONITOR',type:'SELL',title:'27인치 240Hz 게이밍 모니터',region:'서울',district:'마포구',price:18,body:'중고 모니터 판매 글의 예시입니다. 제품의 모델명, 사용 기간, 상태 및 거래 방법을 기록할 수 있습니다. 실제 판매 상품이 아닙니다.'},
 {id:'sample-chair',kind:'market',category:'CHAIR',type:'SELL',title:'매장 교체용 게이밍 의자 20개',region:'경기',district:'성남시',price:5,body:'PC방 집기 중고 거래 예시입니다. 실제 판매 상품이 아닙니다.'},
 {id:'sample-pc',kind:'market',category:'PC',type:'SELL',title:'RTX 4060 PC 본체, 매장 일괄 정리',region:'인천',district:'부평구',price:65,body:'PC 본체 거래 글 예시입니다. 사양과 사용 기간, 수량과 거래 조건을 설명할 수 있습니다. 실제 판매 상품이 아닙니다.'},
 {id:'sample-hire',kind:'job',category:'HIRE',type:'HIRE',title:'서울 PC방 평일 오후 스태프 모집',region:'서울',district:'강남구',body:'채용공고 작성 예시입니다.\n\n근무 지역, 업무 내용, 근무 시간, 급여와 지원 방법을 안내할 수 있습니다. 이 게시물은 실제 채용공고가 아닙니다.'},
 {id:'sample-resume',kind:'job',category:'RESUME',type:'RESUME',title:'매장 관리 경험 있는 매니저입니다',region:'경기',district:'수원시',body:'구직 게시글의 예시입니다. 경력, 희망 근무 지역과 근무 시간을 작성할 수 있습니다. 실제 구직자가 아닙니다.'},
 ...[
 ['welcome','FREE','피씨이음에서 함께 이야기 나눠요','PC방 운영에 대한 궁금한 점과 일상 이야기를 나누는 자유게시판입니다. 반가운 인사부터 시작해 보세요.'],
 ['equipment','FREE','사장님들은 PC 교체 주기를 어떻게 잡으시나요?','매장 운영과 장비 교체에 관한 대화를 보여주는 예시 게시물입니다.'],
 ['cleaning','TIPS','쾌적한 매장을 위한 마감 점검 목록','키보드와 마우스 청소, 좌석 정리, 환기, 소모품 확인까지. 마감 시간에 함께 확인할 항목을 정리해 보세요.'],
 ['greeting','FREE','새로운 시작을 준비하는 사장님들, 반갑습니다','서로의 경험을 나누는 커뮤니티 예시입니다.'],
 ['interior','FREE','매장 인테리어, 어떤 분위기가 좋을까요?','사장님들이 공간에 대한 생각을 나누는 예시 게시물입니다.'],
 ['weekend','FREE','주말 운영 이야기 함께 나눠요','서로의 일상과 운영 경험을 공유하는 자유게시판 예시입니다.'],
 ['first','FREE','처음 인사드립니다. 잘 부탁드려요!','새로운 회원을 환영하는 인사말 예시입니다.'],
 ['notice','NOTICE','피씨이음 이용 안내','피씨이음은 PC방 매매, 중고장터, 구인구직과 커뮤니티를 한 곳에서 이용할 수 있는 공간입니다.\n\n현재 표시된 예시 콘텐츠는 실제 거래·채용 글이 아닙니다. 회원 정보를 등록하면 나만의 게시물을 작성할 수 있습니다.'],
 ['news','NEWS','업계 소식을 공유하는 공간입니다','PC방 업계의 새로운 소식을 원문 출처와 함께 공유할 수 있습니다. 이 게시물은 화면 구성 예시입니다.'],
 ['game','GAME','게임 업데이트 소식을 함께 나눠요','매장 운영에 도움이 되는 게임 업데이트와 서비스 소식을 공유하는 게시판입니다.'],
 ['help','CUSTOMER','궁금한 점은 고객센터에 남겨주세요','서비스 이용 중 궁금한 점을 남겨주세요. 이 게시판은 공개 게시판이므로 비밀번호나 민감한 개인정보는 적지 마세요.'],
 ].map(([id,category,title,body])=>({id:'sample-'+id,kind:'board' as const,category,type:'POST',title,region:'',body}))
].map(post=>({...base,...post})) as Post[];
