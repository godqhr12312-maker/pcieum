import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { PUBLIC_OPERATOR_NAME, SITE_INFORMATION_PAGES } from '@/lib/site-information';
import { InformationSection, SiteInformation } from '../components/SiteInformation';

const page = SITE_INFORMATION_PAGES.editorial;
export async function generateMetadata(): Promise<Metadata> { return createPageMetadata(page); }

export default function EditorialPolicyPage() {
  return <SiteInformation page={page} heading="정보글 편집·정정 기준">
    <InformationSection id="responsibility" title="적용 대상과 관리 책임">
      <p>이 기준은 피씨이음이 작성·발행하는 정보글에 적용합니다. 공개 운영자 {PUBLIC_OPERATOR_NAME}가 정보글의 게시와 정정 내용을 관리합니다. 매물 작성자의 설명이나 외부 사이트의 주장은 피씨이음이 직접 확인한 사실과 구분합니다.</p>
      <p>이용자가 원문을 확인하고, 무엇이 확인된 내용이며 무엇을 추가로 확인해야 하는지 알 수 있도록 작성합니다.</p>
    </InformationSection>
    <InformationSection id="sources" title="1. 원문과 공식 출처를 우선합니다">
      <ul>
        <li>법령·행정 절차는 국가법령정보센터, 담당 행정기관과 공공기관의 안내를 우선 확인합니다.</li>
        <li>제품 기능·지원 조건은 제조사와 서비스 제공자의 공식 문서를 우선 확인합니다.</li>
        <li>출처의 기관명, 문서명과 링크를 글에 표시하고, 중요한 설명 가까이에 관련 출처를 연결합니다.</li>
        <li>자료의 날짜, 적용 대상이나 전제가 다르면 차이를 설명합니다. 확인되지 않은 내용을 확정된 사실처럼 쓰지 않습니다.</li>
      </ul>
    </InformationSection>
    <InformationSection id="distinctions" title="2. 사실·제안·확인 범위를 구분합니다">
      <p>출처에서 확인한 설명과 피씨이음이 제안하는 체크리스트·비교 방법을 구분합니다. 실제 측정이나 현장 확인 없이 성능 수치, 매출, 거래 성과나 점검 결과를 만들어 넣지 않습니다.</p>
      <p>법령 안내는 자료에서 확인한 일반 기준을 설명합니다. 개별 매장의 적법성, 계약의 안전성이나 수익성을 판정하는 내용으로 제시하지 않습니다. 별도의 전문가 검수를 받았다고 표시하지 않은 글은 전문가의 개별 검토를 거친 것으로 해석해서는 안 됩니다.</p>
    </InformationSection>
    <InformationSection id="dates" title="3. 게시일과 자료 확인일을 표시합니다">
      <p>정보글에는 최초 게시일과 최종 확인일을 표시합니다. 법령의 시행일, 제품 지원 종료일처럼 내용 이해에 필요한 시점은 본문이나 출처 설명에 함께 적습니다.</p>
      <p>페이지를 다시 배포했다는 이유만으로 자료 확인일을 갱신하지 않습니다. 자료를 다시 확인하거나 내용을 바꿨을 때 변경에 맞는 날짜를 기록합니다.</p>
    </InformationSection>
    <InformationSection id="ai" title="4. AI 도구의 활용 범위를 밝힙니다">
      <p>피씨이음은 정보글의 초안 정리와 사이트 구현에 AI 도구를 활용합니다. AI가 생성한 문장 자체를 사실의 근거로 삼지 않고, 글에 연결한 공식 자료를 확인 대상으로 사용합니다.</p>
      <p>AI 활용이 전문가 검수나 현장 검증을 대신하지 않습니다. 근거가 불분명한 설명은 범위를 좁히거나 제외하며, 오류가 확인되면 아래 정정 기준에 따라 수정합니다.</p>
    </InformationSection>
    <InformationSection id="corrections" title="5. 오류를 확인하고 변경 이유를 남깁니다">
      <ol className="site-information-steps">
        <li><strong>제보 내용 확인</strong><span>대상 페이지와 문장, 제시된 근거를 읽고 어떤 사실이나 설명을 다시 확인해야 하는지 정리합니다.</span></li>
        <li><strong>원문 대조</strong><span>관련 공식 자료와 적용 날짜·범위를 대조합니다. 자료가 부족하거나 서로 다른 경우에는 확인되지 않은 부분을 구분합니다.</span></li>
        <li><strong>수정과 기록</strong><span>의미에 영향을 주는 오류는 해당 글에 정정 날짜, 변경한 내용과 이유를 남깁니다. 자료 변경에 따른 보완은 오류 정정과 구분해 안내합니다.</span></li>
      </ol>
      <p>뜻이 바뀌지 않는 오탈자나 서식 수정은 별도 정정 내역 없이 바로잡을 수 있습니다. 내용에 영향을 주는 제보의 처리 결과는 확인한 근거에 따라 결정하며, 접수만으로 제안한 내용이 그대로 반영되는 것은 아닙니다.</p>
      <a className="site-information-link" href="/contact">정정 요청 방법 확인하기</a>
    </InformationSection>
    <InformationSection id="commercial" title="6. 광고와 편집 내용을 구분합니다">
      <p>대가를 받은 소개나 제휴 관계가 있는 콘텐츠를 발행할 경우 그 사실을 해당 콘텐츠에 표시합니다. 소개 대상의 광고 문구와 피씨이음의 설명을 구분하고, 확인되지 않은 성과나 보증을 덧붙이지 않습니다.</p>
    </InformationSection>
  </SiteInformation>;
}
