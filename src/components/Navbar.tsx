'use client';

import React from 'react';
import Image from 'next/image';
import { BookMarked, Compass, Plus, Film, HelpCircle, LogIn, LogOut, User, BarChart2 } from 'lucide-react';
import type { Profile } from '@/types/database';

interface NavbarProps {
  activeTab: 'library' | 'feed' | 'analytics';
  onTabChange: (tab: 'library' | 'feed' | 'analytics') => void;
  onOpenSearch: () => void;
  onOpenNewPost: () => void;
  onOpenPromo: () => void;
  onOpenTour: () => void;
  onOpenAuth: () => void;
  profile: Profile | null;
  onSignOut: () => void;
}

export default function Navbar({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenNewPost,
  onOpenPromo,
  onOpenTour,
  onOpenAuth,
  profile,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F0]/90 backdrop-blur-md border-b border-[#E8E3D5] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* 좌측: 로고 및 서비스 명 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            onClick={() => onTabChange('library')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Image 
                src="/icon.svg" 
                alt="북튜닝 로고" 
                width={36} 
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-neutral-900 group-hover:text-amber-700 transition-colors">
                북튜닝
              </span>
              <span className="hidden sm:inline-block text-[10px] text-neutral-500 font-medium -mt-1 tracking-wider">
                BOOK TUNING
              </span>
            </div>
          </div>

          {/* 중앙 메인 탭 (내 서재 vs 공개 피드 vs 독서 통계) */}
          <nav className="flex items-center gap-1 ml-1 sm:ml-4 bg-[#EFE9D9]/80 p-1 rounded-xl">
            <button
              data-tour="reading-status"
              onClick={() => onTabChange('library')}
              className={`touch-target px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 inline-block" />
              <span>내 서재</span>
            </button>
            <button
              data-tour="explore-feed"
              onClick={() => onTabChange('feed')}
              className={`touch-target px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 inline-block" />
              <span>피드</span>
            </button>
            <button
              onClick={() => onTabChange('analytics')}
              className={`touch-target px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 inline-block" />
              <span>독서 통계</span>
            </button>
          </nav>
        </div>

        {/* 우측: 액션 버튼들 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 도서 검색 버튼 */}
          <button
            data-tour="search-btn"
            onClick={onOpenSearch}
            className="touch-target px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-800 bg-[#EFE9D9] hover:bg-[#E4DDCB] active:scale-95 rounded-xl transition-all flex items-center gap-1.5"
            title="도서 검색 & 서재 추가"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">도서 검색</span>
          </button>

          {/* 기록 작성 버튼 */}
          <button
            data-tour="write-post"
            onClick={onOpenNewPost}
            className="touch-target px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 rounded-xl shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <span>기록하기</span>
          </button>

          {/* 인트로 홍보 영상 다시보기 */}
          <button
            onClick={onOpenPromo}
            className="touch-target p-2 text-neutral-500 hover:text-neutral-800 rounded-xl hover:bg-neutral-200/50 transition-colors"
            title="소개 영상 다시보기"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* 스포트라이트 가이드 다시보기 */}
          <button
            onClick={onOpenTour}
            className="touch-target p-2 text-neutral-500 hover:text-neutral-800 rounded-xl hover:bg-neutral-200/50 transition-colors"
            title="사용법 가이드 다시보기"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* 사용자 로그인/프로필 */}
          {profile ? (
            <div className="flex items-center gap-1.5 ml-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/70 border border-[#E8E3D5] text-xs font-semibold text-neutral-800">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span className="max-w-[70px] sm:max-w-[100px] truncate">{profile.nickname}</span>
              </div>
              <button
                onClick={onSignOut}
                className="touch-target p-2 text-neutral-400 hover:text-rose-600 rounded-xl transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="touch-target px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 border border-neutral-300 rounded-xl hover:bg-white transition-all flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
