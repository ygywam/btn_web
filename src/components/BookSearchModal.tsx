'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, X, Loader2, BookPlus, BookOpen } from 'lucide-react';
import type { KakaoBookItem, BookStatus } from '@/types/database';

interface BookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: {
    title: string;
    authors: string;
    publisher: string;
    thumbnail_url: string;
    total_pages: number;
    status: BookStatus;
  }) => void;
}

export default function BookSearchModal({
  isOpen,
  onClose,
  onAddBook,
}: BookSearchModalProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<KakaoBookItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>('READING');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/books/search?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.documents) {
        setResults(data.documents);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (item: KakaoBookItem) => {
    onAddBook({
      title: item.title,
      authors: item.authors?.join(', ') || '저자 미상',
      publisher: item.publisher || '출판사 미상',
      thumbnail_url: item.thumbnail || '',
      total_pages: 300, // 기본 쪽수 (카카오 기본 정보에 쪽수가 없을 경우 300p 기본값)
      status: selectedStatus,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-neutral-900">
              도서 검색 및 서재 등록
            </h3>
            <p className="text-xs text-neutral-500">
              카카오 도서 검색으로 읽고 있는 책을 서재에 추가하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 폼 (모바일 오버플로우 방지) */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-[#FAF8F0]/50">
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="책 제목 또는 저자명 입력..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="touch-target px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
            </button>
          </form>

          {/* 등록 시 기본 독서 상태 선택 */}
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span>등록할 상태:</span>
            <div className="flex items-center gap-1">
              {(['READING', 'WISH', 'COMPLETED'] as BookStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`touch-target px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedStatus === st
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600'
                  }`}
                >
                  {st === 'READING' ? '📖 읽는 중' : st === 'WISH' ? '⭐ 읽고 싶은' : '✅ 완독'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 검색 결과 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">카카오에서 책을 찾는 중...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-16 rounded overflow-hidden shadow-xs bg-neutral-100 flex-shrink-0">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-800">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {item.authors?.join(', ') || '저자 미상'} · {item.publisher || '출판사 미상'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(item)}
                  className="touch-target px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-slate-950 transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <BookPlus className="w-3.5 h-3.5" />
                  <span>담기</span>
                </button>
              </div>
            ))
          ) : hasSearched ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 text-xs">
              책 제목이나 저자 이름으로 검색해 보세요.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
