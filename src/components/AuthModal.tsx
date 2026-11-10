'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'NICKNAME'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // 1. 구글 소셜 로그인
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      // Supabase 미연동 시 테스트용 가상 로그인
      const guestProfile: Profile = {
        id: 'guest-user-01',
        nickname: '구글독서가',
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('booktuning_user_profile', JSON.stringify(guestProfile));
      onSuccess(guestProfile);
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || '구글 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 이메일 로그인 / 회원가입
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isSupabaseConfigured) {
      // Supabase 미연동 로컬 테스트
      const testProfile: Profile = {
        id: `user-${Date.now()}`,
        nickname: nickname || email.split('@')[0] || '책벌레',
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('booktuning_user_profile', JSON.stringify(testProfile));
      onSuccess(testProfile);
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'LOGIN') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // 프로필 조회
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            onSuccess(profile);
            onClose();
          } else {
            setMode('NICKNAME');
          }
        }
      } else {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (data.user) {
          setMode('NICKNAME');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || '인증 과정에서 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 닉네임 설정
  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const newProfile: Profile = {
            id: user.id,
            nickname: nickname.trim(),
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert(newProfile);
          onSuccess(newProfile);
        }
      } else {
        const localProfile: Profile = {
          id: 'guest-local-user',
          nickname: nickname.trim(),
          avatar_url: null,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('booktuning_user_profile', JSON.stringify(localProfile));
        onSuccess(localProfile);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '닉네임 저장 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white border border-[#E8E3D5] rounded-3xl shadow-2xl p-6 overflow-hidden">
        
        {/* 상단 닫기 */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <h3 className="font-bold text-base sm:text-lg text-neutral-900">
            {mode === 'NICKNAME'
              ? '닉네임 설정'
              : mode === 'LOGIN'
              ? '북튜닝 로그인'
              : '새 계정 만들기'}
          </h3>
          <button
            onClick={onClose}
            className="touch-target p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-3">
            {errorMessage}
          </div>
        )}

        {mode === 'NICKNAME' ? (
          /* 닉네임 설정 폼 */
          <form onSubmit={handleSaveNickname} className="flex flex-col gap-3">
            <p className="text-xs text-neutral-600">
              북튜닝에서 사용할 닉네임을 정해주세요. 공개 피드와 댓글에 표시됩니다.
            </p>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="활동할 닉네임 (2~10자)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={10}
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !nickname.trim()}
              className="touch-target w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '북튜닝 시작하기'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 구글 로그인 원클릭 버튼 */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="touch-target w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-xs transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google 계정으로 계속하기</span>
            </button>

            <div className="flex items-center gap-2 text-neutral-300 text-xs">
              <span className="flex-1 h-px bg-neutral-200" />
              <span>또는 이메일</span>
              <span className="flex-1 h-px bg-neutral-200" />
            </div>

            {/* 이메일 폼 */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-2.5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="touch-target w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 mt-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'LOGIN' ? (
                  '이메일로 로그인'
                ) : (
                  '계정 생성하기'
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                className="text-[11px] text-neutral-500 hover:text-amber-700 underline"
              >
                {mode === 'LOGIN'
                  ? '계정이 없으신가요? 회원가입'
                  : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
