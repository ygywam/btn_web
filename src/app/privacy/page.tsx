import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: '개인정보처리방침 | 북튜닝',
  description:
    '북튜닝(Book Tuning)의 개인정보 최소 수집 원칙, Supabase 인증·데이터 처리 구조, 외부 API 비식별 전송 및 보호책임자 안내',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#1E232A] px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-[#E8E3D5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-7">
        {/* 상단 뒤로가기 및 제목 */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>북튜닝 홈으로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              북튜닝 개인정보처리방침
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            시행일자: 2026년 11월 11일 · 「개인정보 보호법」 제30조 기준 준용
          </p>
        </div>

        {/* 핵심 원칙 요약 박스 */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>최소 수집 · 비식별 외부 전송 원칙</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed pl-7">
            북튜닝(Book Tuning)은 회원가입 및 로그인 유지에 필요한 최소 정보(이메일·사용자 지정 닉네임)만{' '}
            <strong>Supabase 인증 체계</strong>로 처리하며,{' '}
            <strong>실명·주민등록번호·전화번호·생년월일·주소·학번 등 고유식별정보와 민감정보는 수집하지 않습니다.</strong>{' '}
            도서 검색·사진 글자 추출(OCR)·AI 독서노트 등 외부 API 호출 시에도 계정 이메일이나 개인 식별 정보는 함께 전송하지 않습니다.
          </p>
        </div>

        {/* 조문 본문 */}
        <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제1조 (총칙 및 데이터 처리 구조)
            </h2>
            <p>
              북튜닝(이하 &quot;서비스&quot;)은 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령을 준수하며,
              실제 앱 동작에 맞춰 데이터를 아래와 같이 구분해 처리합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>
                <strong>계정 인증 및 프로필 정보(Supabase):</strong> 이메일 또는 Google 로그인 시 인증 유지에 필요한 식별 값과 사용자가 직접 입력한 닉네임(2~10자)만 처리·저장합니다.
              </li>
              <li>
                <strong>서재 및 독서 기록 데이터:</strong> 등록한 도서, 읽은 쪽수, 수집 문장, 메모는 현재 이용자의 기기 브라우저 저장소(localStorage)에 우선 저장되며, 데이터베이스 연동 및 공개 피드 기능에서도 기본 비공개(나만 보기)와 행 단위 보안 정책(RLS)을 기준으로 본인만 조회·수정·삭제할 수 있습니다. (단, 이용자가 직접 [전체 공개]를 켠 글만 피드에 표시됩니다.)
              </li>
              <li>
                <strong>외부 API 비식별 요청:</strong> 도서 검색, 사진 글자 인식(OCR), AI 감상문·분석 요청 시 기능 수행에 필요한 검색어·이미지·도서/기록 본문만 전송하고, 사용자 계정 정보나 개인식별정보는 포함하지 않습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제2조 (처리하는 개인정보 항목 및 비수집 항목)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>
                <strong>이메일 회원가입·로그인 시(Supabase Auth):</strong> 이메일 주소, 비밀번호(암호화 해시 처리), 인증 고유 식별자(UUID)
              </li>
              <li>
                <strong>Google 로그인 시(Supabase OAuth):</strong> 이메일 주소, Google 인증 식별자, 기본 프로필 아이콘 주소(제공 시)
              </li>
              <li>
                <strong>서비스 프로필(`profiles` 테이블):</strong> 사용자가 직접 입력·변경하는 활동 닉네임(실명 불필요)
              </li>
              <li>
                <strong>이용자가 생성하는 비식별 콘텐츠:</strong> 도서 제목·저자·출판사·전체 쪽수, 현재 읽은 쪽수, 수집 문장, 독서 메모, 공개 피드 좋아요·댓글 내용
              </li>
              <li>
                <strong>수집하지 않는 정보:</strong> 주민등록번호, 실명, 휴대전화번호, 생년월일, 자택 주소, 학교명·학년·반·번호 등 고유식별정보 및 사생활·건강·금융 등 민감정보 일체
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제3조 (개인정보의 처리 목적)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>회원 가입 의사 확인, 본인 계정 식별 및 로그인 세션 유지</li>
              <li>공개 피드·댓글 작성자 표기용 활동 닉네임 표시 및 변경 지원</li>
              <li>도서 검색, 독서 진도 계산, 사진 텍스트 인식(OCR), AI 독서노트 등 서비스 기능 제공</li>
              <li>비정상 접근 차단 및 서비스 보안 유지</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제4조 (처리·보유 기간 및 파기 절차와 방법)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>
                <strong>계정 및 닉네임 정보:</strong> 회원 탈퇴 또는 삭제 요청 시까지 보유하며, 요청 접수 후 지체 없이 복구 불가능한 방식으로 영구 삭제합니다.
              </li>
              <li>
                <strong>브라우저 로컬 저장 데이터:</strong> 로그아웃하거나 브라우저 저장소(캐시·사이트 데이터)를 지우면 기기에서 즉시 삭제됩니다.
              </li>
              <li>
                <strong>OCR 이미지 및 AI 요청 본문:</strong> 텍스트 추출 및 감상문 생성을 위한 일회성 응답 처리에만 사용하며, 서비스 자체 서버에 이미지나 로그로 별도 장기 보관하지 않습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제5조 (개인정보의 제3자 제공)
            </h2>
            <p>
              서비스는 이용자의 개인정보를 광고, 마케팅, 데이터 판매 등의 목적으로 제3자에게 제공하지 않습니다.
              법령에 근거해 수사기관 등이 적법한 절차로 요청하는 경우에만 예외적으로 관계 법령에 따릅니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제6조 (개인정보 처리의 위탁 및 외부 API·국외 이전 안내)
            </h2>
            <p>
              서비스는 안정적인 인증·호스팅 및 부가 기능 제공을 위해 아래 외부 서비스에 일부 데이터 처리를 위탁하거나 비식별 요청을 전송합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
              <li>
                <strong>Supabase Inc. (인증 및 데이터베이스 위탁·국외 이전):</strong> 이메일 인증(Auth), 프로필 닉네임(`profiles`) 보관. 클라우드 리전 설정에 따라 미국 등 해외 서버에서 처리될 수 있으며, 회원 탈퇴 시 파기됩니다.
              </li>
              <li>
                <strong>Vercel Inc. (웹 호스팅 및 서버리스 실행·국외 이전):</strong> 웹 화면 및 API 라우트 실행을 위한 HTTPS 요청 중계(전송 구간 외 영구 저장 안 함).
              </li>
              <li>
                <strong>주식회사 카카오 (카카오 도서 검색 API):</strong> 이용자가 입력한 <strong>도서 검색어(제목·저자)만</strong> 전달하며, 사용자 이메일·닉네임 등 개인정보는 전송하지 않습니다.
              </li>
              <li>
                <strong>Google LLC (Google Gemini API · 책 사진 OCR, 국외 이전 가능):</strong> 이용자가 [책 사진 스캔]을 직접 누른 경우에만 <strong>선택한 책 페이지 이미지</strong>를 글자 추출 목적으로 일시 전송하며, 계정 식별정보는 포함하지 않고 서비스 서버에도 저장하지 않습니다.
              </li>
              <li>
                <strong>LG AI Research (EXAONE AI API):</strong> 이용자가 AI 독서노트·독서 성향 분석을 실행한 경우에만 <strong>도서 정보와 비식별 문장·메모 본문</strong>을 전송하며, 이메일·실명·계정 ID는 전송하지 않습니다.
              </li>
            </ul>
            <p className="text-xs text-neutral-500">
              ※ 이용자는 사진 스캔 및 AI 기능을 사용하지 않거나 계정 삭제를 요청함으로써 외부 API 전송 및 국외 이전을 거부할 수 있습니다. 또한 메모 작성이나 책 사진 촬영 시 본인·타인의 실명, 연락처, 얼굴, 신분증 등 개인정보가 포함되지 않도록 주의해 주세요.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제7조 (정보주체의 권리·의무 및 행사 방법)
            </h2>
            <p>
              이용자는 언제든지 상단 프로필 버튼에서 닉네임을 직접 수정하거나 작성한 독서 기록을 수정·삭제할 수 있으며,
              계정 및 저장 정보의 열람·정정·삭제·처리정지를 아래 제10조 연락처로 요구할 수 있습니다.
              요구 접수 시 정당한 사유가 없는 한 <strong>10일 이내</strong>에 조치하고 결과를 안내합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제8조 (만 14세 미만 아동의 개인정보 보호)
            </h2>
            <p>
              본 서비스는 회원가입 단계에서 별도의 법정대리인 동의 인증 절차를 운영하고 있지 않으므로,{' '}
              <strong>만 14세 미만 아동이 단독으로 계정을 생성하거나 개인정보를 입력하는 것을 지양하며 수집 대상으로 삼지 않습니다.</strong>{' '}
              학교·교육 현장에서 활용하는 경우 교사 또는 보호자의 지도 아래 실명·연락처 등 식별정보를 입력하지 않는 범위에서 이용하도록 안내하며,
              법정대리인이 아동의 계정·데이터 삭제를 요청할 경우 지체 없이 파기합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제9조 (개인정보의 안전성 확보 조치)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>
                <strong>관리적 조치:</strong> 개인 개발·운영 서비스로서 데이터 접근 권한을 운영자 1인으로 최소화하고, 기능별 최소·비식별 전송 원칙 적용
              </li>
              <li>
                <strong>기술적 조치:</strong> 전 구간 HTTPS(SSL/TLS) 암호화 통신, 보안 응답 헤더(`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) 적용, Supabase 행 단위 보안 정책(RLS)을 통한 비공개 서재 데이터 격리, 비밀번호 단방향 암호화 저장
              </li>
              <li>
                <strong>물리적 조치:</strong> 클라우드 인프라(Supabase·Vercel)의 물리적 접근 통제 및 보안 표준 준수
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제10조 (개발·운영자 및 개인정보 보호책임자 안내)
            </h2>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1">
              <p>
                <strong>서비스명:</strong> 북튜닝 (Book Tuning)
              </p>
              <p>
                <strong>개발 · 운영자 / 개인정보 보호책임자:</strong> 조용희 (서울외국어고등학교, 활동명: 기록조율사)
              </p>
              <p>
                <strong>인스타그램:</strong> @record_tuner
              </p>
              <p>
                <strong>이메일(열람·삭제·문의):</strong> ygywam@naver.com
              </p>
              <p>
                <strong>웹사이트:</strong>{' '}
                <a href="https://btnweb.vercel.app" className="text-amber-700 underline">
                  https://btnweb.vercel.app
                </a>
              </p>
            </div>
            <p className="text-xs text-neutral-500">
              개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보분쟁조정위원회(국번 없이 1833-6972, www.kopico.go.kr) 또는
              개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr)에 문의하실 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제11조 (개인정보처리방침의 변경)
            </h2>
            <p>
              본 개인정보처리방침이 변경될 경우 시행일 최소 7일 전부터 서비스 화면 또는 본 페이지를 통해 사전 공지합니다.
            </p>
            <p className="text-xs text-neutral-500 pt-1">
              부칙: 이 개인정보처리방침은 2026년 11월 11일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
