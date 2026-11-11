import { supabase } from '@/lib/supabase';
import type { Book, BookStatus, Comment, Post, PostType, Profile } from '@/types/database';

export interface CreateBookInput {
  title: string;
  authors: string;
  publisher: string;
  thumbnail_url: string;
  total_pages: number;
  status: BookStatus;
}

export interface CreatePostInput {
  book_id: string | null;
  post_type: PostType;
  content: string;
  quote?: string;
  page_number?: number;
  is_public: boolean;
}

/**
 * 로그인한 사용자 본인의 서재 도서 목록을 Supabase에서 조회
 */
export async function fetchUserBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Book[];
}

/**
 * 새 도서를 Supabase books 테이블에 등록 (기본 비공개 원칙)
 */
export async function insertBook(userId: string, input: CreateBookInput): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: userId,
      title: input.title,
      authors: input.authors,
      publisher: input.publisher,
      thumbnail_url: input.thumbnail_url,
      total_pages: input.total_pages,
      current_page: 0,
      status: input.status,
      is_public: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Book;
}

/**
 * 도서의 현재 쪽수·전체 쪽수·독서 상태를 Supabase에 갱신
 */
export async function updateBookFields(
  bookId: string,
  userId: string,
  patch: Partial<Pick<Book, 'current_page' | 'total_pages' | 'status' | 'is_public'>>
): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .update(patch)
    .eq('id', bookId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Book;
}

/**
 * RLS 정책에 따라 조회 가능한 피드(본인 비공개 기록 + 전체 공개 피드)와 작성자·도서·좋아요·댓글 수 조합 조회
 */
export async function fetchVisiblePosts(userId: string, myBooks: Book[] = []): Promise<Post[]> {
  const { data: rawPosts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (postsError) throw postsError;
  if (!rawPosts || rawPosts.length === 0) return [];

  const postIds = rawPosts.map((p) => p.id as string);
  const authorIds = Array.from(new Set(rawPosts.map((p) => p.user_id as string)));
  const myBookMap = new Map<string, Book>(myBooks.map((b) => [b.id, b]));
  const missingBookIds = Array.from(
    new Set(
      rawPosts
        .map((p) => p.book_id as string | null)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .filter((id) => !myBookMap.has(id))
    )
  );

  // 외래키 조인 오류 없이 안전하게 병렬 조회
  const [profilesRes, booksRes, likesRes, commentsRes] = await Promise.all([
    authorIds.length > 0
      ? supabase.from('profiles').select('id, nickname, avatar_url, created_at').in('id', authorIds)
      : Promise.resolve({ data: [], error: null }),
    missingBookIds.length > 0
      ? supabase.from('books').select('*').in('id', missingBookIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
    supabase.from('comments').select('id, post_id').in('post_id', postIds),
  ]);

  const profileMap = new Map<string, Profile>(
    ((profilesRes.data || []) as Profile[]).map((pr) => [pr.id, pr])
  );
  const bookMap = new Map<string, Book>(myBookMap);
  ((booksRes.data || []) as Book[]).forEach((bk) => bookMap.set(bk.id, bk));

  const likesCountMap = new Map<string, number>();
  const likedByMeSet = new Set<string>();
  (likesRes.data || []).forEach((lk: { post_id: string; user_id: string }) => {
    likesCountMap.set(lk.post_id, (likesCountMap.get(lk.post_id) || 0) + 1);
    if (lk.user_id === userId) {
      likedByMeSet.add(lk.post_id);
    }
  });

  const commentsCountMap = new Map<string, number>();
  (commentsRes.data || []).forEach((cm: { id: string; post_id: string }) => {
    commentsCountMap.set(cm.post_id, (commentsCountMap.get(cm.post_id) || 0) + 1);
  });

  return rawPosts.map((row) => {
    const id = row.id as string;
    const bookId = (row.book_id as string | null) ?? null;
    return {
      id,
      user_id: row.user_id as string,
      book_id: bookId,
      post_type: row.post_type as PostType,
      content: (row.content as string) ?? '',
      quote: (row.quote as string | null) ?? undefined,
      page_number: (row.page_number as number | null) ?? undefined,
      is_public: Boolean(row.is_public),
      created_at: row.created_at as string,
      profiles: profileMap.get(row.user_id as string),
      books: bookId ? bookMap.get(bookId) : undefined,
      likes_count: likesCountMap.get(id) || 0,
      comments_count: commentsCountMap.get(id) || 0,
      user_has_liked: likedByMeSet.has(id),
    };
  });
}

/**
 * 새 독서 기록·문장 수집을 Supabase posts 테이블에 저장
 */
export async function insertPost(
  userId: string,
  input: CreatePostInput,
  books: Book[] = [],
  authorProfile?: Profile | null
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      book_id: input.book_id || null,
      post_type: input.post_type,
      content: input.content ?? '',
      quote: input.quote ?? null,
      page_number: typeof input.page_number === 'number' ? input.page_number : null,
      is_public: input.is_public,
    })
    .select()
    .single();

  if (error) throw error;
  const linkedBook = input.book_id ? books.find((b) => b.id === input.book_id) : undefined;
  return {
    id: data.id as string,
    user_id: data.user_id as string,
    book_id: (data.book_id as string | null) ?? null,
    post_type: data.post_type as PostType,
    content: (data.content as string) ?? '',
    quote: (data.quote as string | null) ?? undefined,
    page_number: (data.page_number as number | null) ?? undefined,
    is_public: Boolean(data.is_public),
    created_at: data.created_at as string,
    profiles: authorProfile || undefined,
    books: linkedBook,
    likes_count: 0,
    comments_count: 0,
    user_has_liked: false,
  };
}

/**
 * 피드 좋아요 토글 (likes 테이블 삽입/삭제)
 */
export async function togglePostLikeDb(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('likes')
    .insert({ post_id: postId, user_id: userId });

  // 중복 클릭으로 인한 unique 충돌은 정상 상태 유지
  if (error && error.code !== '23505') throw error;
}

/**
 * 특정 게시물의 댓글 목록과 작성자 프로필 조회
 */
export async function fetchPostComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const authorIds = Array.from(new Set(data.map((c) => c.user_id as string)));
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, created_at')
    .in('id', authorIds);

  const profileMap = new Map<string, Profile>(
    ((profilesData || []) as Profile[]).map((p) => [p.id, p])
  );

  return data.map((c) => ({
    id: c.id as string,
    post_id: c.post_id as string,
    user_id: c.user_id as string,
    content: c.content as string,
    created_at: c.created_at as string,
    profiles: profileMap.get(c.user_id as string),
  }));
}

/**
 * 댓글 등록
 */
export async function insertPostComment(
  postId: string,
  userId: string,
  content: string,
  authorProfile?: Profile | null
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    post_id: data.post_id as string,
    user_id: data.user_id as string,
    content: data.content as string,
    created_at: data.created_at as string,
    profiles: authorProfile || undefined,
  };
}

/**
 * 본인 댓글 삭제
 */
export async function deletePostComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) throw error;
}
