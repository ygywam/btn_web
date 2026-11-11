'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, X, Loader2, BookPlus, BookOpen, Check } from 'lucide-react';
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
  
  // 선택한 책의 쪽수 입력을 위한 상태
  const [selectedItemForAdd, setSelectedItemForAdd] = useState<KakaoBookItem | null>(null);
  const [inputTotalPages, setInputTotalPages] = useState('250');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSelectedItemForAdd(null);

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

  const handleOpenAddConfirm = (item: KakaoBookItem) => {
    setSelectedItemForAdd(item);
    setInputTotalPages('250'); // 기본 추천 쪽수
  };

  const handleConfirmAdd = () => {
    if (!selectedItemForAdd) return;

    const parsedPages = parseInt(inputTotalPages, 10);
    const pages = (!isNaN(parsedPages) && parsedPages > 0) ? parsedPages : 250;

    onAddBook({
      title: selectedItemForAdd.title,
      authors: selectedItemForAdd.authors?.join(', ') || '저자 미상',
      publisher: selectedItemForAdd.publisher || '출판사 미상',
      thumbnail_url: selectedItemForAdd.thumbnail || '',
      total_pages: pages,
      status: selectedStatus,
    });

    setSelectedItemForAdd(null);
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
              제목이나 저자로 책을 찾아 내 서재에 등록합니다.
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

        {/* 검색 폼 */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-[#FAF8F0]/50">
          <form onSubmit={handleSearch} className="flex gap-2">
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
              className="touch-target px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition-all flex items-center gap-1.5 flex-shrink-0 shadow-xs"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
            </button>
          </form>
        </div>

        {/* 선택한 책의 쪽수 확인 미니 팝업 / 바텀 시트 */}
        {selectedItemForAdd && (
          <div className="p-4 bg-amber-100/70 border-b border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {selectedItemForAdd.thumbnail ? (
                <img
                  src={selectedItemForAdd.thumbnail}
                  alt={selectedItemForAdd.title}
                  className="w-10 h-14 object-cover rounded shadow-xs border border-amber-300 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-amber-200 rounded flex items-center justify-center text-amber-800 flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                  서재에 담기 전 확인
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                  {selectedItemForAdd.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-xs font-semibold text-neutral-700">전체 쪽수:</label>
                  <input
                    type="number"
                    value={inputTotalPages}
                    onChange={(e) => setInputTotalPages(e.target.value)}
                    className="w-20 px-2 py-0.5 text-xs font-bold rounded bg-white border border-amber-400 text-neutral-900 text-center"
                    placeholder="예: 250"
                  />
                  <span className="text-xs text-neutral-600">쪽</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSelectedItemForAdd(null)}
                className="touch-target px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 rounded-lg"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="touch-target px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>서재에 담기 완료</span>
              </button>
            </div>
          </div>
        )}

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
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-xs bg-neutral-100 flex-shrink-0 border border-black/5">
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
                  onClick={() => handleOpenAddConfirm(item)}
                  className="touch-target px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-slate-950 transition-all flex items-center gap-1 flex-shrink-0 shadow-xs"
                >
                  <BookPlus className="w-3.5 h-3.5" />
                  <span>내 책장에 담기</span>
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
