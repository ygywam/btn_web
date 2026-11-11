import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export const PROFILE_STORAGE_KEY = 'booktuning_user_profile';

export type AuthResult =
  | { status: 'SUCCESS'; profile: Profile }
  | { status: 'NEEDS_NICKNAME' }
  | { status: 'CONFIRM_EMAIL'; message: string };

/**
 * 브라우저 로컬 스토리지에 로그인 프로필을 저장해 재진입 시 로그인 상태를 유지
 */
export function saveProfileToStorage(profile: Profile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadProfileFromStorage(): Profile | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Profile;
  } catch {
    return null;
  }
}

export function clearProfileStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}

/**
 * Supabase 세션 또는 브라우저 저장 프로필을 복원
 */
export async function restoreSessionProfile(): Promise<Profile | null> {
  const cached = loadProfileFromStorage();
  if (!isSupabaseConfigured) return cached;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return cached;
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (existing) {
      saveProfileToStorage(existing as Profile);
      return existing as Profile;
    }

    // Google OAuth 최초 로그인 등으로 프로필 행이 아직 없으면 메타데이터 기반으로 생성
    const fallbackName =
      session.user.user_metadata?.full_name ||
      session.user.email?.split('@')[0] ||
      '독서가';
    const created: Profile = {
      id: session.user.id,
      nickname: String(fallbackName).slice(0, 10),
      avatar_url: session.user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
    };
    await supabase.from('profiles').upsert(created);
    saveProfileToStorage(created);
    return created;
  } catch {
    return cached;
  }
}

/**
 * Google OAuth 로그인 시작 (Supabase 미연동 환경에서는 로컬 테스트 프로필 즉시 생성)
 */
export async function signInWithGoogle(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const guestProfile: Profile = {
      id: 'guest-user-01',
      nickname: '구글독서가',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    saveProfileToStorage(guestProfile);
    return guestProfile;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
  return null;
}

/**
 * 이메일·비밀번호 로그인
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim();

  if (!isSupabaseConfigured) {
    const localProfile: Profile = {
      id: `user-${Date.now()}`,
      nickname: cleanEmail.split('@')[0] || '책벌레',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    saveProfileToStorage(localProfile);
    return { status: 'SUCCESS', profile: localProfile };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (error) throw error;

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile) {
      saveProfileToStorage(profile as Profile);
      return { status: 'SUCCESS', profile: profile as Profile };
    }
  }

  return { status: 'NEEDS_NICKNAME' };
}

/**
 * 신규 계정 생성 (이메일·비밀번호·선택적 초기 닉네임)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  nickname?: string
): Promise<AuthResult> {
  const cleanEmail = email.trim();
  const cleanNickname = (nickname || '').trim();

  if (!isSupabaseConfigured) {
    const localProfile: Profile = {
      id: `user-${Date.now()}`,
      nickname: cleanNickname || cleanEmail.split('@')[0] || '책벌레',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    saveProfileToStorage(localProfile);
    return { status: 'SUCCESS', profile: localProfile };
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
  });
  if (error) throw error;

  // 이메일 인증이 필수인 Supabase 설정인 경우
  if (data.user && !data.session) {
    return {
      status: 'CONFIRM_EMAIL',
      message:
        '인증 메일을 발송했습니다. 메일함에서 확인을 누른 뒤 로그인 탭으로 입장해 주세요.',
    };
  }

  if (data.user && cleanNickname) {
    const newProfile: Profile = {
      id: data.user.id,
      nickname: cleanNickname.slice(0, 10),
      avatar_url: data.user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
    };
    await supabase.from('profiles').upsert(newProfile);
    saveProfileToStorage(newProfile);
    return { status: 'SUCCESS', profile: newProfile };
  }

  return { status: 'NEEDS_NICKNAME' };
}

/**
 * 최초 닉네임 저장 및 프로필 확정
 */
export async function saveUserNickname(nickname: string): Promise<Profile> {
  const cleanNickname = nickname.trim().slice(0, 10);

  if (isSupabaseConfigured) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const newProfile: Profile = {
        id: user.id,
        nickname: cleanNickname,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
      };
      await supabase.from('profiles').upsert(newProfile);
      saveProfileToStorage(newProfile);
      return newProfile;
    }
  }

  const localProfile: Profile = {
    id: `guest-local-${Date.now()}`,
    nickname: cleanNickname,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };
  saveProfileToStorage(localProfile);
  return localProfile;
}

/**
 * 로그아웃 및 브라우저 세션 해제
 */
export async function signOutUser(): Promise<void> {
  clearProfileStorage();
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {
      // 오프라인 상태에서도 로컬 세션은 즉시 정리됨
    }
  }
}
