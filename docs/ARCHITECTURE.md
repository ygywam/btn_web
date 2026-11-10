# 아키텍처 문서 (ARCHITECTURE)

## 1. 시스템 구조
```
[사용자 브라우저 (Next.js 14 App Router)]
       │
       ├─ Google OAuth (Supabase Auth)
       ├─ 도서 검색 API (Kakao / Aladin / NL)
       └─ Supabase Client (@supabase/ssr & supabase-js)
               │
               ▼
   [Supabase PostgreSQL DB]
   - profiles (사용자 프로필 & 닉네임)
   - books (도서 정보 & 개인 서재)
   - posts (날짜별 피드: 진도/문장수집, is_public 플래그)
   - likes (피드 공감)
```

## 2. 보안 정책 (RLS)
- `profiles`: 본인 프로필 수정 가능, 닉네임/아바타는 공개 조회 가능.
- `books`: 본인 도서는 본인만 조회/수정/삭제 가능 (`auth.uid() = user_id`). `is_public = true`인 도서만 타인 조회 허용.
- `posts`: 본인 포스트는 본인만 수정/삭제 가능. `is_public = true`인 포스트만 전체 피드에서 조회 허용.
- `likes`: 본인 계정으로 좋아요 등록 및 취소 가능.
