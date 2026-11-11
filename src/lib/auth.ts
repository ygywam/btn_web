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
 * Supabase 오류 객체({ message, code, details }) 및 일반 Error에서 읽기 쉬운 메시지 추출
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (err && typeof err === 'object' && 'message' in err) {
    const e = err as { message?: unknown; code?: unknown };
    const msg = typeof e.message === 'string' ? e.message : '';
    const code = typeof e.code === 'string' ? e.code : '';
    if (msg) {
      return code ? `${msg} (${code})` : msg;
    }
  }
  return fallback;
}

/**
 * 이메일이나 빈 문자열이 자동 닉네임으로 노출되지 않도록 기본 별칭으로 정제
 */
function sanitizeFallbackNickname(raw?: string | null): string {
  const trimmed = (raw || '').trim();
  if (!trimmed || trimmed.includes('@')) return '독서가';
  return trimmed.slice(0, 10);
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
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Supabase 세션 확인 실패:', sessionError);
      return null;
    }

    if (!session?.user) {
      // Supabase가 연동된 환경에서는 유효한 세션이 없으면 로컬 캐시를 정리해 잘못된 비인증 상태를 방지
      clearProfileStorage();
      return null;
    }

    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (selectError) {
      console.error('프로필 조회 오류:', selectError);
    }

    if (existing) {
      saveProfileToStorage(existing as Profile);
      return existing as Profile;
    }

    // Google OAuth 최초 로그인 등으로 프로필 행이 아직 없으면 이메일 대신 안전한 기본 별칭 사용
    const fallbackName = sanitizeFallbackNickname(session.user.user_metadata?.full_name);
    const created: Profile = {
      id: session.user.id,
      nickname: fallbackName,
      avatar_url: session.user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: created.id,
        nickname: created.nickname,
        avatar_url: created.avatar_url,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('초기 프로필 생성 오류:', insertError);
    }

    const finalProfile = (inserted as Profile) || created;
    saveProfileToStorage(finalProfile);
    return finalProfile;
  } catch (err) {
    console.error('세션 복원 예외:', err);
    return null;
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
      nickname: '독서가',
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
      nickname: cleanNickname ? cleanNickname.slice(0, 10) : '독서가',
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
    const fallbackProfile: Profile = {
      id: data.user.id,
      nickname: cleanNickname.slice(0, 10),
      avatar_url: data.user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
    };
    const { data: savedRow, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: fallbackProfile.id,
          nickname: fallbackProfile.nickname,
          avatar_url: fallbackProfile.avatar_url,
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (profileError) {
      console.error('회원가입 프로필 저장 오류:', profileError);
    }

    const finalProfile = (savedRow as Profile) || fallbackProfile;
    saveProfileToStorage(finalProfile);
    return { status: 'SUCCESS', profile: finalProfile };
  }

  return { status: 'NEEDS_NICKNAME' };
}

/**
 * 닉네임 저장 및 프로필 확정 (Supabase 연동 시 update/insert 분리 처리로 RLS·충돌 방지)
 */
export async function saveUserNickname(nickname: string): Promise<Profile> {
  const cleanNickname = nickname.trim().slice(0, 10);
  const cached = loadProfileFromStorage();

  if (isSupabaseConfigured) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    let user = fetchedUser;

    if (!user) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      user = session?.user ?? null;
    }

    if (!user) {
      throw new Error('로그인 세션이 만료되었습니다. 로그아웃 후 다시 로그인해 주세요.');
    }

    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`프로필 조회 실패: ${extractErrorMessage(selectError, 'DB 확인 필요')}`);
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ nickname: cleanNickname })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`닉네임 수정 실패: ${extractErrorMessage(updateError, '권한 확인 필요')}`);
      }
      saveProfileToStorage(updated as Profile);
      return updated as Profile;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        nickname: cleanNickname,
        avatar_url: user.user_metadata?.avatar_url || cached?.avatar_url || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`프로필 생성 실패: ${extractErrorMessage(insertError, 'DB 확인 필요')}`);
    }
    saveProfileToStorage(inserted as Profile);
    return inserted as Profile;
  }

  const localProfile: Profile = {
    id: cached?.id || `guest-local-${Date.now()}`,
    nickname: cleanNickname,
    avatar_url: cached?.avatar_url || null,
    created_at: cached?.created_at || new Date().toISOString(),
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
