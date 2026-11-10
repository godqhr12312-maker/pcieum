import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';
import { CORRECTION_REQUEST_TEMPLATE, correctionEmailHref, PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_LABEL, PUBLIC_CONTACT_URL, PUBLIC_OPERATOR_NAME, SITE_INFORMATION_PAGES } from '@/lib/site-information';
import { InformationSection, SiteInformation } from '../components/SiteInformation';

const page = SITE_INFORMATION_PAGES.contact;
export async function generateMetadata(): Promise<Metadata> { return createPageMetadata(page); }

export default function ContactPage() {
  const emailHref = correctionEmailHref();
  const contactAvailable = !!(emailHref || PUBLIC_CONTACT_URL);
  return <SiteInformation page={page} heading="정정 요청과 운영 문의">
    <InformationSection id="channel" title="오류를 발견하셨나요?">
      <p>정보글에서 사실과 다른 내용이나 변경된 자료를 발견하셨다면 대상 페이지와 근거를 함께 알려주세요. 피씨이음 운영자 {PUBLIC_OPERATOR_NAME}가 확인할 수 있도록 필요한 내용을 아래에 정리했습니다.</p>
      {contactAvailable ? <div className="site-information-contact-card">
        <span className="site-information-contact-label">피씨이음 공식 문의처</span>
        {emailHref && <><a className="site-information-contact-address" href={emailHref}>{PUBLIC_CONTACT_EMAIL}</a><p>이메일 링크를 누르면 메일 앱에 제목과 문의 양식이 입력됩니다. 내용을 작성한 뒤 직접 보내주세요.</p><a className="btn btn-primary" href={emailHref}>이메일로 정정·운영 문의</a></>}
        {PUBLIC_CONTACT_URL && <><a className="site-information-contact-address" href={PUBLIC_CONTACT_URL} target="_blank" rel="noopener noreferrer">{PUBLIC_CONTACT_LABEL}<span className="sr-only"> (새 창)</span></a><p>피씨이음 회원가입 없이 문의처를 확인할 수 있습니다. 메시지를 보내려면 텔레그램 계정이 필요합니다. 아래 양식의 내용을 적어 직접 보내주세요.</p><a className="btn btn-primary" href={PUBLIC_CONTACT_URL} target="_blank" rel="noopener noreferrer">텔레그램으로 정정·운영 문의<span className="sr-only"> (새 창)</span></a></>}
      </div> : <div className="site-information-contact-card"><strong>공개 문의처를 준비하고 있습니다.</strong><p>현재 이 페이지에서는 문의를 접수하지 않습니다. 실제로 연락할 수 있는 채널이 정해지면 이곳에 안내합니다.</p></div>}
    </InformationSection>
    <InformationSection id="request" title="이 내용을 함께 보내주세요">
      <ol>
        <li><strong>페이지 주소:</strong> 문제가 있는 정보글이나 화면의 URL</li>
        <li><strong>확인할 내용:</strong> 문장이나 항목을 그대로 적고, 어떤 부분이 다른지 설명</li>
        <li><strong>근거 자료:</strong> 공식 문서 링크, 문서명과 확인한 날짜</li>
        <li><strong>연락 방법:</strong> 답변이 필요하면 회신받을 연락처</li>
      </ol>
      <p>아래 양식을 복사해 사용할 수 있습니다. 웹사이트에 제출되는 입력창은 아닙니다.</p>
      <pre className="site-information-template">{CORRECTION_REQUEST_TEMPLATE}</pre>
    </InformationSection>
    <InformationSection id="handling" title="어떻게 확인하나요?">
      <p>문의 대상과 근거를 확인한 뒤 관련 원문을 대조합니다. 내용을 수정할 필요가 확인되면 해당 글을 보완하고, 의미에 영향을 주는 정정은 날짜와 변경 이유를 함께 남깁니다.</p>
      <p>처리에 필요한 시간은 자료와 문의 내용에 따라 달라집니다. 게시글의 정정 여부는 확인한 근거에 따라 결정되며, 자세한 원칙은 <a href="/editorial-policy#corrections">편집·정정 기준</a>에서 확인할 수 있습니다.</p>
    </InformationSection>
    <InformationSection id="privacy" title="필요한 정보만 보내주세요">
      <p>주민등록번호, 비밀번호, 인증번호, 계좌 전체 내역이나 계약서 원본은 보내지 마세요. 자료에 다른 사람의 이름·연락처 등 개인정보가 있으면 가린 뒤 필요한 부분만 공유해 주세요.</p>
      <p>이 페이지에는 접수 양식이나 파일 업로드 기능이 없습니다. 외부 메일·문의 채널을 이용할 때에는 해당 서비스의 정보 처리 안내도 함께 확인해 주세요. 전달한 문의는 내용 확인과 답변에 필요한 범위에서 다루며, 문의자의 연락처를 정정 내역에 공개하지 않습니다.</p>
      <a className="site-information-link" href="/privacy">사이트 개인정보 안내</a>
    </InformationSection>
  </SiteInformation>;
}
