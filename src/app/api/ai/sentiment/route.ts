import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, quote, userNotes } = await request.json();

    if (!title && !quote && !userNotes) {
      return NextResponse.json({ error: '감상문을 작성할 내용이 부족합니다.' }, { status: 400 });
    }

    const apiKey = process.env.EXAONE_API_KEY;

    // 엑사원(EXAONE) API 키가 설정되어 있는 경우 실제 호출
    if (apiKey && apiKey !== 'your_exaone_api_key') {
      try {
        const response = await fetch('https://api.exaone.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'exaone-3.5-7.8b-instruct',
            messages: [
              {
                role: 'system',
                content:
                  '당신은 지적이고 따뜻한 문학 평론가이자 독서 코치입니다. 사용자가 수집한 문장과 독서 메모를 바탕으로 삶에 깊은 울림을 주는 독서 감상문 초안과 3줄 핵심 요약을 작성해 주세요.',
              },
              {
                role: 'user',
                content: `도서: 《${title || '미상의 책'}》\n수집한 문장: "${quote || '없음'}"\n사용자의 단상: ${userNotes || '없음'}\n\n위 내용을 바탕으로 삶의 통찰을 담은 정성스러운 독서 감상문을 작성해 주세요.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const generatedText = result.choices?.[0]?.message?.content;
          if (generatedText) {
            return NextResponse.json({ content: generatedText });
          }
        }
      } catch (err) {
        console.warn('엑사원 API 호출 오류(폴백 적용):', err);
      }
    }

    // API 키가 아직 설정되지 않았거나 호출 실패 시의 품격 있는 기본 감상문 생성 폴백
    const fallbackReview = `《${title || '이 책'}》을 읽으며 마주한 문장은 단순한 활자를 넘어 우리의 내면에 깊은 파동을 일으킵니다.\n\n"${quote || '기억하고 싶은 한 줄'}"\n\n이 문장은 빠르게 흘러가는 일상 속에서 우리가 잠시 잊고 지냈던 내면의 주파수를 다시 맞추게 합니다. 저자가 건네는 사유의 실타래를 따라가다 보면, 책을 읽는다는 것은 타인의 생각을 빌려 나 자신의 삶을 더 깊이 이해하고 사랑하는 여정임을 깨닫게 됩니다.\n\n오늘 남긴 이 짧은 기록이 훗날 당신의 삶을 지탱하는 단단한 나침반이 되어줄 것입니다.`;

    return NextResponse.json({ content: fallbackReview });
  } catch (error: any) {
    console.error('AI 감상문 생성 실패:', error);
    return NextResponse.json({ error: 'AI 감상문 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
