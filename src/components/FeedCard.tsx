'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageSquare, Quote, Share2, Send, Trash2, BookOpen } from 'lucide-react';
import type { Post, Comment, Profile } from '@/types/database';

interface FeedCardProps {
  post: Post;
  currentUserId?: string;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export default function FeedCard({
  post,
  currentUserId,
  onToggleLike,
  onAddComment,
  onDeleteComment,
}: FeedCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>([]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  // 날짜 포맷 (예: 2026.11.10)
  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="bg-white border border-[#E8E3D5] rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
      
      {/* 1. 작성자 프로필 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xs">
            {post.profiles?.nickname ? post.profiles.nickname.slice(0, 1) : '독'}
          </div>
          <div>
            <div className="font-bold text-sm text-neutral-900">
              {post.profiles?.nickname || '독서가'}
            </div>
            <time className="text-[11px] text-neutral-400">
              {formattedDate}
            </time>
          </div>
        </div>

        {/* 게시물 타입 배지 */}
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF8F0] border border-[#E8E3D5] text-amber-800">
          {post.post_type === 'QUOTE' ? '📜 문장수집' : post.post_type === 'PROGRESS' ? '📖 진도기록' : '📝 단상'}
        </span>
      </div>

      {/* 2. 연결된 도서 미니 카드 */}
      {post.books && (
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF8F0] border border-[#E8E3D5]/80 mb-3.5">
          <div className="relative w-8 h-11 rounded overflow-hidden shadow-xs bg-neutral-200 flex-shrink-0">
            {post.books.thumbnail_url ? (
              <Image
                src={post.books.thumbnail_url}
                alt={post.books.title}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-800">
                <BookOpen className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-neutral-900 truncate">
              {post.books.title}
            </h4>
            <p className="text-[11px] text-neutral-500 truncate">
              {post.books.authors} · {post.page_number ? `${post.page_number}p` : ''}
            </p>
          </div>
        </div>
      )}

      {/* 3. 인상 깊은 문장 (따옴표 캘리그라피 인용 박스) */}
      {post.quote && (
        <div className="relative bg-[#FFFDF7] border-l-4 border-amber-500 rounded-r-xl p-3.5 mb-3.5 text-neutral-800 italic shadow-xs">
          <Quote className="w-4 h-4 text-amber-400 mb-1" />
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-serif">
            &ldquo;{post.quote}&rdquo;
          </p>
          {post.page_number && (
            <span className="block text-right text-[11px] text-neutral-400 not-italic mt-1">
              — {post.page_number}p 중에서
            </span>
          )}
        </div>
      )}

      {/* 4. 기록 본문 내용 */}
      {post.content && (
        <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-line mb-4">
          {post.content}
        </p>
      )}

      {/* 5. 소셜 액션 바: 좋아요 & 댓글 토글 */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
        <div className="flex items-center gap-2">
          {/* 좋아요 (하트) 버튼 */}
          <button
            onClick={() => onToggleLike(post.id)}
            className={`touch-target px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-90 ${
              post.user_has_liked
                ? 'text-rose-600 bg-rose-50 font-bold'
                : 'text-neutral-500 hover:text-rose-600 hover:bg-neutral-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.user_has_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </button>

          {/* 댓글 토글 버튼 */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="touch-target px-2.5 py-1.5 rounded-xl text-neutral-500 hover:text-amber-700 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments_count || 0}</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: '북튜닝 독서 기록',
                text: post.quote || post.content,
                url: window.location.href,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('링크가 복사되었습니다!');
            }
          }}
          className="touch-target p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
          title="공유하기"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 6. 댓글 영역 (펼침/접힘) */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-dashed border-neutral-200">
          {/* 댓글 작성 폼 (화면 밖 삐져나감 방지 w-full min-w-0) */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="따뜻한 한 줄 댓글을 남겨보세요..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-900"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="touch-target px-3 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 transition-all flex items-center gap-1 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">등록</span>
            </button>
          </form>
        </div>
      )}

    </article>
  );
}
