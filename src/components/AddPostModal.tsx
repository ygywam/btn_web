'use client';

import React, { useState } from 'react';
import { X, Sparkles, Globe, Lock, Loader2, Quote, BookOpen, Send } from 'lucide-react';
import type { Book, PostType } from '@/types/database';

interface AddPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  selectedBookId?: string;
  onSubmit: (post: {
    book_id: string | null;
    post_type: PostType;
    content: string;
    quote?: string;
    page_number?: number;
    is_public: boolean;
  }) => void;
}

export default function AddPostModal({
  isOpen,
  onClose,
  books,
  selectedBookId,
  onSubmit,
}: AddPostModalProps) {
  const [bookId, setBookId] = useState(selectedBookId || (books[0]?.id ?? ''));
  const [postType, setPostType] = useState<PostType>('QUOTE');
  const [quote, setQuote] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false); // 기본 비공개 원칙
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isOpen) return null;

  const handleAiGenerate = async () => {
    const selectedBook = books.find((b) => b.id === bookId);
    if (!selectedBook && !quote && !content) {
      alert('책을 선택하거나 문장 또는 메모를 입력한 후 AI 감상문을 생성해 보세요.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedBook?.title,
          quote: quote.trim(),
          userNotes: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.content) {
        setContent((prev) => (prev ? `${prev}\n\n[엑사원 AI 감상문]\n${data.content}` : data.content));
      }
    } catch (err) {
      console.error('AI 감상문 생성 오류:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !quote.trim()) {
      alert('문장이나 내용을 한 줄 이상 적어주세요.');
      return;
    }

    onSubmit({
      book_id: bookId || null,
      post_type: postType,
      content: content.trim(),
      quote: quote.trim() || undefined,
      page_number: pageNumber ? parseInt(pageNumber, 10) : undefined,
      is_public: isPublic,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-neutral-900">
              독서 기록 & 문장 수집
            </h3>
            <p className="text-xs text-neutral-500">
              책 속 인상 깊은 구절과 생각을 소중히 남겨보세요.
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

        {/* 메인 폼 본문 (스크롤 지원, 모바일 인풋 잘림 방지) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          
          {/* 1. 도서 선택 */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              어떤 책의 기록인가요?
            </label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">책 선택 안 함 (자유 기록)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.authors})
                </option>
              ))}
            </select>
          </div>

          {/* 2. 기록 유형 탭 */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-600">
            <button
              type="button"
              onClick={() => setPostType('QUOTE')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                postType === 'QUOTE' ? 'bg-white text-neutral-900 shadow-xs' : ''
              }`}
            >
              📜 문장 수집
            </button>
            <button
              type="button"
              onClick={() => setPostType('PROGRESS')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                postType === 'PROGRESS' ? 'bg-white text-neutral-900 shadow-xs' : ''
              }`}
            >
              📖 진도 & 메모
            </button>
            <button
              type="button"
              onClick={() => setPostType('NOTE')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                postType === 'NOTE' ? 'bg-white text-neutral-900 shadow-xs' : ''
              }`}
            >
              📝 자유 단상
            </button>
          </div>

          {/* 3. 문장 수집일 경우 따옴표 인용구 및 페이지 */}
          {postType === 'QUOTE' && (
            <div className="p-3 rounded-xl bg-[#FFFDF7] border border-amber-200 flex flex-col gap-2">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-amber-600" />
                마음에 남은 책 속 문장
              </label>
              <textarea
                rows={3}
                placeholder="책 속의 아름다운 문장을 그대로 적어보세요..."
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full min-w-0 p-2 text-xs sm:text-sm rounded-lg bg-white border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-800"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">페이지:</span>
                <input
                  type="number"
                  placeholder="예: 42"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  className="w-20 px-2 py-1 text-xs rounded border border-neutral-200 text-neutral-800"
                />
                <span className="text-xs text-neutral-400">p</span>
              </div>
            </div>
          )}

          {/* 4. 나의 생각 및 단상 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-700">
                나의 생각 & 독서 단상
              </label>
              {/* 엑사원 AI 감상문 버튼 */}
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isGeneratingAi}
                className="touch-target px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1 transition-all"
                title="엑사원 AI로 감상문 초안 자동 작성"
              >
                {isGeneratingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>엑사원 AI 감상문 초안</span>
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="이 구절을 읽으며 떠오른 생각, 내 삶에 비추어본 단상을 자유롭게 적어보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-w-0 p-3 text-xs sm:text-sm rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900"
            />
          </div>

          {/* 5. 공개 / 비공개 토글 (기본 비공개 원칙) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F0] border border-[#E8E3D5]">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-neutral-500" />
              )}
              <div>
                <div className="text-xs font-bold text-neutral-900">
                  {isPublic ? '전체 공개 (피드 공유)' : '기본 비공개 (나만 보기)'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {isPublic
                    ? '모든 독서가가 볼 수 있는 Explore 피드에 게시됩니다.'
                    : '내 서재에만 안전하게 보관됩니다.'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* 하단 저장 버튼 */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="touch-target px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="touch-target px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" />
              기록 저장하기
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
