'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import IntroPromoModal from '@/components/IntroPromoModal';
import SpotlightCoachmark from '@/components/SpotlightCoachmark';
import BookSearchModal from '@/components/BookSearchModal';
import AddPostModal from '@/components/AddPostModal';
import AuthModal from '@/components/AuthModal';
import BookCard from '@/components/BookCard';
import FeedCard from '@/components/FeedCard';
import { BookOpen, Sparkles, Plus, Compass, Bookmark, TrendingUp } from 'lucide-react';
import type { Book, Post, Profile, BookStatus } from '@/types/database';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'library' | 'feed'>('library');
  const [libraryFilter, setLibraryFilter] = useState<BookStatus | 'ALL'>('ALL');

  // 모달 제어 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [forcePromo, setForcePromo] = useState(false);
  const [forceTour, setForceTour] = useState(false);
  const [selectedBookForPost, setSelectedBookForPost] = useState<string | undefined>();

  // 사용자 프로필 및 세션 유지
  const [profile, setProfile] = useState<Profile | null>(null);

  // 로컬 목업/실데이터 상태 (서재 & 피드)
  const [books, setBooks] = useState<Book[]>([
    {
      id: 'book-1',
      user_id: 'default-user',
      title: '데미안',
      authors: '헤르만 헤세',
      publisher: '민음사',
      thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80',
      total_pages: 248,
      current_page: 135,
      status: 'READING',
      is_public: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'book-2',
      user_id: 'default-user',
      title: '도둑맞은 집중력',
      authors: '요한 하리',
      publisher: '어크로스',
      thumbnail_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
      total_pages: 450,
      current_page: 450,
      status: 'COMPLETED',
      is_public: false,
      created_at: new Date().toISOString(),
    },
  ]);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'post-1',
      user_id: 'user-02',
      book_id: 'book-1',
      post_type: 'QUOTE',
      quote: '새는 알을 깨고 나오려 힘겹게 싸운다. 알은 세계다. 태어나려는 자는 한 세계를 파괴해야만 한다.',
      content: '늘 머뭇거리며 안전한 틀 안에 갇혀있던 나에게 강렬한 용기를 건네준 문장. 책을 읽는다는 건 나만의 알을 깨는 과정인 것 같다.',
      page_number: 122,
      is_public: true,
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      profiles: {
        id: 'user-02',
        nickname: '새벽서재',
        avatar_url: null,
        created_at: '',
      },
      books: {
        id: 'book-1',
        user_id: 'user-02',
        title: '데미안',
        authors: '헤르만 헤세',
        publisher: '민음사',
        thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80',
        total_pages: 248,
        current_page: 248,
        status: 'COMPLETED',
        is_public: true,
        created_at: '',
      },
      likes_count: 5,
      comments_count: 2,
      user_has_liked: false,
    },
    {
      id: 'post-2',
      user_id: 'user-03',
      book_id: 'book-2',
      post_type: 'NOTE',
      content: '스마트폰 알림을 끄고 오직 활자에만 몰입한 1시간. 흩어졌던 생각의 주파수가 다시 또렷하게 맞춰지는 기분이다.',
      is_public: true,
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      profiles: {
        id: 'user-03',
        nickname: '마인드튜너',
        avatar_url: null,
        created_at: '',
      },
      books: {
        id: 'book-2',
        user_id: 'user-03',
        title: '도둑맞은 집중력',
        authors: '요한 하리',
        publisher: '어크로스',
        thumbnail_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
        total_pages: 450,
        current_page: 210,
        status: 'READING',
        is_public: true,
        created_at: '',
      },
      likes_count: 8,
      comments_count: 4,
      user_has_liked: true,
    },
  ]);

  // 로컬 세션 프로필 복원 (자동 로그인 유지)
  useEffect(() => {
    const saved = localStorage.getItem('booktuning_user_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('booktuning_user_profile');
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

  // 진도율 쪽수 변경
  const handleUpdateProgress = (bookId: string, newPage: number) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, current_page: newPage } : b))
    );
  };

  // 상태 변경
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
  };

  // 좋아요(하트) 토글
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

  // 필터링된 책 목록
  const filteredBooks = books.filter((b) =>
    libraryFilter === 'ALL' ? true : b.status === libraryFilter
  );

  // 독서 통계 계산
  const readingCount = books.filter((b) => b.status === 'READING').length;
  const completedCount = books.filter((b) => b.status === 'COMPLETED').length;
  const quoteCount = posts.filter((p) => p.post_type === 'QUOTE').length;

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

      {/* 2. 메인 컨텐츠 영역 (모바일 여백 최적화) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* 탭 1: 내 서재 (My Library) */}
        {activeTab === 'library' ? (
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

            {/* 책 카드 그리드 (모바일 1열, 태블릿 2열, 데스크탑 3열) */}
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onUpdateProgress={handleUpdateProgress}
                    onUpdateStatus={handleUpdateStatus}
                    onSelectForPost={(selected) => {
                      setSelectedBookForPost(selected.id);
                      setIsAddPostOpen(true);
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
                  className="touch-target px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition-all"
                >
                  도서 검색하여 첫 책 등록하기
                </button>
              </div>
            )}

          </div>
        ) : (
          /* 탭 2: 공개 피드 (Explore Timeline) */
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
            <div className="space-y-4">
              {posts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  currentUserId={profile?.id}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 3. 모달 레이어들 */}
      {/* (1) 인트로 홍보 영상 모달 */}
      <IntroPromoModal
        forceOpen={forcePromo}
        onClose={() => setForcePromo(false)}
      />

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

      {/* (4) 독서 기록 / 문장 수집 모달 (엑사원 AI 탑재) */}
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
        onSuccess={(p) => setProfile(p)}
      />
    </div>
  );
}
