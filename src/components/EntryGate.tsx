'use client';

import React from 'react';
import { BookOpen, Sparkles, Camera, Lock, Loader2, ArrowRight } from 'lucide-react';
import { WebGLShader } from '@/components/ui/web-gl-shader';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import AuthForm from '@/components/AuthForm';
import type { Profile } from '@/types/database';

interface EntryGateProps {
  onSuccess: (profile: Profile) => void;
}

/**
 * 앱 최초 진입 시 표시되는 WebGL 셰이더 배경의 "Tuning Your Life" 온보딩·계정 생성 화면
 * 로그인 성공 시 브라우저(localStorage 및 Supabase 세션)에 저장되어 재진입 시 생략됨
 */
export default function EntryGate({ onSuccess }: EntryGateProps) {
  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center px-3 py-8 sm:p-6 overflow-x-hidden">
      {/* Three.js WebGL 음향 파동 셰이더 배경 */}
      <WebGLShader />

      {/* 가독성을 위한 은은한 다크 비네팅 레이어 */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75 pointer-events-none"
      />

      {/* 레퍼런스 이중 프레임 히어로 컨테이너 */}
      <div className="relative z-10 border border-[#27272a] bg-black/50 backdrop-blur-md p-1.5 sm:p-2 w-full mx-auto max-w-3xl rounded-2xl shadow-2xl">
        <main className="relative border border-[#27272a] rounded-xl py-8 px-4 sm:py-10 sm:px-8 overflow-hidden">
          {/* 상단 브랜드 뱃지 */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-medium text-neutral-300">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>북튜닝 · BOOK TUNING</span>
            </div>
          </div>

          {/* 중심 영문/한글 헤드라인 */}
          <h1 className="mb-3 text-white text-center text-4xl sm:text-6xl md:text-[clamp(2.5rem,7vw,5.25rem)] font-extrabold tracking-tighter leading-none">
            Tuning Your Life
          </h1>

          <p className="text-amber-300/95 font-semibold text-center text-sm sm:text-base mb-2">
            의미 있는 독서로 삶을 기록하세요
          </p>

          <p className="text-white/65 px-2 sm:px-8 text-center text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            책 속 문장과 독서 진도를 차곡차곡 남기는 개인 서재 공간입니다.
          </p>

          {/* 상태 인디케이터 (레퍼런스 핑 모션) */}
          <div className="my-5 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-xs text-emerald-400 font-medium">
              한 번 로그인하면 다음 방문 시 바로 서재로 입장합니다
            </p>
          </div>

          {/* 핵심 가치 배지 3종 */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-300">
              <Lock className="w-3 h-3 text-amber-400" />
              기본 비공개 개인 서재
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              AI 종합 독서감상문
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-300">
              <Camera className="w-3 h-3 text-amber-400" />
              책 페이지 사진 OCR
            </span>
          </div>

          {/* 첫 화면 통합 계정 생성 / 로그인 카드 */}
          <div className="max-w-md mx-auto bg-zinc-950/75 border border-white/15 rounded-2xl p-4 sm:p-6 shadow-xl">
            <AuthForm
              defaultMode="SIGNUP"
              theme="dark"
              showNicknameOnSignup={true}
              onSuccess={onSuccess}
              renderSubmitButton={({ label, isLoading, disabled }) => (
                <div className="pt-2 flex justify-center">
                  <LiquidButton
                    type="submit"
                    disabled={disabled}
                    size="xl"
                    className="w-full text-white border border-white/30 rounded-full font-bold tracking-tight"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </LiquidButton>
                </div>
              )}
            />
          </div>

          {/* 하단 운영자 정보 및 방침·약관 링크 */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
            <span>운영: 조용희(서울외고, 활동명: 기록조율사 · @record_tuner)</span>
            <span>·</span>
            <a href="/privacy" className="hover:text-amber-300 underline underline-offset-2 transition-colors">
              개인정보처리방침
            </a>
            <span>·</span>
            <a href="/terms" className="hover:text-amber-300 underline underline-offset-2 transition-colors">
              이용약관
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
