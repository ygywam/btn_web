import { NextResponse } from 'next/server';
import { callExaoneChat, toExaoneErrorResponse } from '@/lib/exaone';

export const maxDuration = 30;

interface BookPostInput {
  post_type?: string;
  quote?: string | null;
  content?: string | null;
  page_number?: number | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const book = body?.book;
    const posts: BookPostInput[] = Array.isArray(body?.posts) ? body.posts : [];

    if (!book || typeof book.title !== 'string' || !book.title.trim()) {
      return NextResponse.json({ error: '도서 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    // 과도한 토큰 사용을 막기 위해 최근 기록 최대 25건을 정리해 전달
    const recentPosts = posts.slice(0, 25);
    const quotesList = recentPosts
      .filter((p) => p.post_type === 'QUOTE' && p.quote)
      .map((p) => `- "${String(p.quote).trim()}" (${p.page_number ? `${p.page_number}p` : '쪽수 미기재'})`)
      .join('\n');

    const notesList = recentPosts
      .filter((p) => p.content && String(p.content).trim())
      .map((p) => `- ${String(p.content).trim()} (${p.page_number ? `${p.page_number}p` : '단상'})`)
      .join('\n');

    const promptText = `
[도서 정보]
- 제목: ${book.title}
- 저자: ${book.authors || '미상'}
- 진도: ${book.current_page || 0} / ${book.total_pages || '미정'} 페이지

[수집한 문장들]
${quotesList || '아직 수집된 문장이 없습니다.'}

[독서 메모 및 단상]
${notesList || '아직 작성된 메모가 없습니다.'}

위 기록들을 바탕으로 한 편의 완성된 종합 독서감상문을 작성해 주세요.
- 서론: 이 책을 선택한 맥락과 작품이 남긴 첫인상
- 본론: 수집한 문장과 메모에 담긴 핵심 통찰과 질문 엮어내기
- 결론: 독서 이후 나의 시선 변화와 삶의 연결점
- 인사말 없이 감상문 본문만 정제된 한국어(공백 포함 700자 내외)로 작성해 주세요.
`.trim();

    const { content, model } = await callExaoneChat({
      messages: [
        {
          role: 'system',
          content:
            '당신은 깊이 있는 한국어 독서 에세이스트이자 서평가입니다. 사용자가 남긴 인용구와 사색 메모를 서론·본론·결론의 짜임새 있는 종합 독서감상문으로 정리해 주세요. 기록에 없는 인용구를 지어내지 마세요.',
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

    return NextResponse.json({ content, model });
  } catch (err) {
    return toExaoneErrorResponse(err);
  }
}
