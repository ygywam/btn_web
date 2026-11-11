'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import EntryGate from '@/components/EntryGate';
import IntroPromoModal from '@/components/IntroPromoModal';
import SpotlightCoachmark from '@/components/SpotlightCoachmark';
import BookSearchModal from '@/components/BookSearchModal';
import AddPostModal from '@/components/AddPostModal';
import AuthModal from '@/components/AuthModal';
import BookCard from '@/components/BookCard';
import FeedCard from '@/components/FeedCard';
import AnalyticsTab from '@/components/AnalyticsTab';
import BookReportModal from '@/components/BookReportModal';
import { BookOpen, Sparkles, Plus, Compass, Bookmark, TrendingUp, MessageSquare, BarChart2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  loadProfileFromStorage,
  restoreSessionProfile,
  saveProfileToStorage,
  signOutUser,
} from '@/lib/auth';
import type { Book, Post, Profile, BookStatus } from '@/types/database';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'library' | 'feed' | 'analytics'>('library');
  const [libraryFilter, setLibraryFilter] = useState<BookStatus | 'ALL'>('ALL');

  // 모달 제어 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [forcePromo, setForcePromo] = useState(false);
  const [forceTour, setForceTour] = useState(false);
  const [selectedBookForPost, setSelectedBookForPost] = useState<string | undefined>();
  const [selectedBookForReport, setSelectedBookForReport] = useState<Book | null>(null);

  // 사용자 프로필 및 세션 유지
  const [profile, setProfile] = useState<Profile | null>(null);

  // 실데이터 상태 (더미데이터 없이 로컬 스토리지 및 실제 데이터로 관리)
  const [books, setBooks] = useState<Book[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 로컬 세션 및 Supabase Auth 상태 복원 (재진입 시 첫 진입 화면 스킵)
  useEffect(() => {
    const cachedProfile = loadProfileFromStorage();
    if (cachedProfile) {
      setProfile(cachedProfile);
    }

    const savedBooks = localStorage.getItem('booktuning_books_data');
    if (savedBooks) {
      try {
        setBooks(JSON.parse(savedBooks));
      } catch (e) {
        console.error('도서 목록 복원 실패:', e);
      }
    }

    const savedPosts = localStorage.getItem('booktuning_posts_data');
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (e) {
        console.error('피드 복원 실패:', e);
      }
    }

    if (!isSupabaseConfigured) {
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    restoreSessionProfile()
      .then((restored) => {
        if (!cancelled && restored) {
          setProfile(restored);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        restoreSessionProfile().then((restored) => {
          if (!cancelled && restored) setProfile(restored);
        });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // 데이터 변경 시 로컬 스토리지에 동기화
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('booktuning_books_data', JSON.stringify(books));
    }
  }, [books, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('booktuning_posts_data', JSON.stringify(posts));
    }
  }, [posts, isLoaded]);

  const handleSignOut = async () => {
    await signOutUser();
    setProfile(null);
  };

  // 도서 추가
  const handleAddBook = (newBookData: {
    title: string;
    authors: string;
    publisher: string;
    thumbnail_url: string;
    total_pages: number;
    status: BookStatus;
  }) => {
    const newBook: Book = {
      id: `book-${Date.now()}`,
      user_id: profile?.id || 'default-user',
      title: newBookData.title,
      authors: newBookData.authors,
      publisher: newBookData.publisher,
      thumbnail_url: newBookData.thumbnail_url,
      total_pages: newBookData.total_pages,
      current_page: 0,
      status: newBookData.status,
      is_public: false, // 기본 비공개
      created_at: new Date().toISOString(),
    };
    setBooks((prev) => [newBook, ...prev]);
  };

  // 진도율 쪽수 변경 및 100% 도달 시 '자동 완독' 전환 로직
  const handleUpdateProgress = (bookId: string, newPage: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;

        const isCompletedNow = b.total_pages > 0 && newPage >= b.total_pages;
        let nextStatus: BookStatus = b.status;

        if (isCompletedNow && b.status !== 'COMPLETED') {
          nextStatus = 'COMPLETED';
          // 완독 축하 알림
          setTimeout(() => {
            alert(`🎉 축하합니다! 「${b.title}」을(를) 완독하셨습니다.\n완독 컬렉션 및 독서 통계 탭에 기록되었습니다.`);
          }, 100);
        } else if (!isCompletedNow && b.status === 'COMPLETED') {
          // 완독 상태에서 쪽수를 낮춘 경우 다시 읽는 중으로 복원
          nextStatus = 'READING';
        }

        return {
          ...b,
          current_page: newPage,
          status: nextStatus,
        };
      })
    );
  };

  // 전체 쪽수 수정
  const handleUpdateTotalPages = (bookId: string, newTotal: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const isCompletedNow = newTotal > 0 && b.current_page >= newTotal;
        return {
          ...b,
          total_pages: newTotal,
          status: isCompletedNow ? 'COMPLETED' : b.status,
        };
      })
    );
  };

  // 상태 직접 변경
  const handleUpdateStatus = (bookId: string, newStatus: BookStatus) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, status: newStatus } : b))
    );
  };

  // 새 기록/문장 수집 작성
  const handleAddPost = (newPostData: {
    book_id: string | null;
    post_type: any;
    content: string;
    quote?: string;
    page_number?: number;
    is_public: boolean;
  }) => {
    const targetBook = books.find((b) => b.id === newPostData.book_id);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      user_id: profile?.id || 'default-user',
      book_id: newPostData.book_id,
      post_type: newPostData.post_type,
      content: newPostData.content,
      quote: newPostData.quote,
      page_number: newPostData.page_number,
      is_public: newPostData.is_public,
      created_at: new Date().toISOString(),
      profiles: profile || {
        id: 'default-user',
        nickname: '나의 서재',
        avatar_url: null,
        created_at: '',
      },
      books: targetBook,
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
    };

    setPosts((prev) => [newPost, ...prev]);

    // 진도 & 메모 작성 시 입력된 쪽수로 도서 진도율 자동 업데이트
    if (
      newPostData.post_type === 'PROGRESS' &&
      newPostData.book_id &&
      typeof newPostData.page_number === 'number' &&
      newPostData.page_number >= 0
    ) {
      handleUpdateProgress(newPostData.book_id, newPostData.page_number);
    }
  };

  // 종합 독서감상문을 전체 공개 피드로 공유
  const handleShareReportToFeed = (content: string, bookId: string) => {
    handleAddPost({
      book_id: bookId,
      post_type: 'NOTE',
      content,
      is_public: true,
    });
  };

  // 좋아요 토글
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const user_has_liked = !p.user_has_liked;
          const likes_count = (p.likes_count || 0) + (user_has_liked ? 1 : -1);
          return { ...p, user_has_liked, likes_count: Math.max(0, likes_count) };
        }
        return p;
      })
    );
  };

  // 댓글 등록
  const handleAddComment = (postId: string, commentContent: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments_count: (p.comments_count || 0) + 1 };
        }
        return p;
      })
    );
    alert('댓글이 등록되었습니다!');
  };

  // AI 추천 도서 원클릭 검색 연동
  const handleSearchRecommendedBook = (bookTitle: string) => {
    setIsSearchOpen(true);
  };

  // 필터링된 책 목록
  const filteredBooks = books.filter((b) =>
    libraryFilter === 'ALL' ? true : b.status === libraryFilter
  );

  // 독서 통계 계산
  const readingCount = books.filter((b) => b.status === 'READING').length;
  const completedCount = books.filter((b) => b.status === 'COMPLETED').length;
  const quoteCount = posts.filter((p) => p.post_type === 'QUOTE').length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xs tracking-widest uppercase text-white/60">
          BOOK TUNING...
        </div>
      </div>
    );
  }

  // 비로그인 시 기존 첫 페이지 대신 WebGL 셰이더 + 계정 생성 게이트 표시
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
      {/* 1. 상단 네비게이션 헤더 */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewPost={() => {
          setSelectedBookForPost(undefined);
          setIsAddPostOpen(true);
        }}
        onOpenPromo={() => setForcePromo(true)}
        onOpenTour={() => setForceTour(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        profile={profile}
        onSignOut={handleSignOut}
      />

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* 탭 1: 내 서재 (My Library) */}
        {activeTab === 'library' && (
          <div className="space-y-6 sm:space-y-8">
            
            {/* 독서 통계 요약 카드 */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-4 sm:p-6 bg-white border border-[#E8E3D5] rounded-3xl shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold text-neutral-900">{readingCount}</div>
                  <div className="text-[11px] sm:text-xs text-neutral-500 font-medium">읽고 있는 책</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold text-neutral-900">{completedCount}</div>
                  <div className="text-[11px] sm:text-xs text-neutral-500 font-medium">완독한 책</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold text-neutral-900">{quoteCount}</div>
                  <div className="text-[11px] sm:text-xs text-neutral-500 font-medium">수집한 문장</div>
                </div>
              </div>
            </div>

            {/* 독서 상태 필터 탭 */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
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

            {/* 책 카드 그리드 */}
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
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
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-white border border-[#E8E3D5] rounded-3xl p-6">
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

        {/* 탭 2: 공개 피드 (Explore Timeline) */}
        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-base sm:text-lg text-neutral-900">
                  공개 피드 타임라인
                </h2>
              </div>
              <span className="text-xs text-neutral-500">
                이웃 독서가들의 문장과 단상
              </span>
            </div>

            {/* 피드 게시물 목록 */}
            {posts.filter((p) => p.is_public).length > 0 ? (
              <div className="space-y-4">
                {posts
                  .filter((p) => p.is_public)
                  .map((post) => (
                    <FeedCard
                      key={post.id}
                      post={post}
                      currentUserId={profile?.id}
                      onToggleLike={handleToggleLike}
                      onAddComment={handleAddComment}
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
                  <Plus className="w-4 h-4" />
                  첫 기록 남기기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 탭 3: 독서 통계 및 AI 분석/추천 리포트 (Analytics) */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            books={books}
            posts={posts}
            onSearchBook={handleSearchRecommendedBook}
          />
        )}

        {/* 4. 서비스 푸터 (개인정보처리방침 및 이용약관) */}
        <footer className="mt-16 pt-8 pb-12 border-t border-[#E8E3D5] text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-xs font-semibold text-neutral-600">
            <a href="/privacy" className="hover:text-amber-700 transition-colors">
              개인정보처리방침
            </a>
            <span className="text-neutral-300">·</span>
            <a href="/terms" className="hover:text-amber-700 transition-colors">
              이용약관
            </a>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-400">개인정보 무수집 원칙 준수</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            © 2026 북튜닝 (Book Tuning) · 의미 있는 독서로 삶을 튜닝하자
          </p>
        </footer>

      </main>

      {/* 3. 모달 레이어들 */}
      {/* (1) 상단 버튼으로 다시볼 때만 열리는 홍보 영상 모달 */}
      {forcePromo && (
        <IntroPromoModal
          forceOpen={true}
          onClose={() => setForcePromo(false)}
        />
      )}

      {/* (2) 스포트라이트 포스트잇 코치마크 온보딩 */}
      <SpotlightCoachmark
        forceOpen={forceTour}
        onClose={() => setForceTour(false)}
      />

      {/* (3) 카카오 도서 검색 모달 */}
      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddBook={handleAddBook}
      />

      {/* (4) 독서 기록 / 문장 수집 모달 (AI 감상 도우미 탑재) */}
      <AddPostModal
        isOpen={isAddPostOpen}
        onClose={() => setIsAddPostOpen(false)}
        books={books}
        selectedBookId={selectedBookForPost}
        onSubmit={handleAddPost}
      />

      {/* (5) 구글 / 이메일 인증 모달 */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(p) => {
          saveProfileToStorage(p);
          setProfile(p);
        }}
      />

      {/* (6) 도서 누적 종합 AI 독서감상문 모달 */}
      <BookReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        book={selectedBookForReport}
        posts={posts}
        onShareToFeed={handleShareReportToFeed}
      />
    </div>
  );
}
