import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { PUBLIC_OPERATOR_NAME, SITE_INFORMATION_PAGES } from '@/lib/site-information';
import { InformationSection, SiteInformation } from '../components/SiteInformation';

const page = SITE_INFORMATION_PAGES.about;
export async function generateMetadata(): Promise<Metadata> { return createPageMetadata(page); }

export default function AboutPage() {
  return <SiteInformation page={page} heading="피씨이음과 운영자 소개">
    <InformationSection id="purpose" title="PC방 정보를 비교하는 데 필요한 기준을 정리합니다">
      <p>피씨이음은 성인pc와 일반 PC방을 알아보는 분들이 매물 조건과 인수 전 확인할 정보를 함께 살펴보는 사이트입니다. PC방 매매, 중고 물품, 구인구직 목록과 출처를 확인할 수 있는 정보글을 제공합니다.</p>
      <p>정보글은 영업 관련 서류와 게임물 등급, 중고 PC 사양과 Windows 등 실제 확인이 필요한 항목을 정리합니다. 공식 자료에 근거한 설명과 피씨이음이 제안하는 점검 순서를 구분해 안내합니다.</p>
      <a className="site-information-link" href="/guides">성인pc 정보글 살펴보기</a>
    </InformationSection>
    <InformationSection id="operator" title="누가 운영하나요?">
      <dl className="site-information-details">
        <div><dt>상호·사이트명</dt><dd>피씨이음</dd></div>
        <div><dt>공개 운영자명</dt><dd>{PUBLIC_OPERATOR_NAME} <span className="site-information-detail-note">운영자가 사용하는 닉네임</span></dd></div>
        <div><dt>운영 주소</dt><dd><a href="https://pcieum.com/">pcieum.com</a></dd></div>
        <div><dt>관리 범위</dt><dd>사이트 운영, 정보글 게시 및 내용 정정</dd></div>
      </dl>
      <p>정보글에 표시되는 ‘피씨이음’은 이 사이트의 발행 주체입니다. 운영자는 공개 자료의 출처와 설명을 관리하며, 오류 제보는 <a href="/contact">정정·운영 문의</a>에서 안내하는 방법으로 받습니다.</p>
    </InformationSection>
    <InformationSection id="scope" title="제공하는 정보와 확인 범위">
      <ul>
        <li><strong>매물·게시판:</strong> 공개된 게시글을 조회하고 지역, 업종과 키워드로 찾을 수 있습니다. 글이 없는 목록은 비어 있는 상태로 표시합니다.</li>
        <li><strong>정보글:</strong> 공식 출처와 자료 확인 범위를 함께 제공합니다. 특정 매장·게임·장비를 직접 검사하거나 보증했다는 뜻은 아닙니다.</li>
        <li><strong>현재 이용 범위:</strong> 로그인·회원가입, 게시글·댓글 작성과 사진 업로드는 제공하지 않습니다.</li>
      </ul>
      <p>계약이나 영업 가능 여부는 실제 서류와 현장 조건에 따라 달라질 수 있습니다. 정보글을 확인 항목을 정리하는 데 활용하고, 개별 판단이 필요한 사항은 담당 기관이나 해당 분야 전문가에게 확인하세요.</p>
    </InformationSection>
    <InformationSection id="accountability" title="출처와 수정 과정을 공개합니다">
      <p>자료의 출처, 확인한 날짜와 설명의 적용 범위를 글 안에 표시합니다. 내용에 영향을 주는 오류를 수정할 때에는 해당 글에 정정 날짜와 변경 이유를 남기는 것을 원칙으로 합니다.</p>
      <div className="site-information-actions"><a href="/editorial-policy">편집·정정 기준 보기</a><a href="/contact">오류 제보와 운영 문의</a></div>
    </InformationSection>
  </SiteInformation>;
}
