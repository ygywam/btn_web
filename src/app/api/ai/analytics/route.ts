import { NextResponse } from 'next/server';
import {
  callExaoneChat,
  extractJsonFromExaoneText,
  ExaoneApiError,
  toExaoneErrorResponse,
} from '@/lib/exaone';

export const maxDuration = 30;

interface AnalyticsBookInput {
  title?: string;
  authors?: string;
  status?: string;
}

interface AnalyticsPostInput {
  quote?: string | null;
  content?: string | null;
}

interface RecommendationItem {
  title: string;
  authors: string;
  reason: string;
  theme: string;
}

interface AnalyticsAiPayload {
  profileSummary: string;
  recommendations: RecommendationItem[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const books: AnalyticsBookInput[] = Array.isArray(body?.books) ? body.books : [];
    const posts: AnalyticsPostInput[] = Array.isArray(body?.posts) ? body.posts : [];

    if (books.length === 0) {
      return NextResponse.json(
        { error: '내 서재에 책을 1권 이상 담은 뒤 AI 독서 분석을 실행해 주세요.' },
        { status: 400 }
      );
    }

    const booksSummary = books
      .slice(0, 30)
      .map(
        (b) =>
          `- ${b.title || '제목 미상'} (${b.authors || '저자 미상'}, 상태: ${
            b.status === 'COMPLETED' ? '완독' : '독서 중'
          })`
      )
      .join('\n');

    const postsSummary = posts
      .slice(0, 20)
      .map((p) => {
        const parts: string[] = [];
        if (p.quote) parts.push(`문장: "${String(p.quote).slice(0, 120)}"`);
        if (p.content) parts.push(`메모: "${String(p.content).slice(0, 120)}"`);
        return parts.join(' / ');
      })
      .filter(Boolean)
      .join('\n');

    const promptText = `
[사용자 서재 도서 목록]
${booksSummary}

[최근 기록 및 수집 문장]
${postsSummary || '아직 수집된 문장이나 메모가 없습니다.'}

위 독서 데이터를 분석하여 다음 구조의 순수 JSON 객체만 출력하세요. 마크다운이나 부연 설명을 붙이지 마세요.
{
  "profileSummary": "독자의 독서 취향, 관심 주제, 사유의 결을 짚어주는 3문장 내외의 따뜻한 한국어 성향 요약",
  "recommendations": [
    {
      "title": "추천 도서 제목 1",
      "authors": "저자명",
      "reason": "서재 기록과 연결 지어 이 책을 추천하는 구체적 이유 1~2문장",
      "theme": "2~4단어 핵심 테마 (예: 인간과 관계)"
    },
    {
      "title": "추천 도서 제목 2",
      "authors": "저자명",
      "reason": "추천 이유 1~2문장",
      "theme": "핵심 테마"
    },
    {
      "title": "추천 도서 제목 3",
      "authors": "저자명",
      "reason": "추천 이유 1~2문장",
      "theme": "핵심 테마"
    }
  ]
}
`.trim();

    const { content, model } = await callExaoneChat({
      messages: [
        {
          role: 'system',
          content:
            '당신은 한국어 독서 데이터 분석가이자 서점 큐레이터입니다. 반드시 유효한 JSON 객체만 응답하세요. 실존하는 도서 제목과 저자명을 정확히 추천하세요.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      temperature: 0.7,
      maxTokens: 3200,
      reasoningEffort: 'low',
    });

    const parsed = extractJsonFromExaoneText<Partial<AnalyticsAiPayload>>(content);

    if (
      typeof parsed.profileSummary !== 'string' ||
      !parsed.profileSummary.trim() ||
      !Array.isArray(parsed.recommendations) ||
      parsed.recommendations.length === 0
    ) {
      throw new ExaoneApiError(
        502,
        'AI 독서 분석 결과 형식이 완전하지 않습니다. 다시 시도해 주세요.'
      );
    }

    const recommendations: RecommendationItem[] = parsed.recommendations
      .slice(0, 3)
      .map((item) => ({
        title: String(item?.title || '').trim() || '도서 정보 없음',
        authors: String(item?.authors || '').trim() || '저자 미상',
        reason: String(item?.reason || '').trim() || '독서 기록을 바탕으로 추천된 도서입니다.',
        theme: String(item?.theme || '').trim() || '추천 도서',
      }));

    return NextResponse.json({
      profileSummary: parsed.profileSummary.trim(),
      recommendations,
      model,
    });
  } catch (err) {
    return toExaoneErrorResponse(err);
  }
}
