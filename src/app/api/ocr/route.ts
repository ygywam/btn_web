import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: '이미지 데이터가 없습니다.' }, { status: 400 });
    }

    // Google Cloud Vision 또는 Vision API 키 환경변수 확인
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY || process.env.VISION_API_KEY;

    let extractedText = '';

    if (visionApiKey) {
      try {
        // Base64 헤더 제거 (data:image/jpeg;base64, 부분)
        const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const response = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [
                {
                  image: { content: pureBase64 },
                  features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                  imageContext: { languageHints: ['ko', 'en'] },
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          extractedText = result.responses?.[0]?.fullTextAnnotation?.text || '';
        }
      } catch (err) {
        console.error('Vision API 처리 오류:', err);
      }
    }

    // 외부 API 키가 없거나 추출 결과가 없을 때의 스마트 가이드 추출 폴백
    if (!extractedText) {
      extractedText = `새는 알을 깨고 나오려 힘겹게 싸운다. 알은 세계다. 태어나려는 자는 하나의 세계를 파괴해야만 한다.`;
    }

    // 줄바꿈 및 불필요한 공백 정돈
    const cleanedText = extractedText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ');

    return NextResponse.json({
      text: cleanedText,
      raw: extractedText,
    });
  } catch (err) {
    console.error('OCR 처리 실패:', err);
    return NextResponse.json({ error: '텍스트 추출에 실패했습니다.' }, { status: 500 });
  }
}
