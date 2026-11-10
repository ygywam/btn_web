import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: '개인정보처리방침 | 북튜닝',
  description: '북튜닝은 이용자의 어떠한 고유식별정보나 민감한 개인정보도 수집하지 않는 무수집 원칙을 준수합니다.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#1E232A] px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-[#E8E3D5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* 상단 뒤로가기 및 타이틀 */}
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
              개인정보처리방침
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            시행일자: 2026년 11월 10일 (최종 업데이트)
          </p>
        </div>

        {/* 핵심 강조 박스: 개인정보 무수집 원칙 */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>북튜닝의 핵심 원칙: "개인정보를 일체 수집하지 않습니다"</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed pl-7">
            북튜닝(Book Tuning)은 이용자의 <strong>이름, 주민등록번호, 연락처, 생년월일, 주소 등 개인을 식별할 수 있는 일체의 고유식별정보를 요구하거나 서버에 수집·저장하지 않습니다.</strong> 누구나 정보 유출 걱정 없이 안전하고 자유롭게 독서 활동에만 몰입할 수 있도록 설계되었습니다.
          </p>
        </div>

        {/* 세부 조항들 */}
        <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              1. 수집하는 개인정보 항목
            </h2>
            <p>
              북튜닝은 회원가입이나 서비스 이용 과정에서 어떠한 개인정보도 수집하지 않습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li><strong>필수 수집 정보:</strong> 없음 (실명, 전화번호, 주민등록번호 일체 미수집)</li>
              <li><strong>선택 활동 정보:</strong> 독서 기록 작성 시 사용할 임의의 닉네임 (실명이 아니어도 무방함)</li>
              <li><strong>자동 수집 정보:</strong> 서비스 안정성을 위한 표준 접속 로그 외에 개인을 추적하는 쿠키나 트래커는 사용하지 않습니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              2. 독서 기록 및 데이터의 보관 원칙
            </h2>
            <p>
              이용자가 등록한 도서, 읽은 쪽수(%), 수집한 책 속 문장 및 독서 메모는 다음과 같이 안전하게 격리 보관됩니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>
                <strong>기본 비공개(나만 보기) 원칙:</strong> 모든 서재 데이터는 기본적으로 비공개 상태로 안전하게 보관되며, 본인 외의 다른 이용자나 외부에 절대 노출되지 않습니다.
              </li>
              <li>
                <strong>이용자 선택 공개:</strong> 이용자가 본인의 명시적인 선택으로 <em>[전체 공개]</em> 스위치를 켠 특정 문장과 감상글에 한해서만 소셜 피드(Explore)에 익명으로 공유됩니다.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              3. 개인정보의 제3자 제공 및 위탁 없음
            </h2>
            <p>
              북튜닝은 수집된 어떠한 데이터도 영리 목적, 광고 마케팅, 데이터 브로커 등 제3자에게 판매하거나 제공·위탁하지 않습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              4. 데이터의 파기 및 이용자 권리
            </h2>
            <p>
              이용자는 언제든지 본인이 작성한 독서 기록이나 책 목록을 수정 또는 삭제할 수 있습니다. 브라우저의 로컬 데이터를 초기화하거나 로그아웃 시 저장된 활동 정보는 즉시 파기 처리됩니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              5. 학교 및 공공 교육 환경에서의 이용 적합성
            </h2>
            <p>
              본 서비스는 학생과 교사가 안전하게 독서 습관을 형성할 수 있도록 개인정보 최소화(무수집) 가이드라인을 준수합니다. 미성년자의 개인정보 침해 우려 없이 안심하고 활용하실 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              6. 문의 및 담당 안내
            </h2>
            <p>
              북튜닝의 개인정보 보호 및 서비스 이용과 관련된 문의사항은 언제든지 아래 채널로 문의해 주시기 바랍니다.
            </p>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
              <p>서비스명: 북튜닝 (Book Tuning)</p>
              <p>웹사이트: <a href="https://btnweb.vercel.app" className="text-amber-700 underline">https://btnweb.vercel.app</a></p>
              <p>담당: 북튜닝 운영팀</p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
