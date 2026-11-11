'use client';

import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useId } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  postitTip?: string;
  tab?: 'library' | 'feed' | 'analytics';
}

export const DEFAULT_NAVBAR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="reading-status"]',
    title: '1. 내 서재 탭',
    description: '등록한 책 목록을 읽는 중·완독·읽고 싶은 책으로 나누어 관리하고 읽은 쪽수를 기록합니다.',
    postitTip: '로그인한 계정과 연결되어 다른 PC·모바일에서도 그대로 이어집니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="explore-feed"]',
    title: '2. 공개 피드 탭',
    description: '다른 독서가가 전체 공개로 남긴 문장과 독서 감상을 둘러보는 공간입니다.',
    postitTip: '하트(공감)와 댓글로 의견을 나눌 수 있습니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="analytics-tab"]',
    title: '3. 독서 통계 탭',
    description: '완독한 책 수, 누적 읽은 쪽수, 많이 만난 작가와 AI 독서 성향 분석을 확인합니다.',
    postitTip: '진도율 100%를 채우면 완독 목록에 자동 추가됩니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="search-btn"]',
    title: '4. 도서 검색',
    description: '책 제목이나 저자를 검색해 표지 정보를 불러오고 전체 쪽수를 입력해 서재에 담습니다.',
    postitTip: '서재에 책을 먼저 등록해야 책별 감상문을 묶을 수 있습니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="write-post"]',
    title: '5. 기록하기',
    description: '문장 수집, 진도·메모, 자유 단상을 남깁니다. 기록 창 우측 상단의 [사용법]에서 세부 기능도 볼 수 있습니다.',
    postitTip: '기본값은 나만 보는 비공개입니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="tour-btn"]',
    title: '6. 사용법 가이드',
    description: '상단 버튼과 본문 영역 설명 포스트잇을 언제든 다시 실행합니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="nickname-btn"]',
    title: '7. 닉네임 확인 & 변경',
    description: '현재 로그인된 활동 닉네임을 보여줍니다. 클릭하면 언제든 원하는 닉네임(2~10자)으로 바꿀 수 있습니다.',
    postitTip: '공개 피드와 댓글에 이 닉네임이 표시됩니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="logout-btn"]',
    title: '8. 로그아웃',
    description: '현재 계정을 로그아웃하고 첫 로그인 화면으로 돌아갑니다.',
    postitTip: '학교 등 공용 컴퓨터에서는 사용 후 꼭 로그아웃해 주세요.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="library-stats"]',
    title: '9. 독서 현황 요약 (클릭 가능)',
    description: '읽고 있는 책, 완독한 책, 수집한 문장 개수를 한눈에 보여줍니다. 각 항목을 누르면 세부 목록 창이 열립니다.',
    postitTip: '각 카드를 눌러 지금 읽는 책과 모은 문장을 바로 확인해 보세요.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="library-filters"]',
    title: '10. 독서 상태 필터',
    description: '전체 책장·읽는 중·완독·읽고 싶은 책 버튼으로 서재에 담긴 책들을 상태별로 골라 봅니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="library-shelf"]',
    title: '11. 내 책장 & 진도 조절',
    description: '각 책 카드에서 현재 쪽수를 직접 입력하거나 -5 / +5 / +10 버튼으로 진도를 올릴 수 있으며, 종합 감상문과 기록 쓰기도 바로 실행됩니다.',
    postitTip: '쪽수가 전체 쪽수에 도달하면 자동으로 완독 상태가 됩니다.',
    tab: 'library',
  },
  {
    targetSelector: '[data-tour="feed-section"]',
    title: '12. 공개 피드 타임라인',
    description: '전체 공개로 설정된 문장과 단상들이 날짜순으로 모이는 커뮤니티 공간입니다.',
    postitTip: '내가 쓴 글도 공개 스위치를 켜지 않으면 피드에 올라가지 않습니다.',
    tab: 'feed',
  },
  {
    targetSelector: '[data-tour="analytics-section"]',
    title: '13. 독서 통계 & AI 추천',
    description: '상단 통계 카드를 눌러 세부 내역을 확인하고, AI 독서 비서 버튼을 눌러 나의 독서 성향 리포트와 맞춤 도서 3권을 추천받습니다.',
    postitTip: '추천받은 도서는 [책장에 바로 담기]로 즉시 검색·등록할 수 있습니다.',
    tab: 'analytics',
  },
];

interface SpotlightCoachmarkProps {
  forceOpen?: boolean;
  onClose?: () => void;
  steps?: TourStep[];
  onStepChange?: (step: TourStep, index: number) => void;
  /** localStorage 자동 실행 플래그 키 (undefined면 자동 실행 없이 forceOpen으로만 제어) */
  storageKey?: string;
  badgeLabel?: string;
  zIndexClass?: string;
}

export default function SpotlightCoachmark({
  forceOpen = false,
  onClose,
  steps = DEFAULT_NAVBAR_STEPS,
  onStepChange,
  storageKey = 'booktuning_coachmark_done',
  badgeLabel = '사용법 안내',
  zIndexClass = 'z-50',
}: SpotlightCoachmarkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [cardHeight, setCardHeight] = useState(240);
  const cardRef = useRef<HTMLDivElement>(null);
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;
  const maskId = useId();

  // 실행 조건 체크
  useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsOpen(true);
      return;
    }
    if (!storageKey) return;

    const seen = localStorage.getItem(storageKey);
    const timer = setTimeout(() => {
      if (!seen) {
        setCurrentStep(0);
        setIsOpen(true);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [forceOpen, storageKey]);

  // 단계 변경 시 상위 탭 전환 등 콜백 실행
  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStep];
    if (step && onStepChangeRef.current) {
      onStepChangeRef.current(step, currentStep);
    }
  }, [isOpen, currentStep, steps]);

  // 대상 요소 위치 계산 및 필요 시 뷰포트 안으로 스크롤
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    setViewport({ width: window.innerWidth, height: window.innerHeight });

    const step = steps[currentStep];
    if (!step) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // 스티키 헤더 등 이미 화면 안에 있는 요소는 불필요하게 스크롤하지 않음
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        requestAnimationFrame(() => {
          setTargetRect(el.getBoundingClientRect());
        });
      } else {
        setTargetRect(rect);
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep, steps]);

  useEffect(() => {
    updateTargetPosition();
    const rafId = requestAnimationFrame(() => updateTargetPosition());
    const delayedId = setTimeout(() => updateTargetPosition(), 80);
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(delayedId);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  // 포스트잇 높이 측정 (하단 잘림/버튼 가림 방지)
  useLayoutEffect(() => {
    if (isOpen && cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight);
    }
  }, [isOpen, currentStep, viewport.width]);

  const handleComplete = useCallback(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  }, [storageKey, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];

  // 스포트라이트 구멍 여백
  const pad = 6;
  const spotTop = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const spotLeft = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const spotWidth = targetRect ? targetRect.width + pad * 2 : 0;
  const spotHeight = targetRect ? targetRect.height + pad * 2 : 0;

  // 포스트잇 카드가 타깃 버튼을 따라다니도록 동적 좌표 계산
  const edgeMargin = 12;
  const gap = 14;
  const cardWidth = Math.min(360, Math.max(260, viewport.width - edgeMargin * 2));

  let cardLeft = Math.max(edgeMargin, (viewport.width - cardWidth) / 2);
  let cardTop = Math.max(edgeMargin, (viewport.height - cardHeight) / 2);
  let placement: 'bottom' | 'top' | 'none' = 'none';
  let arrowLeft = cardWidth / 2;

  if (targetRect) {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    // 수평 위치: 타깃 중심에 맞추되 화면 양끝 밖으로 나가지 않게 클램프
    cardLeft = Math.max(
      edgeMargin,
      Math.min(viewport.width - cardWidth - edgeMargin, targetCenterX - cardWidth / 2)
    );

    const spaceBelow = viewport.height - targetRect.bottom - gap - edgeMargin;
    const spaceAbove = targetRect.top - gap - edgeMargin;

    if (spaceBelow >= cardHeight) {
      cardTop = targetRect.bottom + gap;
      placement = 'bottom';
    } else if (spaceAbove >= cardHeight) {
      cardTop = targetRect.top - cardHeight - gap;
      placement = 'top';
    } else if (targetCenterY <= viewport.height / 2) {
      // 타깃이 화면 상단 절반에 있으면 카드의 윗변을 타깃 아래쪽에 배치 (공간 최대 확보)
      cardTop = Math.min(
        viewport.height - cardHeight - edgeMargin,
        Math.max(targetRect.bottom + gap, viewport.height - cardHeight - edgeMargin)
      );
      placement = 'bottom';
    } else {
      // 타깃이 화면 하단 절반에 있으면 카드를 상단에 배치하여 타깃이 가려지지 않게 보호
      cardTop = edgeMargin;
      placement = cardTop + cardHeight < targetRect.top ? 'top' : 'none';
    }

    arrowLeft = Math.max(22, Math.min(cardWidth - 22, targetCenterX - cardLeft));
  }

  const overlapsTarget =
    targetRect !== null &&
    cardTop < targetRect.bottom + 4 &&
    cardTop + cardHeight > targetRect.top - 4;

  return (
    <div className={`fixed inset-0 ${zIndexClass} overflow-hidden pointer-events-auto`}>
      {/* 스포트라이트 구멍 뚫기 SVG 마스크 (useId로 다중 인스턴스 ID 충돌 방지) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={spotLeft}
                y={spotTop}
                width={spotWidth}
                height={spotHeight}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* 타깃 박스 하이라이트 테두리 링 */}
      {targetRect && (
        <div
          className="absolute border-2 border-amber-400 rounded-2xl pointer-events-none transition-all duration-300 shadow-[0_0_24px_rgba(251,191,36,0.55)]"
          style={{
            top: `${spotTop}px`,
            left: `${spotLeft}px`,
            width: `${spotWidth}px`,
            height: `${spotHeight}px`,
          }}
        />
      )}

      {/* 강조된 버튼을 따라 이동하는 포스트잇 카드 */}
      <div
        ref={cardRef}
        className="fixed transition-all duration-300 ease-out"
        style={{
          top: `${cardTop}px`,
          left: `${cardLeft}px`,
          width: `${cardWidth}px`,
        }}
      >
        <div className="relative bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-2xl p-4 sm:p-5 shadow-2xl text-[#1E232A]">
          {/* 말풍선 방향 꼬리 (타깃 버튼 위치를 직접 가리킴) */}
          {targetRect && !overlapsTarget && placement === 'bottom' && (
            <div
              aria-hidden="true"
              className="absolute -top-2 w-3.5 h-3.5 bg-[#FFFBEB] border-l-2 border-t-2 border-[#F59E0B] rotate-45 -translate-x-1/2 transition-all duration-300"
              style={{ left: `${arrowLeft}px` }}
            />
          )}
          {targetRect && !overlapsTarget && placement === 'top' && (
            <div
              aria-hidden="true"
              className="absolute -bottom-2 w-3.5 h-3.5 bg-[#FFFBEB] border-r-2 border-b-2 border-[#F59E0B] rotate-45 -translate-x-1/2 transition-all duration-300"
              style={{ left: `${arrowLeft}px` }}
            />
          )}

          {/* 상단 포스트잇 핀 & 스텝 번호 */}
          <div className="flex items-center justify-between pb-2.5 border-b border-amber-200/80 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-inner" />
              <span className="text-[11px] font-bold tracking-wide text-amber-800">
                {badgeLabel} ({currentStep + 1} / {steps.length})
              </span>
            </div>
            <button
              type="button"
              onClick={handleComplete}
              className="touch-target p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              title="가이드 닫기"
              aria-label="가이드 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 제목 */}
          <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-1">
            {step.title}
          </h3>

          {/* 본문 설명 */}
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed mb-3">
            {step.description}
          </p>

          {/* 선택적 메모 박스 */}
          {step.postitTip && (
            <div className="px-2.5 py-2 rounded-xl bg-amber-100/75 border border-amber-300/60 text-[11px] sm:text-xs text-amber-900 font-medium mb-3.5">
              {step.postitTip}
            </div>
          )}

          {/* 하단 컨트롤 버튼 */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleComplete}
              className="touch-target px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 rounded-xl hover:bg-amber-200/50 transition-colors"
            >
              건너뛰기
            </button>

            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="touch-target px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-amber-200/60 hover:bg-amber-200 rounded-xl flex items-center gap-1 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  이전
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="touch-target px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1 transition-all"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    완료
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
