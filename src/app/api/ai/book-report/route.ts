import { NextResponse } from 'next/server';

interface BookReportRequest {
  book: {
    id: string;
    title: string;
    authors: string;
    publisher: string;
    total_pages?: number;
    current_page?: number;
    status?: string;
  };
  posts: Array<{
    id: string;
    post_type: string;
    quote?: string;
    content: string;
    page_number?: number;
    created_at?: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const body: BookReportRequest = await req.json();
    const { book, posts = [] } = body;

    if (!book || !book.title) {
      return NextResponse.json({ error: '도서 정보가 누락되었습니다.' }, { status: 400 });
    }

    const quotes = posts.filter((p) => p.post_type === 'QUOTE' && Boolean(p.quote));
    const notes = posts.filter((p) => Boolean(p.content));
    const apiKey = process.env.EXAONE_API_KEY;

    let aiReportContent = '';

    // 실제 EXAONE AI 키가 있는 경우
    if (apiKey && apiKey.length > 10) {
      try {
        const prompt = `
당신은 통찰력 있는 인문학 서평가이자 독서 코치입니다.
사용자가 「${book.title}」(${book.authors} 저, ${book.publisher})을(를) 읽으며 기록한 모든 수집 문장과 메모를 종합하여, 감동적이고 깊이 있는 한 편의 '완성형 독서감상문'을 작성해 주세요.

[책 정보]:
- 제목: ${book.title}
- 저자: ${book.authors}
- 출판사: ${book.publisher}
- 독서 기록 개수: 문장 수집 ${quotes.length}건, 사색 메모 ${notes.length}건

[사용자가 수집한 책 속 문장들]:
${quotes.map((q, idx) => `${idx + 1}. [p.${q.page_number || '?'}] "${q.quote}"`).join('\n') || '(등록된 문장 없음)'}

[사용자가 남긴 생각과 메모들]:
${notes.map((n, idx) => `${idx + 1}. ${n.content}`).join('\n') || '(등록된 메모 없음)'}

[작성 가이드라인]:
1. [서론]: 책을 펼치게 된 계기와 책이 던지는 화두를 엽니다.
2. [본론]: 사용자가 직접 수집한 문장들과 그때 적은 생각을 자연스럽게 인용하며, 활자가 내면에 일으킨 파동과 깨달음을 깊이 있게 분석합니다.
3. [결론]: 이 책이 나의 일상과 가치관을 어떻게 새롭게 조율(북튜닝)해 주었는지, 앞으로 삶에 어떻게 적용할 것인지 실천적 다짐으로 마무리합니다.
4. 문체는 정중하면서도 따뜻하고 지적인 에세이 톤으로 작성해 주세요.
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
          aiReportContent = data.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('EXAONE 독서감상문 생성 오류:', err);
      }
    }

    // AI 호출이 실패했거나 키가 없을 때의 지능형 서평 생성 알고리즘
    if (!aiReportContent) {
      const topQuote = quotes[0]?.quote ? `"${quotes[0].quote}"` : '책 속을 거닐며 만난 문장들';
      const quoteMentions = quotes.length > 0
        ? quotes.map((q) => `• [${q.page_number ? `p.${q.page_number}` : '기록'}] "${q.quote}"\n  → ${q.content || '이 구절에 머물며 깊은 내면의 울림을 마주했습니다.'}`).join('\n\n')
        : '• 책 속 활자와 온전히 마주하며 나만의 호흡으로 페이지를 넘겼습니다.';

      aiReportContent = `[서론: 책을 펼치며 마주한 세계]
우리는 수많은 활자의 바다 속에서 때로는 길을 잃고, 때로는 나 자신을 되찾는 문장을 마주합니다. 헤르만 헤세가 이야기했듯, 책을 읽는다는 것은 타인의 생각을 빌리는 것이 아니라 내 안의 알을 깨고 나오는 여정입니다. ${book.authors}의 「${book.title}」은 바쁜 일상의 소음 속에서 흩어졌던 생각의 주파수를 다시 또렷하게 정돈해 주는 소중한 만남이었습니다.

[본론: 마음을 울린 문장들과 생각의 궤적]
이 책을 읽으며 가장 오랜 시간 마음에 닻을 내리게 만든 구절들과 그때의 사색을 돌아봅니다.

${quoteMentions}

단순히 줄거리를 따라가는 독서가 아니라, 저자가 던진 질문을 내 삶의 현실에 비추어보며 나만의 답을 찾아가는 시간이었습니다. 활자 사이의 여백 속에서 나 자신과 정직하게 대화할 수 있었습니다.

[결론: 의미 있는 독서로 내 삶을 튜닝하다]
독서는 마지막 책장을 덮는 순간 비로소 시작된다고 믿습니다. 「${book.title}」을 통해 건져 올린 문장들은 이제 활자로 머물지 않고, 매일 마주하는 선택과 관계 속에서 따뜻한 나침반이 되어줄 것입니다. 

오늘 기록한 이 생각들이 훗날 뒤돌아보았을 때 내 삶의 한 단계를 성숙하게 조율(Tuning)해 준 든든한 디딤돌로 기억되기를 소망합니다.`;
    }

    return NextResponse.json({
      content: aiReportContent,
      bookTitle: book.title,
      quotesCount: quotes.length,
      notesCount: notes.length,
    });
  } catch (err) {
    console.error('종합 독서감상문 처리 오류:', err);
    return NextResponse.json({ error: '감상문 생성 실패' }, { status: 500 });
  }
}
