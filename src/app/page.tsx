'use client';

import React, { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import EntryGate from '@/components/EntryGate';
import SpotlightCoachmark, { type TourStep } from '@/components/SpotlightCoachmark';
import BookSearchModal from '@/components/BookSearchModal';
import AddPostModal from '@/components/AddPostModal';
import AuthModal from '@/components/AuthModal';
import NicknameModal from '@/components/NicknameModal';
import BookCard from '@/components/BookCard';
import FeedCard from '@/components/FeedCard';
import AnalyticsTab from '@/components/AnalyticsTab';
import BookReportModal from '@/components/BookReportModal';
import StatsDetailModal, { type StatsDetailType } from '@/components/StatsDetailModal';
import LibraryStatsBar from '@/components/LibraryStatsBar';
import { BookOpen, Plus, Compass, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { saveProfileToStorage } from '@/lib/auth';
import { useBookTuningData } from '@/lib/useBookTuningData';
import type { Book, BookStatus } from '@/types/database';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'library' | 'feed' | 'analytics'>('library');
  const [libraryFilter, setLibraryFilter] = useState<BookStatus | 'ALL'>('ALL');

  // 모달 제어 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [forceTour, setForceTour] = useState(false);
  const [selectedBookForPost, setSelectedBookForPost] = useState<string | undefined>();
  const [selectedBookForReport, setSelectedBookForReport] = useState<Book | null>(null);
  const [statsDetailType, setStatsDetailType] = useState<StatsDetailType | null>(null);

  const {
    profile,
    setProfile,
    books,
    posts,
    setPosts,
    isLoaded,
    isDataLoading,
    dataError,
    loadCloudData,
    handleSignOut,
    handleAddBook,
    handleUpdateProgress,
    handleUpdateTotalPages,
    handleUpdateStatus,
    handleAddPost,
    handleToggleLike,
    handleLoadComments,
    handleAddComment,
    handleDeleteComment,
  } = useBookTuningData();

  const handleTourStepChange = useCallback((step: TourStep) => {
    if (step.tab) setActiveTab(step.tab);
  }, []);

  // 내 기록과 공개 피드 분리 (타인의 글이 내 통계에 합산되지 않도록 격리)
  const myPosts = profile ? posts.filter((p) => p.user_id === profile.id) : [];
  const publicPosts = posts.filter((p) => p.is_public);
  const filteredBooks = books.filter((b) =>
    libraryFilter === 'ALL' ? true : b.status === libraryFilter
  );

  // 독서 통계 계산 (내 도서 + 내 문장 기준)
  const readingCount = books.filter((b) => b.status === 'READING').length;
  const completedCount = books.filter((b) => b.status === 'COMPLETED').length;
  const quoteCount = myPosts.filter(
    (p) => p.post_type === 'QUOTE' || Boolean(p.quote && p.quote.trim())
  ).length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xs tracking-widest uppercase text-white/60">BOOK TUNING...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <EntryGate
        onSuccess={(p) => {
          saveProfileToStorage(p);
          setProfile(p);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F0] text-[#1E232A] flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewPost={() => {
          setSelectedBookForPost(undefined);
          setIsAddPostOpen(true);
        }}
        onOpenTour={() => {
          setActiveTab('library');
          setForceTour(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenNickname={() => setIsNicknameOpen(true)}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              클라우드(Supabase) 환경변수가 연결되지 않은 상태입니다. 현재 기기 브라우저에만 임시 저장됩니다.
            </span>
          </div>
        )}

        {dataError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <span>{dataError}</span>
            <button
              type="button"
              onClick={() => loadCloudData(profile.id)}
              className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 font-bold text-rose-700 hover:bg-rose-100 flex-shrink-0"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {/* 탭 1: 내 서재 */}
        {activeTab === 'library' && (
          <div className="space-y-6 sm:space-y-8">
            <LibraryStatsBar
              readingCount={readingCount}
              completedCount={completedCount}
              quoteCount={quoteCount}
              onSelectStat={(type) => setStatsDetailType(type)}
            />

            <div
              data-tour="library-filters"
              className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar"
            >
              {(['ALL', 'READING', 'COMPLETED', 'WISH'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setLibraryFilter(st)}
                  className={`touch-target px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    libraryFilter === st
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-white border border-[#E8E3D5] text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {st === 'ALL'
                    ? '전체 책장'
                    : st === 'READING'
                    ? '📖 읽는 중'
                    : st === 'COMPLETED'
                    ? '✅ 완독'
                    : '⭐ 읽고 싶은'}
                </button>
              ))}
            </div>

            {isDataLoading ? (
              <div className="py-16 flex flex-col items-center justify-center bg-white border border-[#E8E3D5] rounded-3xl gap-2 text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">클라우드 서재를 불러오는 중...</span>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredBooks.map((book, idx) => (
                  <div key={book.id} data-tour={idx === 0 ? 'library-shelf' : undefined}>
                    <BookCard
                      book={book}
                      onUpdateProgress={handleUpdateProgress}
                      onUpdateTotalPages={handleUpdateTotalPages}
                      onUpdateStatus={handleUpdateStatus}
                      onSelectForPost={(selected) => {
                        setSelectedBookForPost(selected.id);
                        setIsAddPostOpen(true);
                      }}
                      onOpenReport={(selected) => {
                        setSelectedBookForReport(selected);
                        setIsReportOpen(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                data-tour="library-shelf"
                className="py-16 text-center bg-white border border-[#E8E3D5] rounded-3xl p-6"
              >
                <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-bold text-base text-neutral-800 mb-1">
                  아직 등록된 책이 없습니다.
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  카카오 도서 검색으로 지금 읽고 있는 책을 등록하고 오늘 읽은 페이지를 기록해 보세요.
                </p>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="touch-target px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  도서 검색하여 첫 책 등록하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 탭 2: 공개 피드 */}
        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div
              data-tour="feed-section"
              className="flex items-center justify-between pb-2 border-b border-neutral-200"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-base sm:text-lg text-neutral-900">
                  공개 피드 타임라인
                </h2>
              </div>
              <span className="text-xs text-neutral-500">이웃 독서가들의 문장과 단상</span>
            </div>

            {publicPosts.length > 0 ? (
              <div className="space-y-4">
                {publicPosts.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    currentUserId={profile?.id}
                    onToggleLike={handleToggleLike}
                    onLoadComments={handleLoadComments}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-white border border-[#E8E3D5] rounded-3xl p-6">
                <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-bold text-base text-neutral-800 mb-1">
                  아직 공개된 피드가 없습니다.
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  책을 읽고 감명 깊었던 문장이나 단상을 전체 공개로 남겨보세요.
                </p>
                <button
                  onClick={() => {
                    setSelectedBookForPost(undefined);
                    setIsAddPostOpen(true);
                  }}
                  className="touch-target px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />첫 기록 남기기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 탭 3: 독서 통계 및 AI 분석 */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            books={books}
            posts={myPosts}
            onSearchBook={() => setIsSearchOpen(true)}
            onSelectStat={(type) => setStatsDetailType(type)}
          />
        )}

        <footer className="mt-16 pt-8 pb-12 border-t border-[#E8E3D5] text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-neutral-600">
            <a href="/privacy" className="hover:text-amber-700 transition-colors">
              개인정보처리방침
            </a>
            <span className="text-neutral-300">·</span>
            <a href="/terms" className="hover:text-amber-700 transition-colors">
              이용약관
            </a>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500">운영: 조용희(서울외고, 활동명: 기록조율사 · @record_tuner)</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            © 2026 북튜닝 (Book Tuning) · 의미 있는 독서로 삶을 튜닝하자
          </p>
        </footer>
      </main>

      <SpotlightCoachmark
        forceOpen={forceTour}
        onClose={() => setForceTour(false)}
        onStepChange={handleTourStepChange}
      />

      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddBook={handleAddBook}
      />

      <AddPostModal
        isOpen={isAddPostOpen}
        onClose={() => setIsAddPostOpen(false)}
        books={books}
        selectedBookId={selectedBookForPost}
        onSubmit={handleAddPost}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(p) => {
          saveProfileToStorage(p);
          setProfile(p);
        }}
      />

      <NicknameModal
        isOpen={isNicknameOpen}
        onClose={() => setIsNicknameOpen(false)}
        currentProfile={profile}
        onSaved={(updated) => {
          setProfile(updated);
          setPosts((prev) =>
            prev.map((post) =>
              post.user_id === updated.id ? { ...post, profiles: updated } : post
            )
          );
        }}
      />

      <BookReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        book={selectedBookForReport}
        posts={myPosts}
        onShareToFeed={(content, bookId) =>
          handleAddPost({ book_id: bookId, post_type: 'NOTE', content, is_public: true })
        }
      />

      <StatsDetailModal
        detailType={statsDetailType}
        onClose={() => setStatsDetailType(null)}
        books={books}
        posts={myPosts}
        onOpenReport={(book) => {
          setSelectedBookForReport(book);
          setIsReportOpen(true);
        }}
        onSelectForPost={(book) => {
          setSelectedBookForPost(book.id);
          setIsAddPostOpen(true);
        }}
      />
    </div>
  );
}
