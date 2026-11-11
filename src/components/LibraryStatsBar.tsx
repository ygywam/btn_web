'use client';

import React from 'react';
import { BookOpen, Bookmark, TrendingUp, ChevronRight } from 'lucide-react';
import type { StatsDetailType } from '@/components/StatsDetailModal';

interface LibraryStatsBarProps {
  readingCount: number;
  completedCount: number;
  quoteCount: number;
  onSelectStat: (type: StatsDetailType) => void;
}

/**
 * 내 서재 상단에 읽고 있는 책·완독한 책·수집한 문장 수치를 보여주고 클릭 시 세부 내역 모달을 여는 바
 */
export default function LibraryStatsBar({
  readingCount,
  completedCount,
  quoteCount,
  onSelectStat,
}: LibraryStatsBarProps) {
  const items: Array<{
    type: StatsDetailType;
    label: string;
    count: number;
    icon: React.ReactNode;
    iconBg: string;
    hoverArrow: string;
  }> = [
    {
      type: 'READING',
      label: '읽고 있는 책',
      count: readingCount,
      icon: <BookOpen className="w-5 h-5" />,
      iconBg: 'bg-amber-100 text-amber-800',
      hoverArrow: 'group-hover:text-amber-600',
    },
    {
      type: 'COMPLETED',
      label: '완독한 책',
      count: completedCount,
      icon: <TrendingUp className="w-5 h-5" />,
      iconBg: 'bg-emerald-100 text-emerald-800',
      hoverArrow: 'group-hover:text-emerald-600',
    },
    {
      type: 'QUOTES',
      label: '수집한 문장',
      count: quoteCount,
      icon: <Bookmark className="w-5 h-5" />,
      iconBg: 'bg-amber-100 text-amber-800',
      hoverArrow: 'group-hover:text-amber-600',
    },
  ];

  return (
    <div
      data-tour="library-stats"
      className="grid grid-cols-3 gap-2.5 sm:gap-4 p-3 sm:p-5 bg-white border border-[#E8E3D5] rounded-3xl shadow-sm"
    >
      {items.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onSelectStat(item.type)}
          className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 p-2 rounded-2xl hover:bg-[#FAF8F0] transition-colors text-center sm:text-left group cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.iconBg}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-extrabold text-neutral-900">{item.count}</div>
              <div className="text-[11px] sm:text-xs text-neutral-500 font-medium">{item.label}</div>
            </div>
          </div>
          <ChevronRight
            className={`hidden sm:block w-4 h-4 text-neutral-300 self-center transition-colors ${item.hoverArrow}`}
          />
        </button>
      ))}
    </div>
  );
}
