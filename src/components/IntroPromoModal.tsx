'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Play, RotateCcw, Check, Sparkles, BookOpen, Radio } from 'lucide-react';

interface IntroPromoModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function IntroPromoModal({ forceOpen = false, onClose }: IntroPromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // 씬 데이터 (의미 있는 독서로 삶을 튜닝하자)
  const scenes = [
    {
      subtitle: 'SCENE 01 · 세상의 소음 속에서',
      title: '당신의 일상은 지금\n어떤 소리로 채워져 있나요?',
      desc: '끝없이 쏟아지는 자극과 피로 속에서, 내면의 고요를 마주할 시간이 필요합니다.',
      icon: Radio,
      badge: '소음에서 고요로',
      accentColor: 'from-amber-500/20 to-orange-500/10',
    },
    {
      subtitle: 'SCENE 02 · 문장이 남기는 파동',
      title: '하루 단 한 문장,\n나를 다시 조율하는 시간',
      desc: '책 속 깊은 문장을 마음에 새기고 기록할 때, 흐트러졌던 삶의 결이 제자리를 찾습니다.',
      icon: BookOpen,
      badge: '문장 수집 & 진도 기록',
      accentColor: 'from-amber-600/25 to-yellow-500/10',
    },
    {
      subtitle: 'SCENE 03 · 북튜닝 (Book Tuning)',
      title: '의미 있는 독서로\n삶을 튜닝하자',
      desc: '나만의 프라이빗한 서재부터 공감하는 이웃과의 피드까지.\n지금 북튜닝에서 당신의 독서 여정을 시작하세요.',
      icon: Sparkles,
      badge: 'TUNE YOUR LIFE',
      accentColor: 'from-amber-500/30 to-amber-700/20',
    },
  ];

  // 진입 시 로컬 스토리지 확인
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    const dismissed = localStorage.getItem('booktuning_promo_dismissed');
    if (!dismissed) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  // 자동 씬 전환 (재생 중일 때 4초마다 다음 씬)
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, scenes.length]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('booktuning_promo_dismissed', 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const current = scenes[currentScene];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-300">
      {/* 
        반응형 컨테이너:
        - 데스크탑: 가로 16:9 와이드 시네마틱 (max-w-4xl aspect-[16/9])
        - 모바일: 세로 9:16 모바일 릴스 비율 (max-w-sm aspect-[9/16] 또는 90vh)
      */}
      <div className="relative w-full max-w-4xl md:aspect-[16/9] max-h-[92vh] aspect-[9/15] sm:aspect-auto sm:min-h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1F26] via-[#12161B] to-[#0A0D10] text-white shadow-2xl border border-white/10 flex flex-col justify-between p-5 sm:p-8">
        
        {/* 배경 앰비언트 그라디언트 펄스 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${current.accentColor} transition-all duration-1000 opacity-60 pointer-events-none`} />

        {/* 상단 컨트롤 바 */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {current.badge}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="touch-target p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              title={isMuted ? '소리 켜기' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={handleClose}
              className="touch-target p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 중앙 인터랙티브 모션 비주얼 영역 */}
        <div className="relative z-10 my-auto flex flex-col items-center text-center px-2 py-4">
          {/* 심볼 아이콘 링 */}
          <div className="relative mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-transform duration-500">
              <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-slate-900" />
            </div>
            {/* 회전하는 미세 궤도 링 */}
            <div className="absolute -inset-3 rounded-full border border-amber-400/20 border-dashed animate-spin" style={{ animationDuration: '18s' }} />
          </div>

          {/* 소제목 */}
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-amber-400/90 uppercase mb-2">
            {current.subtitle}
          </span>

          {/* 메인 타이틀 */}
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white whitespace-pre-line leading-snug sm:leading-tight mb-3 sm:mb-4">
            {current.title}
          </h2>

          {/* 설명 본문 */}
          <p className="text-xs sm:text-sm md:text-base text-neutral-300 max-w-lg leading-relaxed whitespace-pre-line">
            {current.desc}
          </p>

          {/* 주파수 사운드 웨이브 모션 그래픽 바 */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-5 sm:mt-8 h-8">
            {[40, 70, 30, 90, 50, 100, 60, 85, 45, 95, 35, 75, 55].map((val, idx) => (
              <span
                key={idx}
                className="w-1 sm:w-1.5 bg-gradient-to-t from-amber-500 to-amber-200 rounded-full transition-all duration-300"
                style={{
                  height: isPlaying ? `${Math.max(15, (val * ((currentScene + 1) * 25)) % 100)}%` : '20%',
                }}
              />
            ))}
          </div>
        </div>

        {/* 하단 영역: 프로그레스 바 & 컨트롤 & 다시 보지 않기 */}
        <div className="relative z-10 w-full pt-2 border-t border-white/10 flex flex-col gap-3">
          {/* 씬 프로그레스 인디케이터 바 */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {scenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentScene(idx)}
                className="group flex flex-col gap-1 py-1 text-left"
              >
                <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-amber-400 transition-all duration-300 ${
                      currentScene === idx ? 'w-full' : currentScene > idx ? 'w-full opacity-60' : 'w-0'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            {/* 다시 보지 않기 체크박스 */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-400 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-400 focus:ring-offset-0"
              />
              다시 보지 않기
            </label>

            {/* 메인 시작 버튼 */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="touch-target px-3 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                {isPlaying ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? '일시정지' : '재생'}
              </button>

              <button
                onClick={handleClose}
                className="touch-target flex-1 sm:flex-none px-6 py-2.5 text-xs sm:text-sm rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                북튜닝 시작하기
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
