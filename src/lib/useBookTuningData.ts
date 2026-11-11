'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  extractErrorMessage,
  loadProfileFromStorage,
  restoreSessionProfile,
  signOutUser,
} from '@/lib/auth';
import {
  deletePostComment,
  fetchPostComments,
  fetchUserBooks,
  fetchVisiblePosts,
  insertBook,
  insertPost,
  insertPostComment,
  togglePostLikeDb,
  updateBookFields,
} from '@/lib/db';
import type { Book, Post, Profile, BookStatus, PostType, Comment } from '@/types/database';

const LOCAL_BOOKS_KEY = 'booktuning_books_data';
const LOCAL_POSTS_KEY = 'booktuning_posts_data';

/**
 * 북튜닝의 인증 세션, 도서, 피드, 좋아요, 댓글 데이터를 Supabase 또는 로컬 저장소와 동기화하는 훅
 */
export function useBookTuningData() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // Supabase 세션 복원 (비연동 환경에서만 브라우저 임시 저장소 복원)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfile(loadProfileFromStorage());
      try {
        const savedBooks = localStorage.getItem(LOCAL_BOOKS_KEY);
        if (savedBooks) setBooks(JSON.parse(savedBooks));
        const savedPosts = localStorage.getItem(LOCAL_POSTS_KEY);
        if (savedPosts) setPosts(JSON.parse(savedPosts));
      } catch (e) {
        console.error('로컬 데이터 복원 실패:', e);
      }
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    restoreSessionProfile()
      .then((restored) => {
        if (!cancelled) setProfile(restored);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        restoreSessionProfile().then((restored) => {
          if (!cancelled && restored) setProfile(restored);
        });
      } else if (event === 'SIGNED_OUT') {
        if (!cancelled) {
          setProfile(null);
          setBooks([]);
          setPosts([]);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const loadCloudData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    setDataError('');
    try {
      const userBooks = await fetchUserBooks(userId);
      const visiblePosts = await fetchVisiblePosts(userId, userBooks);
      setBooks(userBooks);
      setPosts(visiblePosts);
    } catch (err) {
      console.error('Supabase 데이터 불러오기 실패:', err);
      setDataError(
        `클라우드 서재를 불러오는 중 오류가 발생했습니다: ${extractErrorMessage(err, 'DB 연결 확인 필요')}`
      );
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  const profileId = profile?.id;

  useEffect(() => {
    if (!isLoaded || !isSupabaseConfigured) return;
    if (!profileId) {
      setBooks([]);
      setPosts([]);
      return;
    }
    loadCloudData(profileId);
  }, [isLoaded, profileId, loadCloudData]);

  useEffect(() => {
    if (isLoaded && !isSupabaseConfigured) {
      localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(books));
    }
  }, [books, isLoaded]);

  useEffect(() => {
    if (isLoaded && !isSupabaseConfigured) {
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
    }
  }, [posts, isLoaded]);

  const handleSignOut = async () => {
    await signOutUser();
    setProfile(null);
    setBooks([]);
    setPosts([]);
  };

  const handleAddBook = async (newBookData: {
    title: string;
    authors: string;
    publisher: string;
    thumbnail_url: string;
    total_pages: number;
    status: BookStatus;
  }) => {
    if (!profile) return;
    if (!isSupabaseConfigured) {
      const localBook: Book = {
        id: `book-${Date.now()}`,
        user_id: profile.id,
        ...newBookData,
        current_page: 0,
        is_public: false,
        created_at: new Date().toISOString(),
      };
      setBooks((prev) => [localBook, ...prev]);
      return;
    }

    try {
      const created = await insertBook(profile.id, newBookData);
      setBooks((prev) => [created, ...prev]);
    } catch (err) {
      console.error('도서 등록 실패:', err);
      alert(`도서를 저장하지 못했습니다: ${extractErrorMessage(err, '잠시 후 다시 시도해 주세요.')}`);
    }
  };

  const handleUpdateProgress = async (bookId: string, newPage: number) => {
    const target = books.find((b) => b.id === bookId);
    if (!target) return;

    const isCompletedNow = target.total_pages > 0 && newPage >= target.total_pages;
    let nextStatus: BookStatus = target.status;

    if (isCompletedNow && target.status !== 'COMPLETED') {
      nextStatus = 'COMPLETED';
      setTimeout(() => {
        alert(
          `🎉 축하합니다! 「${target.title}」을(를) 완독하셨습니다.\n완독 컬렉션 및 독서 통계 탭에 기록되었습니다.`
        );
      }, 100);
    } else if (!isCompletedNow && target.status === 'COMPLETED') {
      nextStatus = 'READING';
    }

    const prevBooks = books;
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, current_page: newPage, status: nextStatus } : b))
    );

    if (isSupabaseConfigured && profile) {
      try {
        await updateBookFields(bookId, profile.id, {
          current_page: newPage,
          status: nextStatus,
        });
      } catch (err) {
        console.error('진도 업데이트 실패:', err);
        setBooks(prevBooks);
        alert(`진도 저장 실패: ${extractErrorMessage(err, 'DB 오류')}`);
      }
    }
  };

  const handleUpdateTotalPages = async (bookId: string, newTotal: number) => {
    const target = books.find((b) => b.id === bookId);
    if (!target) return;
    const isCompletedNow = newTotal > 0 && target.current_page >= newTotal;
    const nextStatus: BookStatus = isCompletedNow ? 'COMPLETED' : target.status;

    const prevBooks = books;
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, total_pages: newTotal, status: nextStatus } : b))
    );

    if (isSupabaseConfigured && profile) {
      try {
        await updateBookFields(bookId, profile.id, { total_pages: newTotal, status: nextStatus });
      } catch (err) {
        console.error('전체 쪽수 수정 실패:', err);
        setBooks(prevBooks);
        alert(`전체 쪽수 저장 실패: ${extractErrorMessage(err, 'DB 오류')}`);
      }
    }
  };

  const handleUpdateStatus = async (bookId: string, newStatus: BookStatus) => {
    const prevBooks = books;
    setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, status: newStatus } : b)));

    if (isSupabaseConfigured && profile) {
      try {
        await updateBookFields(bookId, profile.id, { status: newStatus });
      } catch (err) {
        console.error('상태 변경 실패:', err);
        setBooks(prevBooks);
        alert(`독서 상태 저장 실패: ${extractErrorMessage(err, 'DB 오류')}`);
      }
    }
  };

  const handleAddPost = async (newPostData: {
    book_id: string | null;
    post_type: PostType;
    content: string;
    quote?: string;
    page_number?: number;
    is_public: boolean;
  }) => {
    if (!profile) return;

    if (!isSupabaseConfigured) {
      const targetBook = books.find((b) => b.id === newPostData.book_id);
      const localPost: Post = {
        id: `post-${Date.now()}`,
        user_id: profile.id,
        ...newPostData,
        created_at: new Date().toISOString(),
        profiles: profile,
        books: targetBook,
        likes_count: 0,
        comments_count: 0,
        user_has_liked: false,
      };
      setPosts((prev) => [localPost, ...prev]);
    } else {
      try {
        const created = await insertPost(profile.id, newPostData, books, profile);
        setPosts((prev) => [created, ...prev]);
      } catch (err) {
        console.error('기록 저장 실패:', err);
        alert(`기록 저장 실패: ${extractErrorMessage(err, 'DB 오류')}`);
        return;
      }
    }

    if (
      newPostData.post_type === 'PROGRESS' &&
      newPostData.book_id &&
      typeof newPostData.page_number === 'number' &&
      newPostData.page_number >= 0
    ) {
      await handleUpdateProgress(newPostData.book_id, newPostData.page_number);
    }
  };

  const handleToggleLike = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const wasLiked = Boolean(target.user_has_liked);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_has_liked: !wasLiked,
              likes_count: Math.max(0, (p.likes_count || 0) + (wasLiked ? -1 : 1)),
            }
          : p
      )
    );

    if (isSupabaseConfigured && profile) {
      try {
        await togglePostLikeDb(postId, profile.id, wasLiked);
      } catch (err) {
        console.error('좋아요 처리 실패:', err);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, user_has_liked: wasLiked, likes_count: target.likes_count || 0 }
              : p
          )
        );
      }
    }
  };

  const handleLoadComments = useCallback(async (postId: string): Promise<Comment[]> => {
    if (!isSupabaseConfigured) return [];
    return fetchPostComments(postId);
  }, []);

  const handleAddComment = async (postId: string, commentContent: string): Promise<Comment | void> => {
    let created: Comment | undefined;
    if (isSupabaseConfigured && profile) {
      try {
        created = await insertPostComment(postId, profile.id, commentContent, profile);
      } catch (err) {
        console.error('댓글 등록 실패:', err);
        alert(`댓글 등록 실패: ${extractErrorMessage(err, 'DB 오류')}`);
        return;
      }
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      )
    );
    return created;
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (isSupabaseConfigured && profile) {
      try {
        await deletePostComment(commentId, profile.id);
      } catch (err) {
        console.error('댓글 삭제 실패:', err);
        alert(`댓글 삭제 실패: ${extractErrorMessage(err, 'DB 오류')}`);
        return;
      }
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p
      )
    );
  };

  return {
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
  };
}
