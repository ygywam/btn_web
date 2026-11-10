'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BookOpen, CheckCircle, Clock, Bookmark, Lock, Globe, Plus, Minus, Edit3 } from 'lucide-react';
import type { Book, BookStatus } from '@/types/database';

interface BookCardProps {
  book: Book;
  onUpdateProgress: (bookId: string, newPage: number) => void;
  onUpdateStatus: (bookId: string, newStatus: BookStatus) => void;
  onUpdateTotalPages?: (bookId: string, newTotal: number) => void;
  onSelectForPost?: (book: Book) => void;
}

export default function BookCard({
  book,
  onUpdateProgress,
  onUpdateStatus,
  onUpdateTotalPages,
  onSelectForPost,
}: BookCardProps) {
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [pageInput, setPageInput] = useState(book.current_page.toString());
  const [totalInput, setTotalInput] = useState(book.total_pages.toString());

  // 진도율 퍼센트 계산 (0 ~ 100%)
  const percentage = book.total_pages > 0
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
    : 0;

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const clamped = book.total_pages > 0 ? Math.min(parsed, book.total_pages) : parsed;
      onUpdateProgress(book.id, clamped);
      setPageInput(clamped.toString());
    }
    setIsEditingPage(false);
  };

  const handleTotalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(totalInput, 10);
    if (!isNaN(parsed) && parsed > 0 && onUpdateTotalPages) {
      onUpdateTotalPages(book.id, parsed);
    }
    setIsEditingTotal(false);
  };

  const handleQuickPageChange = (delta: number) => {
    const next = Math.max(0, book.current_page + delta);
    const clamped = book.total_pages > 0 ? Math.min(next, book.total_pages) : next;
    onUpdateProgress(book.id, clamped);
    setPageInput(clamped.toString());
  };

  // 상태 배지 매핑
  const statusConfig = {
    READING: { label: '읽는 중', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    COMPLETED: { label: '완독 🎉', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    WISH: { label: '읽고 싶은 책', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    HOLD: { label: '보류', color: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
  }[book.status];

  return (
    <div className={`group relative bg-white border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
      book.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/20' : 'border-[#E8E3D5]'
    }`}>
      
      {/* 상단: 상태 배지 및 공개여부 */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
          {book.is_public ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Globe className="w-3 h-3" /> 공개
            </span>
          ) : (
            <span className="flex items-center gap-1 text-neutral-400 font-medium">
              <Lock className="w-3 h-3" /> 나만보기
            </span>
          )}
        </div>
      </div>

      {/* 중간: 도서 표지 및 기본 메타 정보 */}
      <div className="flex gap-3.5 mb-4">
        {/* 표지 이미지 */}
        <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden shadow-md bg-neutral-100 border border-neutral-200">
          {book.thumbnail_url ? (
            <Image
              src={book.thumbnail_url}
              alt={book.title}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800">
              <BookOpen className="w-6 h-6 mb-1 opacity-70" />
              <span className="text-[10px] font-bold line-clamp-2">{book.title}</span>
            </div>
          )}
        </div>

        {/* 텍스트 메타 정보 (모바일 화면 밖 삐져나감 방지 min-w-0) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 line-clamp-2 leading-snug mb-1">
              {book.title}
            </h3>
            <p className="text-xs text-neutral-500 truncate mb-0.5">
              {book.authors || '저자 미상'}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">
              {book.publisher || '출판사 정보 없음'}
            </p>
          </div>

          {/* 독서 상태 변경 셀렉트 */}
          <select
            value={book.status}
            onChange={(e) => onUpdateStatus(book.id, e.target.value as BookStatus)}
            aria-label="독서 상태 변경"
            className="w-full text-xs font-medium py-1 px-2 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 hover:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          >
            <option value="READING">📖 읽는 중</option>
            <option value="COMPLETED">✅ 완독</option>
            <option value="WISH">⭐ 읽고 싶은 책</option>
            <option value="HOLD">⏸ 보류</option>
          </select>
        </div>
      </div>

      {/* 하단: 독서 진도율 바 및 쪽수 컨트롤 */}
      <div className="pt-3 border-t border-neutral-100">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-700">
            <span>진도율</span>
            <span className={`font-bold ${percentage === 100 ? 'text-emerald-600' : 'text-amber-700'}`}>
              {percentage}%
            </span>
            {percentage === 100 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                완독!
              </span>
            )}
          </div>

          {/* 쪽수 입력 및 전체 쪽수 수정 */}
          <div className="flex items-center gap-1 text-neutral-500">
            {isEditingPage ? (
              <form onSubmit={handlePageSubmit} className="inline-flex items-center">
                <input
                  type="number"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  autoFocus
                  onBlur={handlePageSubmit}
                  aria-label="현재 읽은 쪽수"
                  className="w-12 text-center text-xs py-0.5 px-1 rounded border border-amber-500 focus:outline-none bg-amber-50"
                />
              </form>
            ) : (
              <button
                onClick={() => setIsEditingPage(true)}
                className="hover:text-amber-700 font-semibold transition-colors underline decoration-dotted"
                title="클릭하여 현재 읽은 쪽수 직접 입력"
              >
                {book.current_page}
              </button>
            )}

            <span>/</span>

            {isEditingTotal ? (
              <form onSubmit={handleTotalSubmit} className="inline-flex items-center">
                <input
                  type="number"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  autoFocus
                  onBlur={handleTotalSubmit}
                  aria-label="전체 쪽수 수정"
                  className="w-14 text-center text-xs py-0.5 px-1 rounded border border-neutral-400 focus:outline-none"
                />
                <span className="text-neutral-400 text-[11px] ml-0.5">p</span>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingTotal(true)}
                className="text-neutral-400 hover:text-neutral-800 transition-colors flex items-center gap-0.5"
                title="클릭하여 전체 쪽수 수정"
              >
                <span>{book.total_pages > 0 ? `${book.total_pages}p` : '? p'}</span>
                <Edit3 className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
              </button>
            )}
          </div>
        </div>

        {/* 프로그레스 바 게이지 */}
        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentage === 100
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-amber-400 to-amber-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 퀵 액션 버튼들 (모바일 오터치 방지 gap-2, min-h-[36px]) */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuickPageChange(-5)}
              className="touch-target px-2 py-1 text-xs rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="-5페이지"
            >
              -5
            </button>
            <button
              onClick={() => handleQuickPageChange(5)}
              className="touch-target px-2 py-1 text-xs rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="+5페이지"
            >
              +5
            </button>
            <button
              onClick={() => handleQuickPageChange(10)}
              className="touch-target px-2 py-1 text-xs rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition-colors"
              title="+10페이지"
            >
              +10
            </button>
          </div>

          {onSelectForPost && (
            <button
              onClick={() => onSelectForPost(book)}
              className="touch-target px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
            >
              기록 쓰기
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
