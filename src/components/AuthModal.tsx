'use client';

import React from 'react';
import { X } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import type { Profile } from '@/types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
}

/**
 * 상단 내비게이션에서 계정 전환이나 재인증 시 여는 모달
 */
export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <h3 className="font-bold text-base sm:text-lg text-neutral-900">
            북튜닝 계정 연결
          </h3>
          <button
            onClick={onClose}
            className="touch-target p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AuthForm
          defaultMode="LOGIN"
          theme="light"
          showNicknameOnSignup={true}
          onSuccess={(profile) => {
            onSuccess(profile);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
