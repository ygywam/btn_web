import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '서비스 이용약관 | 북튜닝',
  description: '북튜닝(Book Tuning) 서비스 이용약관 및 운영자 안내',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#1E232A] px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-[#E8E3D5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-7">
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
              북튜닝 서비스 이용약관
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            시행일자: 2026년 11월 11일 · 운영: 조용희(서울외고, 활동명: 기록조율사 · @record_tuner)
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제1조 (목적)
            </h2>
            <p>
              본 약관은 북튜닝(이하 &quot;서비스&quot;)의 이용 조건과 절차, 이용자와 운영자의 권리·의무 및 책임 사항을 정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제2조 (정의)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>
                &quot;서비스&quot;란 개발·운영자 <strong>조용희(서울외고, 활동명: 기록조율사 · @record_tuner)</strong>가 제공하는 도서 검색, 개인 서재, 독서 진도·문장 기록, 사진 글자 인식(OCR), AI 독서노트 및 선택형 공개 피드 웹 애플리케이션을 말합니다.
              </li>
              <li>
                &quot;이용자&quot;란 본 약관에 따라 서비스에 접속해 독서 기록 및 커뮤니티 기능을 이용하는 회원을 말합니다.
              </li>
              <li>이 약관에서 정하지 않은 용어는 관계 법령과 일반 관례에 따릅니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제3조 (서비스의 이용 및 변경)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>이용자는 도서 등록, 쪽수 진도 관리, 문장 수집, 사진 스캔(OCR), AI 독서노트 초안 정리 및 공개 피드 기능을 무료로 이용할 수 있습니다.</li>
              <li>작성하는 책 목록과 독서 기록은 기본 비공개(나만 보기)로 설정되며, 이용자가 직접 [전체 공개]를 선택한 글만 공개 피드에 게시됩니다.</li>
              <li>운영자는 기능 개선이나 외부 API 정책 변경에 따라 서비스의 일부 또는 전부를 수정·중단할 수 있으며, 중요한 변경은 사전에 공지합니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제4조 (이용자의 의무)
            </h2>
            <p>이용자는 다음 각 호에 해당하는 행위를 해서는 안 됩니다.</p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>타인의 이메일·계정을 도용하거나 허위 정보를 입력하는 행위</li>
              <li>서비스의 정상 운영을 방해하거나 시스템 무단 접근·대량 크롤링·무단 복제·재배포를 시도하는 행위</li>
              <li>타인의 저작권(도서 본문 전체 무단 복제·배포 등)을 침해하거나 욕설·비방·광고성 게시물을 공개 피드에 올리는 행위</li>
              <li>
                <strong>[책 사진 스캔] 및 독서 기록 작성 시 본인 또는 타인의 실명, 연락처, 주소, 얼굴 사진, 신분증 등 개인정보를 촬영·입력하는 행위</strong>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제5조 (책임의 제한)
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>운영자는 천재지변, 정전, 클라우드·호스팅(Vercel·Supabase) 및 외부 API(카카오·Google Gemini·EXAONE) 장애 등 통제할 수 없는 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>본 서비스는 무료 비영리 개인·교육 목적의 프로젝트로 제공되며, AI 생성 감상문이나 OCR 인식 결과, 도서 메타데이터의 완전성·정확성이나 상시 데이터 백업을 보증하지 않습니다.</li>
              <li>이용자가 공개 피드에 게시한 내용과 이용자 간 분쟁에 대해서는 게시자 본인에게 책임이 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제6조 (개인정보의 보호)
            </h2>
            <p>
              서비스는 관계 법령에 따라 최소한의 정보만 처리하며, Supabase 및 외부 API 전송 내역과 안전조치 등 상세 사항은 별도의{' '}
              <Link href="/privacy" className="text-amber-700 underline font-semibold">
                개인정보처리방침
              </Link>
              에서 정합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제7조 (약관의 변경)
            </h2>
            <p>
              운영자는 관계 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 적용 내용과 시행일을 시행일 <strong>7일 전</strong>부터 서비스 내에 공지합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-neutral-900 border-b border-neutral-100 pb-1.5">
              제8조 (준거법·분쟁 해결 및 운영자 안내)
            </h2>
            <p>
              본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은 관계 법령이 정한 절차에 따라 해결합니다.
            </p>
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1">
              <p><strong>개발 · 운영자:</strong> 조용희 (서울외국어고등학교, 활동명: 기록조율사)</p>
              <p><strong>인스타그램:</strong> @record_tuner</p>
              <p>
                <strong>웹사이트:</strong>{' '}
                <a href="https://btnweb.vercel.app" className="text-amber-700 underline">
                  https://btnweb.vercel.app
                </a>
              </p>
            </div>
            <p className="text-xs text-neutral-500 pt-1">
              부칙: 이 이용약관은 2026년 11월 11일부터 시행합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
