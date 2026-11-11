-- ============================================================
-- 북튜닝 (Book Tuning) - Supabase 데이터베이스 스키마 및 RLS 보안 정책
-- ============================================================

-- 1. 프로필 테이블 (profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 개인 서재 도서 테이블 (books)
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  authors text not null default '',
  publisher text default '',
  thumbnail_url text default '',
  total_pages integer default 0,
  current_page integer default 0,
  status text check (status in ('WISH', 'READING', 'COMPLETED', 'HOLD')) default 'READING',
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 피드 기록 테이블 (posts: 진도, 문장수집, 단상)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id uuid references public.books on delete set null,
  post_type text check (post_type in ('PROGRESS', 'QUOTE', 'NOTE')) default 'NOTE',
  content text not null,
  quote text,
  page_number integer,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 피드 좋아요 테이블 (likes)
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (post_id, user_id)
);

-- 5. 피드 댓글 테이블 (comments)
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- RLS (Row Level Security: 행 단위 보안 정책) 설정
-- ============================================================

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- profiles 정책
create policy "공개 프로필 조회 허용" on public.profiles
  for select using (true);

create policy "본인 프로필 등록 허용" on public.profiles
  for insert with check (auth.uid() = id);

create policy "본인 프로필 수정 허용" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- books 정책
create policy "본인 도서 전체 조회 허용" on public.books
  for select using (auth.uid() = user_id or is_public = true);

create policy "본인 도서 추가 허용" on public.books
  for insert with check (auth.uid() = user_id);

create policy "본인 도서 수정 허용" on public.books
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "본인 도서 삭제 허용" on public.books
  for delete using (auth.uid() = user_id);

-- posts 정책
create policy "공개 피드 및 본인 피드 조회 허용" on public.posts
  for select using (is_public = true or auth.uid() = user_id);

create policy "본인 피드 작성 허용" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "본인 피드 수정 허용" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "본인 피드 삭제 허용" on public.posts
  for delete using (auth.uid() = user_id);

-- likes 정책
create policy "좋아요 목록 조회 허용" on public.likes
  for select using (true);

create policy "본인 좋아요 등록 허용" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "본인 좋아요 취소 허용" on public.likes
  for delete using (auth.uid() = user_id);

-- comments 정책
create policy "댓글 목록 조회 허용" on public.comments
  for select using (true);

create policy "본인 댓글 작성 허용" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "본인 댓글 삭제 허용" on public.comments
  for delete using (auth.uid() = user_id);
