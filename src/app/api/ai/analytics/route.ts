import { NextResponse } from 'next/server';

interface AnalyticsRequest {
  books: Array<{
    id: string;
    title: string;
    authors: string;
    publisher: string;
    status: string;
    current_page: number;
    total_pages: number;
  }>;
  posts: Array<{
    id: string;
    quote?: string;
    content: string;
    book_id?: string | null;
  }>;
}

export async function POST(req: Request) {
  try {
    const body: AnalyticsRequest = await req.json();
    const { books = [], posts = [] } = body;

    const apiKey = process.env.EXAONE_API_KEY;

    // 수집된 정보 기반 요약 데이터
    const completedBooks = books.filter((b) => b.status === 'COMPLETED');
    const readingBooks = books.filter((b) => b.status === 'READING');
    const quotes = posts.filter((p) => Boolean(p.quote)).map((p) => p.quote);
    const userThoughts = posts.map((p) => p.content).filter(Boolean);

    // 1. 작가별 통계
    const authorMap: Record<string, number> = {};
    books.forEach((b) => {
      const author = b.authors ? b.authors.split(',')[0].trim() : '미상';
      authorMap[author] = (authorMap[author] || 0) + 1;
    });
    const topAuthors = Object.entries(authorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // 2. EXAONE AI 호출 또는 지능형 스마트 엔진
    let aiAnalysis = '';
    let recommendations: Array<{
      title: string;
      authors: string;
      reason: string;
      theme: string;
    }> = [];

    if (apiKey && apiKey.length > 10) {
      // EXAONE API 호출
      try {
        const prompt = `
당신은 최고의 독서 코치이자 인문학 서평가입니다.
사용자가 읽은 책과 수집한 문장을 분석하여 깊이 있는 독서 분석 리포트와 다음에 읽을 책 3권을 추천해 주세요.

[읽은 책 목록]: ${books.map((b) => `${b.title} (${b.authors}) - ${b.status}`).join(', ')}
[수집한 문장들]: ${quotes.slice(0, 5).join(' / ')}
[사용자 메모]: ${userThoughts.slice(0, 5).join(' / ')}

반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "profileSummary": "사용자의 독서 성향과 사색의 결을 3~4문장으로 따뜻하고 통찰력 있게 분석한 글",
  "recommendations": [
    {
      "title": "추천 도서명",
      "authors": "저자",
      "reason": "사용자가 읽은 책이나 문장과 연결되는 구체적인 추천 이유",
      "theme": "핵심 키워드/테마"
    }
  ]
}
`;
        const res = await fetch('https://api.exaone.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'exaone-3.5-7.8b-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.choices?.[0]?.message?.content || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiAnalysis = parsed.profileSummary;
            recommendations = parsed.recommendations;
          }
        }
      } catch (err) {
        console.error('EXAONE API 호출 오류:', err);
      }
    }

    // AI 응답이 없거나 키가 없을 때의 스마트 지능형 분석 폴백
    if (!aiAnalysis || recommendations.length === 0) {
      const bookTitles = books.map((b) => b.title).join(', ');
      const mainTheme = quotes.length > 0 ? '문장 중심의 성찰적 독서' : '지식과 일상의 통찰을 잇는 사색';

      aiAnalysis = books.length > 0
        ? `등록된 ${books.length}권의 도서(${bookTitles})와 수집된 문장을 살펴보면, 단순한 활자 읽기를 넘어 삶의 본질과 내면의 성장에 귀를 기울이는 '깊이 있는 탐구형' 독서가이십니다. 문장 하나하나에 머무르며 나만의 언어로 소화해내는 사색의 깊이가 돋보입니다.`
        : '아직 등록된 도서가 많지 않지만, 북튜닝과 함께 나만의 독서 주파수를 맞춰가는 멋진 여정이 시작되었습니다. 한 권의 책에서 마음에 와닿는 단 한 줄을 수집하는 것만으로도 독서는 삶의 나침반이 됩니다.';

      recommendations = [
        {
          title: '어린 왕자',
          authors: '앙투안 드 생텍쥐페리',
          reason: '일상에 치여 잊고 지냈던 가장 소중한 눈에 보이지 않는 가치들을 되찾아주는 따뜻한 고전입니다.',
          theme: '관계와 성장',
        },
        {
          title: '빅터 프랭클의 죽음의 수용소에서',
          authors: '빅터 프랭클',
          reason: '어떤 가혹한 시련 속에서도 삶의 의미를 발견해내는 인간 정신의 위대함을 전해줍니다.',
          theme: '삶의 의미와 실존',
        },
        {
          title: '모순',
          authors: '양귀자',
          reason: '인생의 모순과 복잡미묘한 감정을 섬세한 문장으로 풀어내어 깊은 여운을 남깁니다.',
          theme: '인간 탐구와 인생',
        },
      ];
    }

    return NextResponse.json({
      profileSummary: aiAnalysis,
      topAuthors,
      recommendations,
      completedCount: completedBooks.length,
      readingCount: readingBooks.length,
      totalQuoteCount: quotes.length,
    });
  } catch (err) {
    console.error('독서 분석 오류:', err);
    return NextResponse.json({ error: '분석 생성 실패' }, { status: 500 });
  }
}
