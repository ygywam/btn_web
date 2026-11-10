export type BookStatus = 'WISH' | 'READING' | 'COMPLETED' | 'HOLD';
export type PostType = 'PROGRESS' | 'QUOTE' | 'NOTE';

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  authors: string;
  publisher: string;
  thumbnail_url: string;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  is_public: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  book_id: string | null;
  post_type: PostType;
  content: string;
  quote?: string;
  page_number?: number;
  is_public: boolean;
  created_at: string;
  // 조인 필드
  profiles?: Profile;
  books?: Book;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface KakaoBookItem {
  title: string;
  contents: string;
  url: string;
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  sale_price: number;
  price: number;
  thumbnail: string;
  status: string;
}
