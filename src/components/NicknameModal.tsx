'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Check, Loader2 } from 'lucide-react';
import { saveUserNickname, extractErrorMessage } from '@/lib/auth';
import type { Profile } from '@/types/database';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Profile | null;
  onSaved: (updated: Profile) => void;
}

/**
 * 상단 내비게이션에서 닉네임을 확인하고 즉시 변경할 수 있는 모달
 */
export default function NicknameModal({
  isOpen,
  onClose,
  currentProfile,
  onSaved,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentProfile) {
      // 기존 값이 이메일 형태라면 새로 입력하기 쉽도록 비워 두고, 일반 닉네임은 미리 채움
      const raw = currentProfile.nickname || '';
      setNickname(raw.includes('@') ? '' : raw);
      setError('');
    }
  }, [isOpen, currentProfile]);

  if (!isOpen || !currentProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      setError('닉네임은 2자 이상 10자 이내로 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const updated = await saveUserNickname(trimmed);
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error('닉네임 변경 오류:', err);
      setError(
        extractErrorMessage(
          err,
          '닉네임 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <h3 className="font-bold text-base sm:text-lg text-neutral-900">
            닉네임 변경
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            상단 프로필과 공개 피드·댓글에 표시되는 활동 이름입니다.
          </p>

          {currentProfile.nickname.includes('@') && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
              현재 이메일 일부가 표시되고 있습니다. 원하는 닉네임을 입력해 변경해 주세요.
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="새 닉네임 (2~10자)"
              maxLength={10}
              autoFocus
              required
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="touch-target px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || nickname.trim().length < 2}
              className="touch-target px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl flex items-center gap-1.5 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
