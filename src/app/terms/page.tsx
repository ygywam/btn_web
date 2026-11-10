import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '서비스 이용약관 | 북튜닝',
  description: '북튜닝(Book Tuning) 서비스 이용약관 안내',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#1E232A] px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-[#E8E3D5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>북튜닝 홈으로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              서비스 이용약관
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            시행일자: 2026년 11월 10일
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              제1조 (목적)
            </h2>
            <p>
              본 약관은 북튜닝(이하 "서비스")이 제공하는 소셜 독서 기록 및 피드 커뮤니티의 이용 조건과 절차에 관한 기본 사항을 정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              제2조 (이용자의 권리와 의무)
            </h2>
            <p>
              1. 이용자는 서비스를 자유롭게 무료로 이용할 수 있으며, 독서 기록을 개인 서재에 보관하거나 공개 피드에 나눌 수 있습니다.
            </p>
            <p>
              2. 이용자는 타인의 저작권을 존중해야 하며, 비방, 욕설, 광고성 도배 등 건전한 독서 환경을 저해하는 게시물을 등록해서는 안 됩니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              제3조 (개인정보 보호 및 무수집 원칙)
            </h2>
            <p>
              서비스는 이용자의 개인 식별 정보를 일체 수집하지 않으며, 관련 상세 사항은 별도의 <Link href="/privacy" className="text-amber-700 underline font-semibold">개인정보처리방침</Link>을 따릅니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900">
              제4조 (서비스의 변경 및 면책)
            </h2>
            <p>
              서비스는 지속적인 기능 개선을 위해 업데이트될 수 있으며, 천재지변이나 기술적 불가항력으로 인한 일시적 중단에 대해서는 면책됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
