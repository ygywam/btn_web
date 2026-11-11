'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  BookOpen,
  Award,
  Bookmark,
  TrendingUp,
  Quote,
  Sparkles,
  PenLine,
  Lock,
  Globe,
} from 'lucide-react';
import type { Book, Post } from '@/types/database';

export type StatsDetailType = 'READING' | 'COMPLETED' | 'QUOTES' | 'PAGES';

interface StatsDetailModalProps {
  detailType: StatsDetailType | null;
  onClose: () => void;
  books: Book[];
  /** 본인 기록 목록 (타인의 공개 피드 제외) */
  posts: Post[];
  onOpenReport?: (book: Book) => void;
  onSelectForPost?: (book: Book) => void;
}

/**
 * 통계 카드(읽고 있는 책·완독한 책·수집한 문장·누적 읽은 쪽수) 클릭 시 세부 내역을 보여주는 모달
 */
export default function StatsDetailModal({
  detailType,
  onClose,
  books,
  posts,
  onOpenReport,
  onSelectForPost,
}: StatsDetailModalProps) {
  useEffect(() => {
    if (!detailType) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailType, onClose]);

  if (!detailType) return null;

  const readingBooks = books.filter((b) => b.status === 'READING');
  const completedBooks = books.filter((b) => b.status === 'COMPLETED');
  const quotePosts = posts.filter(
    (p) => p.post_type === 'QUOTE' || Boolean(p.quote && p.quote.trim())
  );
  const pageBooks = [...books].sort((a, b) => (b.current_page || 0) - (a.current_page || 0));
  const totalPagesRead = books.reduce((sum, b) => sum + (b.current_page || 0), 0);
  const bookMap = new Map(books.map((b) => [b.id, b]));

  const headerConfig: Record<
    StatsDetailType,
    { title: string; subtitle: string; icon: React.ReactNode; badgeClass: string }
  > = {
    READING: {
      title: `읽고 있는 책 (${readingBooks.length}권)`,
      subtitle: '현재 진행 중인 도서의 쪽수와 진도율 내역입니다.',
      icon: <BookOpen className="w-5 h-5" />,
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    COMPLETED: {
      title: `완독한 책 (${completedBooks.length}권)`,
      subtitle: '끝까지 읽은 도서 목록입니다. 종합 감상문을 확인하거나 작성할 수 있습니다.',
      icon: <Award className="w-5 h-5" />,
      badgeClass: 'bg-emerald-100 text-emerald-800',
    },
    QUOTES: {
      title: `수집한 문장 (${quotePosts.length}개)`,
      subtitle: '내가 기록한 책 속 문장과 단상 모음입니다.',
      icon: <Bookmark className="w-5 h-5" />,
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    PAGES: {
      title: `누적 읽은 쪽수 (${totalPagesRead.toLocaleString()}p)`,
      subtitle: '서재에 등록된 도서별 읽은 쪽수 내역입니다.',
      icon: <TrendingUp className="w-5 h-5" />,
      badgeClass: 'bg-blue-100 text-blue-800',
    },
  };

  const meta = headerConfig[detailType];

  const renderBookRow = (book: Book, showProgressActions: boolean) => {
    const pct =
      book.total_pages > 0
        ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
        : 0;
    return (
      <div
        key={book.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8F0] border border-[#E8E3D5]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-16 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0">
            {book.thumbnail_url ? (
              <Image src={book.thumbnail_url} alt={book.title} fill sizes="44px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-800">
                <BookOpen className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-neutral-900 truncate">{book.title}</h4>
            <p className="text-xs text-neutral-500 truncate">
              {book.authors || '저자 미상'}
              {book.publisher ? ` · ${book.publisher}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 max-w-[160px] h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-neutral-700 whitespace-nowrap">
                {book.current_page.toLocaleString()} / {book.total_pages > 0 ? `${book.total_pages.toLocaleString()}p` : '?p'} ({pct}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-end flex-shrink-0">
          {onOpenReport && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReport(book);
              }}
              className="touch-target px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E8E3D5] hover:border-amber-400 text-neutral-800 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>감상문</span>
            </button>
          )}
          {showProgressActions && onSelectForPost && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectForPost(book);
              }}
              className="touch-target px-2.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>기록</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-neutral-100 bg-[#FAF8F0]/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.badgeClass}`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 truncate">
                {meta.title}
              </h3>
              <p className="text-xs text-neutral-500 truncate">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-2 text-neutral-400 hover:text-neutral-700 rounded-xl flex-shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 목록 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {detailType === 'READING' &&
            (readingBooks.length > 0 ? (
              readingBooks.map((b) => renderBookRow(b, true))
            ) : (
              <p className="py-10 text-center text-xs text-neutral-500">
                현재 읽고 있는 책이 없습니다. 도서 검색으로 새 책을 등록해 보세요.
              </p>
            ))}

          {detailType === 'COMPLETED' &&
            (completedBooks.length > 0 ? (
              completedBooks.map((b) => renderBookRow(b, false))
            ) : (
              <p className="py-10 text-center text-xs text-neutral-500">
                아직 완독한 책이 없습니다. 진도율 100%에 도달하면 자동으로 이곳에 표시됩니다.
              </p>
            ))}

          {detailType === 'PAGES' &&
            (pageBooks.length > 0 ? (
              pageBooks.map((b) => renderBookRow(b, true))
            ) : (
              <p className="py-10 text-center text-xs text-neutral-500">
                아직 서재에 등록된 책이 없습니다.
              </p>
            ))}

          {detailType === 'QUOTES' &&
            (quotePosts.length > 0 ? (
              quotePosts.map((post) => {
                const linkedBook = post.books || (post.book_id ? bookMap.get(post.book_id) : undefined);
                const dateLabel = new Date(post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-[#FAF8F0] border border-[#E8E3D5] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-neutral-800 truncate">
                        {linkedBook ? linkedBook.title : '도서 미지정'}
                        {post.page_number ? (
                          <span className="ml-1.5 text-amber-800 font-semibold">
                            · {post.page_number}p
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 text-[11px] text-neutral-500">
                        {post.is_public ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-medium">
                            <Globe className="w-3 h-3" /> 공개
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-neutral-500 font-medium">
                            <Lock className="w-3 h-3" /> 나만보기
                          </span>
                        )}
                        <span>{dateLabel}</span>
                      </div>
                    </div>

                    {post.quote && (
                      <blockquote className="bg-white border-l-4 border-amber-500 rounded-r-xl p-3 text-xs sm:text-sm text-neutral-800 italic font-serif leading-relaxed whitespace-pre-line">
                        <Quote className="w-3.5 h-3.5 text-amber-400 mb-1" />
                        &ldquo;{post.quote}&rdquo;
                      </blockquote>
                    )}

                    {post.content && (
                      <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-xs text-neutral-500">
                아직 수집한 문장이 없습니다. [기록하기]에서 마음에 남은 문장을 남겨보세요.
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
