'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, BookOpen, Quote, FileText, Loader2, Copy, Check, Globe, Share2, Lightbulb } from 'lucide-react';
import type { Book, Post } from '@/types/database';

interface BookReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  posts: Post[];
  onShareToFeed?: (content: string, bookId: string) => void;
}

export default function BookReportModal({
  isOpen,
  onClose,
  book,
  posts,
  onShareToFeed,
}: BookReportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);

  if (!isOpen || !book) return null;

  // 해당 책에 등록된 기록들만 필터링
  const bookPosts = posts.filter((p) => p.book_id === book.id);
  const bookQuotes = bookPosts.filter((p) => p.post_type === 'QUOTE' && Boolean(p.quote));
  const bookNotes = bookPosts.filter((p) => Boolean(p.content));

  // AI 종합 독서감상문 생성 요청
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/book-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book,
          posts: bookPosts,
        }),
      });

      const data = await res.json();
      if (data.content) {
        setReportContent(data.content);
      }
    } catch (err) {
      console.error('종합 감상문 생성 실패:', err);
      alert('독서감상문 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 클립보드 복사
  const handleCopy = () => {
    if (!reportContent) return;
    navigator.clipboard.writeText(reportContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 피드에 공유
  const handleShare = () => {
    if (!reportContent || !onShareToFeed) return;
    onShareToFeed(reportContent, book.id);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2500);
    alert('이 책의 종합 감상문이 전체 공개 피드에 게시되었습니다!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 bg-[#FAF8F0]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-neutral-900">
                도서 종합 AI 독서감상문
              </h3>
              <p className="text-xs text-neutral-500">
                수집한 문장과 사색 메모를 엮어 한 편의 깊이 있는 서평을 완성합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="touch-target p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* 1. 도서 메타 및 기록 브리핑 카드 */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E3D5] flex gap-3.5 items-center">
            <div className="relative w-14 h-20 rounded-lg overflow-hidden shadow-xs border border-neutral-200 bg-neutral-100 flex-shrink-0">
              {book.thumbnail_url ? (
                <Image
                  src={book.thumbnail_url}
                  alt={book.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-800">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1 ${
                book.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {book.status === 'COMPLETED' ? '✅ 완독 도서' : '📖 읽는 중'}
              </span>
              <h4 className="font-bold text-sm sm:text-base text-neutral-900 truncate">
                {book.title}
              </h4>
              <p className="text-xs text-neutral-500 truncate mb-1.5">
                {book.authors} · {book.publisher}
              </p>
              
              {/* 기록 통계 뱃지 */}
              <div className="flex items-center gap-2 text-[11px] text-neutral-600">
                <span className="font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  📜 수집 문장 <strong>{bookQuotes.length}</strong>개
                </span>
                <span className="font-medium bg-neutral-100 px-2 py-0.5 rounded-md">
                  📝 사색 메모 <strong>{bookNotes.length}</strong>건
                </span>
              </div>
            </div>
          </div>

          {/* 2. 생성 전 브리핑 및 AI 생성 버튼 */}
          {!reportContent && (
            <div className="p-6 text-center rounded-2xl bg-gradient-to-br from-[#FFFDF7] to-[#FAF5E6] border border-amber-200/80 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm sm:text-base text-neutral-900">
                  이 책에 남겨진 모든 기록을 종합해 서평을 작성할까요?
                </h4>
                <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                  내가 밑줄 긋고 수집한 문장들과 읽으며 기록한 생각들을 AI가 하나로 엮어 <strong>서론-본론-결론</strong>의 완성도 높은 종합 독서감상문을 작성해 드립니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="touch-target px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 inline-flex items-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>기록들을 종합하여 서평 작성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ AI 종합 독서감상문 생성하기</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 3. 완성된 종합 독서감상문 에세이 뷰어 */}
          {reportContent && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* 상단 컨트롤 바 */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  종합 독서감상문 완성
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="touch-target px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center gap-1 transition-all"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? '복사됨!' : '전체 복사'}</span>
                  </button>

                  {onShareToFeed && (
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={isShared}
                      className="touch-target px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1 transition-all shadow-2xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{isShared ? '공유 완료' : '피드에 공유'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 감상문 본문 텍스트 에리어 */}
              <div className="p-5 sm:p-6 bg-[#FAF8F0] border border-[#E8E3D5] rounded-2xl whitespace-pre-wrap text-xs sm:text-sm text-neutral-800 leading-relaxed font-serif shadow-2xs">
                {reportContent}
              </div>

              {/* 다시 생성 버튼 */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="text-xs text-neutral-400 hover:text-amber-800 underline transition-colors"
                >
                  다른 느낌으로 다시 작성하기
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
