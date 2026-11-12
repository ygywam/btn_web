import { NextResponse } from 'next/server';
import { callExaoneChat, toExaoneErrorResponse } from '@/lib/exaone';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const quote = typeof body?.quote === 'string' ? body.quote.trim() : '';
    const userNotes = typeof body?.userNotes === 'string' ? body.userNotes.trim() : '';

    if (!title && !quote && !userNotes) {
      return NextResponse.json(
        { error: '책을 선택하거나 인상 깊은 문장 또는 메모를 먼저 입력해 주세요.' },
        { status: 400 }
      );
    }

    const { content, model } = await callExaoneChat({
      messages: [
        {
          role: 'system',
          content:
            '당신은 따뜻하고 통찰력 있는 독서 멘토입니다. 사용자가 기록한 책 제목, 수집한 문장, 개인 메모를 바탕으로 사색적인 한국어 독서감상 노트(3~5문장)를 자연스럽게 작성해 주세요. 과장된 수식어나 인사말은 생략하고 본문만 간결하게 작성하세요.',
        },
        {
          role: 'user',
          content: `도서: ${title || '미지정'}\n수집한 문장: "${quote || '없음'}"\n사용자 메모: ${userNotes || '없음'}\n\n이 기록을 바탕으로 깊이 있는 독서 노트를 작성해 주세요.`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2048,
      reasoningEffort: 'low',
    });

    return NextResponse.json({ content, model });
  } catch (err) {
    return toExaoneErrorResponse(err);
  }
}
