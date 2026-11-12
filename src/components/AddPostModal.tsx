'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Globe, Lock, Loader2, Quote, BookOpen, Send, Camera, HelpCircle } from 'lucide-react';
import SpotlightCoachmark, { type TourStep } from '@/components/SpotlightCoachmark';
import type { Book, PostType } from '@/types/database';

const POST_MODAL_STEPS: TourStep[] = [
  {
    targetSelector: '[data-post-tour="book-select"]',
    title: '1. 기록할 도서 선택',
    description: '현재 기록이 저장될 책입니다. 책 카드에서 열면 해당 책으로 고정되며 [다른 책 선택]으로 변경할 수 있습니다.',
  },
  {
    targetSelector: '[data-post-tour="post-type"]',
    title: '2. 기록 유형 고르기',
    description: '문장 수집(인용구·쪽수), 진도 & 메모(입력한 쪽수로 서재 진행률 자동 갱신), 자유 단상 중 원하는 형식을 선택합니다.',
    postitTip: '진도 & 메모에 쪽수를 입력하면 내 서재 진도율이 바로 바뀝니다.',
  },
  {
    targetSelector: '[data-post-tour="ocr-btn"]',
    title: '3. 책 사진 스캔 (OCR)',
    description: '카메라로 책 페이지를 찍거나 이미지를 고르면 본문 글자를 읽어 입력칸에 채워줍니다.',
    postitTip: '개인정보나 얼굴·신분증이 찍히지 않게 책 페이지만 촬영하세요.',
  },
  {
    targetSelector: '[data-post-tour="ai-btn"]',
    title: '4. AI 독서노트',
    description: '선택한 도서와 작성한 문장·메모를 바탕으로 독서감상문 초안을 정리해 줍니다.',
    postitTip: '계정 정보는 빼고 책과 기록 본문만 전달됩니다.',
  },
  {
    targetSelector: '[data-post-tour="visibility"]',
    title: '5. 공개 범위 설정',
    description: '기본값은 본인만 보는 비공개입니다. 스위치를 켜면 피드 탭에 전체 공개됩니다.',
  },
];

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

// 모바일 카메라 고화질 사진이 Vercel 요청 크기 제한(4.5MB)을 넘지 않도록 클라이언트에서 적정 크기로 압축
async function compressImageForOcr(file: File, maxDimension = 1600, quality = 0.86): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('브라우저 환경에서만 이미지를 처리할 수 있습니다.');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const { width, height } = img;
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('이미지 캔버스를 초기화할 수 없습니다.');
        }

        // 투명 PNG 등도 깔끔히 JPEG로 변환되도록 흰 배경을 채움
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (canvasErr) {
        reject(canvasErr);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('이미지 파일을 읽지 못했습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('이미지 파일을 읽지 못했습니다.'));
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

export default function AddPostModal({
  isOpen,
  onClose,
  books,
  selectedBookId,
  onSubmit,
}: AddPostModalProps) {
  const [bookId, setBookId] = useState(selectedBookId || '');
  const [isLockedBook, setIsLockedBook] = useState(Boolean(selectedBookId));
  const [postType, setPostType] = useState<PostType>('QUOTE');
  const [quote, setQuote] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false); // 기본 비공개 원칙
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPostTourOpen, setIsPostTourOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 열리거나 선택된 책이 바뀔 때 동기화
  useEffect(() => {
    if (isOpen) {
      setOcrError(null);
      setAiError(null);
      if (selectedBookId) {
        setBookId(selectedBookId);
        setIsLockedBook(true);
      } else {
        setIsLockedBook(false);
        if (!bookId && books.length > 0) {
          setBookId(books[0].id);
        }
      }
    }
  }, [selectedBookId, isOpen, books]);

  if (!isOpen) return null;

  const currentBook = books.find((b) => b.id === bookId);

  // 카메라 촬영 및 갤러리 사진 OCR 텍스트 추출
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrError(null);
    try {
      const base64Data = await compressImageForOcr(file);
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '사진 속 텍스트 추출 중 오류가 발생했습니다.');
      }
      if (!data.text || typeof data.text !== 'string') {
        throw new Error('사진에서 읽을 수 있는 글자를 찾지 못했습니다.');
      }

      const extracted = data.text.trim();
      if (postType === 'QUOTE') {
        setQuote((prev) => (prev ? `${prev} ${extracted}` : extracted));
      } else {
        setContent((prev) => (prev ? `${prev}\n${extracted}` : extracted));
      }
    } catch (err) {
      console.error('OCR 요청 에러:', err);
      setOcrError(
        err instanceof Error
          ? err.message
          : '사진 속 텍스트 추출 중 오류가 발생했습니다.'
      );
    } finally {
      setIsOcrProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAiGenerate = async () => {
    setAiError(null);
    if (!currentBook && !quote.trim() && !content.trim()) {
      setAiError('책을 선택하거나 문장 또는 메모를 입력한 후 AI 독서노트를 작성해 보세요.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentBook?.title,
          quote: quote.trim(),
          userNotes: content.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'AI 독서노트 생성 중 오류가 발생했습니다.');
      }
      if (!data.content || typeof data.content !== 'string') {
        throw new Error('AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.');
      }
      setContent((prev) => (prev ? `${prev}\n\n[AI 감상 노트]\n${data.content}` : data.content));
    } catch (err) {
      console.error('AI 감상문 생성 오류:', err);
      setAiError(
        err instanceof Error
          ? err.message
          : 'AI 독서노트 생성 중 오류가 발생했습니다.'
      );
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

    const parsedPage = pageNumber ? parseInt(pageNumber, 10) : undefined;

    onSubmit({
      book_id: bookId || null,
      post_type: postType,
      content: content.trim(),
      quote: quote.trim() || undefined,
      page_number: parsedPage,
      is_public: isPublic,
    });

    // 폼 초기화 후 닫기
    setQuote('');
    setContent('');
    setPageNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 숨겨진 카메라/파일 업로드 input (모바일 카메라 후면 촬영 지원) */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-neutral-900">
              독서 기록 & 문장 수집
            </h3>
            <p className="text-xs text-neutral-500">
              문장, 진도, 단상을 서재에 남깁니다.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPostTourOpen(true)}
              className="touch-target px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1 transition-colors"
              title="독서 기록 사용법 보기"
              aria-label="독서 기록 사용법 보기"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>사용법</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="touch-target p-2 text-neutral-400 hover:text-neutral-700 rounded-xl"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 메인 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">

          {/* 1. 도서 선택 */}
          <div data-post-tour="book-select">
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              기록할 도서
            </label>
            {isLockedBook && currentBook ? (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {currentBook.thumbnail_url ? (
                    <img
                      src={currentBook.thumbnail_url}
                      alt={currentBook.title}
                      className="w-10 h-14 object-cover rounded-lg shadow-xs flex-shrink-0 border border-black/5"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-amber-100 rounded-lg flex items-center justify-center text-amber-800 flex-shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full mb-1">
                      📌 이 책에 기록 고정됨
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                      {currentBook.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {currentBook.authors} · {currentBook.publisher}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLockedBook(false)}
                  className="touch-target text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 underline flex-shrink-0 px-2 py-1"
                >
                  다른 책 선택
                </button>
              </div>
            ) : (
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full text-xs sm:text-sm py-2.5 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">책 선택 안 함 (자유 기록)</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.authors})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. 기록 유형 탭 */}
          <div
            data-post-tour="post-type"
            className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-600"
          >
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

          {/* 3. 진도 & 메모일 때: 읽은 페이지 수 입력란 */}
          {postType === 'PROGRESS' && (
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-neutral-800">오늘 읽은 페이지:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="예: 120"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  className="w-20 px-2.5 py-1 text-xs font-bold text-center rounded-lg bg-white border border-amber-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-neutral-500">
                  / {currentBook?.total_pages ? `${currentBook.total_pages}p` : '? p'}
                </span>
              </div>
            </div>
          )}

          {/* 4. 문장 수집일 경우 따옴표 인용구 및 페이지 */}
          {postType === 'QUOTE' && (
            <div className="p-3.5 rounded-2xl bg-[#FFFDF7] border border-amber-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <Quote className="w-3.5 h-3.5 text-amber-600" />
                  마음에 남은 책 속 문장
                </label>
                {/* 카메라 OCR 버튼 */}
                <button
                  type="button"
                  data-post-tour="ocr-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOcrProcessing}
                  className="touch-target px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 active:scale-95 rounded-lg flex items-center gap-1 transition-all"
                  title="카메라로 책 페이지를 찍어 문장을 자동 입력합니다"
                >
                  {isOcrProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span>{isOcrProcessing ? '글자 읽는 중...' : '책 사진 스캔'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="책 속 문장을 적거나 상단의 [책 사진 스캔]으로 불러오세요."
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full min-w-0 p-2 text-xs sm:text-sm rounded-lg bg-white border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-800"
              />
              {ocrError && (
                <div
                  role="alert"
                  className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] sm:text-xs text-rose-800 leading-relaxed"
                >
                  {ocrError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">문장 위치:</span>
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

          {/* 5. 나의 생각 및 단상 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700">
                {postType === 'PROGRESS' ? '오늘 읽으며 남긴 생각 & 메모' : '나의 생각 & 독서 단상'}
              </label>

              <div className="flex items-center gap-1.5">
                {/* 진도 메모나 단상에서도 사진 스캔 가능 */}
                {postType !== 'QUOTE' && (
                  <button
                    type="button"
                    data-post-tour="ocr-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOcrProcessing}
                    className="touch-target px-2 py-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:scale-95 rounded-lg flex items-center gap-1 transition-all"
                  >
                    {isOcrProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-neutral-600" />
                    )}
                    <span>사진 스캔</span>
                  </button>
                )}

                <button
                  type="button"
                  data-post-tour="ai-btn"
                  onClick={handleAiGenerate}
                  disabled={isGeneratingAi}
                  className="touch-target px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 active:scale-95 rounded-lg flex items-center gap-1 transition-all"
                  title="책 정보와 작성한 메모를 바탕으로 감상문 초안을 정리합니다"
                >
                  {isGeneratingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>AI 독서노트 작성</span>
                </button>
              </div>
            </div>

            {((postType !== 'QUOTE' && ocrError) || aiError) && (
              <div
                role="alert"
                className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] sm:text-xs text-rose-800 leading-relaxed space-y-1"
              >
                {postType !== 'QUOTE' && ocrError && <div>{ocrError}</div>}
                {aiError && <div>{aiError}</div>}
              </div>
            )}

            <textarea
              rows={4}
              placeholder="책을 읽으며 떠오른 생각이나 메모를 적어 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-w-0 p-3 text-xs sm:text-sm rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900"
            />
          </div>

          {/* 6. 공개 / 비공개 토글 */}
          <div
            data-post-tour="visibility"
            className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F0] border border-[#E8E3D5]"
          >
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

      {/* 독서 기록 모달 전용 포스트잇 튜토리얼 */}
      {isPostTourOpen && (
        <SpotlightCoachmark
          forceOpen={true}
          onClose={() => setIsPostTourOpen(false)}
          steps={POST_MODAL_STEPS}
          storageKey=""
          badgeLabel="기록 작성 사용법"
          zIndexClass="z-[60]"
        />
      )}
    </div>
  );
}
