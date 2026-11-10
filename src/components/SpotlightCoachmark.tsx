'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, X, HelpCircle } from 'lucide-react';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  postitTip: string;
}

const DEFAULT_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="search-btn"]',
    title: '1. 카카오 도서 검색',
    description: '읽고 싶은 책을 제목이나 저자로 검색해 보세요. 표지 이미지와 전체 쪽수를 자동으로 가져와 내 책장에 등록합니다.',
    postitTip: '💡 팁: 카카오 검색으로 책 표지와 저자 정보를 1초 만에 담을 수 있어요!',
  },
  {
    targetSelector: '[data-tour="reading-status"]',
    title: '2. 독서 상태 & 진도율(%) 관리',
    description: '읽는 중, 완독, 읽고 싶은 책으로 나누고, 오늘 읽은 페이지를 입력하면 실시간으로 진도율 게이지가 채워집니다.',
    postitTip: '📌 팁: 페이지 숫자만 바꾸면 퍼센트(%)가 알아서 계산돼요.',
  },
  {
    targetSelector: '[data-tour="write-post"]',
    title: '3. 문장 수집 & 기록 남기기',
    description: '책 속 감동적인 문장이나 생각을 기록하세요. [전체 공개] 스위치를 켜면 피드에 공유할 수 있습니다.',
    postitTip: '✨ 팁: 기본값은 나만 보는 "비공개"라 안심하고 솔직하게 쓸 수 있어요!',
  },
  {
    targetSelector: '[data-tour="explore-feed"]',
    title: '4. 소셜 탐색 피드 & 소통',
    description: '다른 이웃 독서가들이 공개한 문장과 독서 기록을 둘러보고 하트(좋아요)와 댓글로 따뜻하게 응원해 보세요.',
    postitTip: '💬 팁: 마음에 드는 문장에 하트를 누르면 공감이 전해져요.',
  },
];

interface SpotlightCoachmarkProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function SpotlightCoachmark({ forceOpen = false, onClose }: SpotlightCoachmarkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // 실행 조건 체크
  useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsOpen(true);
      return;
    }
    const seen = localStorage.getItem('booktuning_coachmark_done');
    // 인트로 영상이 먼저 끝난 뒤에 작동하도록 약 1초 후 체크
    const timer = setTimeout(() => {
      const introSeen = localStorage.getItem('booktuning_promo_dismissed');
      if (!seen && introSeen) {
        setIsOpen(true);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [forceOpen]);

  // 대상 요소 위치 계산
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const step = DEFAULT_STEPS[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // 화면 밖이면 부드럽게 스크롤
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < DEFAULT_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('booktuning_coachmark_done', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const step = DEFAULT_STEPS[currentStep];

  // 스포트라이트 구멍 여백 (패딩)
  const pad = 8;
  const top = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const left = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const width = targetRect ? targetRect.width + pad * 2 : 0;
  const height = targetRect ? targetRect.height + pad * 2 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* 
        스포트라이트 구멍 뚫기 SVG 마스크 
        어두운 반투명 회색 배경 위에 타깃 요소 영역만 투명하게 구멍을 냄
      */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="spotlight-mask">
            {/* 전체 흰색 (불투명 배경) */}
            <rect width="100%" height="100%" fill="white" />
            {/* 타깃 요소 구멍 (검은색 = 투명) */}
            {targetRect && (
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* 마스크를 적용한 어두운 딤 오버레이 */}
        <rect
          width="100%" height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* 타깃 박스 하이라이트 테두리 링 */}
      {targetRect && (
        <div
          className="absolute border-2 border-amber-400 rounded-2xl pointer-events-none transition-all duration-300 shadow-[0_0_25px_rgba(251,191,36,0.5)]"
          style={{
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      )}

      {/* 
        포스트잇 툴팁 카드:
        모바일에서는 하단 고정 시트 형태로 안전하게 배치,
        데스크탑에서는 타깃 위치에 따라 위/아래 스마트 플로팅
      */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-auto sm:top-24 sm:right-10 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-2xl p-5 shadow-2xl text-[#1E232A]">
          {/* 상단 포스트잇 핀 & 스텝 번호 */}
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-inner" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                가이드 튜토리얼 ({currentStep + 1} / {DEFAULT_STEPS.length})
              </span>
            </div>
            <button
              onClick={handleComplete}
              className="touch-target p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              title="가이드 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 제목 */}
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5">
            {step.title}
          </h3>

          {/* 본문 설명 */}
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed mb-3">
            {step.description}
          </p>

          {/* 포스트잇 메모 팁 박스 */}
          <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/60 text-xs text-amber-900 font-medium mb-4">
            {step.postitTip}
          </div>

          {/* 하단 컨트롤 버튼 (모바일에서 겹치지 않도록 충분한 간격과 터치 타깃 확보) */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleComplete}
              className="touch-target px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 rounded-xl hover:bg-amber-200/50 transition-colors"
            >
              건너뛰기
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="touch-target px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-amber-200/60 hover:bg-amber-200 rounded-xl flex items-center gap-1 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  이전
                </button>
              )}

              <button
                onClick={handleNext}
                className="touch-target px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
              >
                {currentStep === DEFAULT_STEPS.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" />
                    시작하기
                  </>
                ) : (
                  <>
                    다음
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
