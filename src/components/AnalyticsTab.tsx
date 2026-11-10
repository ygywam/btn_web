'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Sparkles, TrendingUp, Bookmark, Award, Search, Loader2, ArrowRight, UserCheck } from 'lucide-react';
import type { Book, Post } from '@/types/database';

interface AnalyticsTabProps {
  books: Book[];
  posts: Post[];
  onSearchBook: (bookTitle: string) => void;
}

interface AiReport {
  profileSummary: string;
  topAuthors: Array<{ name: string; count: number }>;
  recommendations: Array<{
    title: string;
    authors: string;
    reason: string;
    theme: string;
  }>;
}

export default function AnalyticsTab({ books, posts, onSearchBook }: AnalyticsTabProps) {
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);

  // 기본 통계 계산
  const completedBooks = books.filter((b) => b.status === 'COMPLETED');
  const readingBooks = books.filter((b) => b.status === 'READING');
  const quotesCount = posts.filter((p) => Boolean(p.quote)).length;
  const totalPagesRead = books.reduce((acc, cur) => acc + (cur.current_page || 0), 0);

  // AI 분석 요청
  const handleGenerateAnalysis = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books, posts }),
      });
      const data = await res.json();
      if (data.profileSummary) {
        setAiReport(data);
      }
    } catch (err) {
      console.error('AI 분석 실패:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // 작가별 집계
  const authorMap: Record<string, number> = {};
  books.forEach((b) => {
    const author = b.authors ? b.authors.split(',')[0].trim() : '미상';
    authorMap[author] = (authorMap[author] || 0) + 1;
  });
  const sortedAuthors = Object.entries(authorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. 상단 통계 요약 카드 4종 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white border border-[#E8E3D5] rounded-3xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-2">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">{completedBooks.length}권</div>
          <div className="text-xs text-neutral-500 font-medium">완독한 도서</div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-[#E8E3D5] rounded-3xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">{readingBooks.length}권</div>
          <div className="text-xs text-neutral-500 font-medium">읽고 있는 도서</div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-[#E8E3D5] rounded-3xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800 mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">{totalPagesRead.toLocaleString()}p</div>
          <div className="text-xs text-neutral-500 font-medium">누적 읽은 쪽수</div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-[#E8E3D5] rounded-3xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-2">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900">{quotesCount}개</div>
          <div className="text-xs text-neutral-500 font-medium">수집한 문장</div>
        </div>
      </div>

      {/* 2. AI 독서 비서: 성향 분석 및 다음에 읽을 책 추천 */}
      <div className="p-5 sm:p-7 bg-gradient-to-br from-[#FFFDF7] to-[#FAF5E6] border border-amber-200/80 rounded-3xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-neutral-900">
                AI 독서 비서 & 맞춤 도서 추천
              </h3>
              <p className="text-xs text-neutral-500">
                내 서재의 책과 수집한 문장을 분석해 나의 독서 성향을 분석하고 다음 책을 추천해 드립니다.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAnalysis}
            disabled={isLoadingAi}
            className="touch-target px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            {isLoadingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>독서 기록 분석 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{aiReport ? '다시 분석하기' : '✨ AI 독서 분석 & 추천받기'}</span>
              </>
            )}
          </button>
        </div>

        {/* AI 분석 결과 리포트 */}
        {aiReport && (
          <div className="space-y-5 pt-3 border-t border-amber-200/60 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* 성향 분석 카드 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                🧠 나의 독서 성향 리포트
              </span>
              <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium">
                {aiReport.profileSummary}
              </p>
            </div>

            {/* 추천 도서 3권 카드 그리드 */}
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-neutral-800 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                다음에 읽으면 좋을 맞춤 추천 도서
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {aiReport.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#E8E3D5] shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
                        {rec.theme}
                      </span>
                      <h5 className="font-bold text-sm text-neutral-900 leading-snug mb-0.5">
                        {rec.title}
                      </h5>
                      <p className="text-xs text-neutral-500 mb-2">
                        {rec.authors}
                      </p>
                      <p className="text-[11px] text-neutral-600 leading-relaxed bg-[#FAF8F0] p-2.5 rounded-xl border border-neutral-100 mb-3">
                        {rec.reason}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSearchBook(rec.title)}
                      className="touch-target w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>책장에 바로 담기</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 완독 도서 컬렉션 갤러리 */}
      <div className="p-5 sm:p-6 bg-white border border-[#E8E3D5] rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base sm:text-lg text-neutral-900">
              완독 도서 컬렉션 ({completedBooks.length}권)
            </h3>
          </div>
          <span className="text-xs text-neutral-400">
            진도율 100% 도달 시 자동 등록
          </span>
        </div>

        {completedBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {completedBooks.map((b) => (
              <div key={b.id} className="group relative flex flex-col items-center text-center">
                <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-sm border border-neutral-200 bg-neutral-100 mb-2">
                  {b.thumbnail_url ? (
                    <Image
                      src={b.thumbnail_url}
                      alt={b.title}
                      fill
                      sizes="150px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-800 p-2 text-[10px] font-bold">
                      {b.title}
                    </div>
                  )}
                  <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                    완독
                  </span>
                </div>
                <h5 className="font-bold text-xs text-neutral-900 line-clamp-1 w-full">{b.title}</h5>
                <p className="text-[11px] text-neutral-500 truncate w-full">{b.authors}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-neutral-400">
            <Award className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-700 mb-1">아직 완독한 책이 없습니다.</p>
            <p className="text-[11px] text-neutral-400">
              서재에서 읽은 페이지를 기록하여 100%에 도달하면 이곳에 멋진 완독 배지와 함께 기록됩니다!
            </p>
          </div>
        )}
      </div>

      {/* 4. 작가별 통계 순위 */}
      {sortedAuthors.length > 0 && (
        <div className="p-5 sm:p-6 bg-white border border-[#E8E3D5] rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-neutral-900">
              내가 가장 많이 만난 작가
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {sortedAuthors.map(([author, count], idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-[#FAF8F0] border border-[#E8E3D5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800">TOP {idx + 1}</span>
                  <div className="text-xs font-bold text-neutral-900 truncate max-w-[100px]">{author}</div>
                </div>
                <span className="text-xs font-extrabold text-neutral-600">{count}권</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
