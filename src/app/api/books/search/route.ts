import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  // 카카오 API 키가 설정되어 있는 경우 실제 카카오 검색 호출
  if (apiKey && apiKey !== 'your_kakao_rest_api_key') {
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=15`,
        {
          headers: {
            Authorization: `KakaoAK ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`카카오 API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('카카오 도서 검색 실패:', err);
      return NextResponse.json({ error: '도서 검색 중 오류가 발생했습니다.' }, { status: 500 });
    }
  }

  // API 키가 아직 설정되지 않은 로컬 테스트 환경을 위한 목업 데이터 스마트 폴백
  const mockBooks = [
    {
      title: `${query}와 삶의 주파수`,
      authors: ['김북튜너'],
      publisher: '튜닝출판사',
      thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80',
      total_pages: 280,
    },
    {
      title: `의미 있는 독서법: ${query}`,
      authors: ['이독서', '박사유'],
      publisher: '생각정원',
      thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
      total_pages: 320,
    },
    {
      title: `하루 10분 문장 수집 (${query} 편)`,
      authors: ['최문장'],
      publisher: '문장과서재',
      thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80',
      total_pages: 240,
    },
  ];

  return NextResponse.json({
    documents: mockBooks,
    meta: { is_end: true, pageable_count: 3, total_count: 3 },
  });
}
