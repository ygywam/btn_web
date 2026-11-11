'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  saveUserNickname,
  extractErrorMessage,
} from '@/lib/auth';
import type { Profile } from '@/types/database';

export type AuthMode = 'LOGIN' | 'SIGNUP' | 'NICKNAME';

interface AuthFormProps {
  defaultMode?: 'LOGIN' | 'SIGNUP';
  theme?: 'light' | 'dark';
  showNicknameOnSignup?: boolean;
  onSuccess: (profile: Profile) => void;
  renderSubmitButton?: (opts: {
    label: string;
    isLoading: boolean;
    disabled: boolean;
  }) => React.ReactNode;
}

/**
 * 첫 화면(다크 글래스)과 모달(라이트)에서 공용으로 사용하는 인증·계정 생성 폼
 */
export default function AuthForm({
  defaultMode = 'LOGIN',
  theme = 'light',
  showNicknameOnSignup = false,
  onSuccess,
  renderSubmitButton,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const isDark = theme === 'dark';

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setInfoMessage('');
    try {
      setIsLoading(true);
      const profile = await signInWithGoogle();
      if (profile) onSuccess(profile);
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, '구글 로그인에 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (mode === 'SIGNUP' && password.length < 6) {
      setErrorMessage('비밀번호는 6자 이상으로 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result =
        mode === 'LOGIN'
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password, showNicknameOnSignup ? nickname : undefined);

      if (result.status === 'SUCCESS') {
        onSuccess(result.profile);
      } else if (result.status === 'CONFIRM_EMAIL') {
        setInfoMessage(result.message);
        setMode('LOGIN');
      } else {
        setMode('NICKNAME');
      }
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, '인증 과정에서 오류가 발생했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setErrorMessage('');
    setIsLoading(true);
    try {
      const profile = await saveUserNickname(nickname);
      onSuccess(profile);
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err, '닉네임 저장 실패'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = isDark
    ? 'w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-400/60 transition-all'
    : 'w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500';

  const submitLabel =
    mode === 'NICKNAME'
      ? '북튜닝 시작하기'
      : mode === 'SIGNUP'
      ? '계정 만들고 시작하기'
      : '로그인하여 내 서재 열기';

  const defaultButton = (label: string, disabled: boolean) => (
    <button
      type="submit"
      disabled={disabled}
      className="touch-target w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
    </button>
  );

  return (
    <div className="space-y-4">
      {mode !== 'NICKNAME' && (
        <div
          className={
            isDark
              ? 'grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-white/10'
              : 'grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-100'
          }
        >
          <button
            type="button"
            onClick={() => {
              setMode('SIGNUP');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'SIGNUP'
                ? isDark
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'bg-white text-neutral-900 shadow-xs'
                : isDark
                ? 'text-neutral-300 hover:text-white'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            새 계정 만들기
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'LOGIN'
                ? isDark
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'bg-white text-neutral-900 shadow-xs'
                : isDark
                ? 'text-neutral-300 hover:text-white'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            로그인
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          className={
            isDark
              ? 'p-2.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs'
              : 'p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs'
          }
        >
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div
          className={
            isDark
              ? 'p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs'
              : 'p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs'
          }
        >
          {infoMessage}
        </div>
      )}

      {mode === 'NICKNAME' ? (
        <form onSubmit={handleSaveNickname} className="flex flex-col gap-3">
          <p className={isDark ? 'text-xs text-neutral-300' : 'text-xs text-neutral-600'}>
            공개 피드와 댓글에 표시할 닉네임(2~10자)을 입력해 주세요.
          </p>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="닉네임 (2~10자)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              required
              className={inputClass}
            />
          </div>
          {renderSubmitButton
            ? renderSubmitButton({
                label: submitLabel,
                isLoading,
                disabled: isLoading || !nickname.trim(),
              })
            : defaultButton(submitLabel, isLoading || !nickname.trim())}
        </form>
      ) : (
        <div className="flex flex-col gap-3.5">
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-2.5">
            {mode === 'SIGNUP' && showNicknameOnSignup && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="닉네임 (2~10자)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={10}
                  required
                  className={inputClass}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                placeholder={mode === 'SIGNUP' ? '비밀번호 (6자 이상)' : '비밀번호'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'SIGNUP' ? 6 : undefined}
                className={inputClass}
              />
            </div>

            {renderSubmitButton
              ? renderSubmitButton({
                  label: submitLabel,
                  isLoading,
                  disabled: isLoading,
                })
              : defaultButton(submitLabel, isLoading)}
          </form>

          <div className="flex items-center gap-2 text-xs">
            <span className={isDark ? 'flex-1 h-px bg-white/10' : 'flex-1 h-px bg-neutral-200'} />
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-400'}>또는</span>
            <span className={isDark ? 'flex-1 h-px bg-white/10' : 'flex-1 h-px bg-neutral-200'} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={
              isDark
                ? 'touch-target w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all'
                : 'touch-target w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-xs transition-all'
            }
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
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
        </div>
      )}
    </div>
  );
}
