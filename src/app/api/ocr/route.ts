import { NextResponse } from 'next/server';

export const maxDuration = 30;

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_OCR_MODEL = 'gemini-2.5-flash';
const MAX_IMAGE_BYTES = 4_200_000;

const PLACEHOLDER_KEY_MARKERS = [
  'your_gemini_api_key',
  'your_api_key',
  'placeholder',
  'example',
  'changeme',
];

const OCR_PROMPT = [
  '첨부된 책 페이지 사진에서 보이는 본문 글자(한국어, 영어, 숫자, 문장부호)만 정확히 전사하세요.',
  '규칙:',
  '1. 사진에 실제로 적혀 있는 글자만 그대로 옮겨 적으세요. 보이지 않는 문장을 추측하거나 지어내지 마세요.',
  '2. 한 문장이 다음 줄로 어색하게 끊긴 경우 자연스럽게 이어 붙이고, 문단 구분만 줄바꿈으로 유지하세요.',
  '3. 페이지 번호, 장식 기호, 배경 잡음은 제외하고 책 본문 문장 위주로 정리하세요.',
  '4. 설명이나 인사말 없이 추출된 본문 텍스트만 출력하세요. 읽을 수 있는 글자가 전혀 없으면 [[NO_TEXT_FOUND]] 만 출력하세요.',
].join('\n');

function getValidatedGeminiApiKey(): string | null {
  const rawKey =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim();
  if (!rawKey || rawKey.length < 15) return null;

  const lower = rawKey.toLowerCase();
  if (PLACEHOLDER_KEY_MARKERS.some((marker) => lower.includes(marker))) {
    return null;
  }
  return rawKey;
}

function parseImagePayload(imageBase64: string): { mimeType: string; data: string } | null {
  const trimmed = imageBase64.trim();
  if (!trimmed) return null;

  const dataUrlMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1].toLowerCase(),
      data: dataUrlMatch[2].replace(/\s+/g, ''),
    };
  }

  return {
    mimeType: 'image/jpeg',
    data: trimmed.replace(/\s+/g, ''),
  };
}

function parseGeminiErrorDetail(rawText: string): string {
  try {
    const parsed = JSON.parse(rawText);
    const msg = parsed?.error?.message || parsed?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim().slice(0, 200);
    }
  } catch {
    // JSON이 아니면 일반 문자열 처리
  }
  return rawText.trim().slice(0, 200);
}

/**
 * 기본 모델명이 404일 때 사용 가능한 최신 Gemini Flash(generateContent) 모델을 찾는다.
 */
async function resolveFallbackFlashModel(
  apiKey: string,
  excludedModel: string
): Promise<string | null> {
  try {
    const res = await fetch(`${GEMINI_API_BASE}/models`, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const payload = await res.json();
    const models: Array<{ name?: string; supportedGenerationMethods?: string[] }> =
      Array.isArray(payload?.models) ? payload.models : [];

    const candidates = models
      .filter((m) => {
        const name = (m.name || '').replace(/^models\//, '').toLowerCase();
        const methods = Array.isArray(m.supportedGenerationMethods)
          ? m.supportedGenerationMethods
          : [];
        return (
          name &&
          name !== excludedModel.toLowerCase() &&
          name.includes('gemini') &&
          name.includes('flash') &&
          !name.includes('tts') &&
          !name.includes('image') &&
          !name.includes('audio') &&
          !name.includes('live') &&
          methods.includes('generateContent')
        );
      })
      .map((m) => (m.name || '').replace(/^models\//, ''));

    // 안정판(latest/2.5/3)을 preview/lite보다 우선 선택
    const stable = candidates.find(
      (name) => !name.includes('preview') && !name.includes('exp') && !name.includes('lite')
    );
    return stable || candidates[0] || null;
  } catch {
    return null;
  }
}

async function callGeminiOcr(params: {
  apiKey: string;
  model: string;
  mimeType: string;
  data: string;
}) {
  const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(params.model)}:generateContent`;

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': params.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: OCR_PROMPT },
            {
              inline_data: {
                mime_type: params.mimeType,
                data: params.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
    signal: AbortSignal.timeout(25000),
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = getValidatedGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            '사진 문자 인식(OCR)용 GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경 변수 설정을 확인해 주세요.',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : '';
    const parsedImage = parseImagePayload(imageBase64);

    if (!parsedImage || !parsedImage.data) {
      return NextResponse.json(
        { error: '인식할 책 사진 데이터가 전달되지 않았습니다.' },
        { status: 400 }
      );
    }

    const decodedBytes = Buffer.byteLength(parsedImage.data, 'base64');
    if (decodedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: '사진 용량이 너무 큽니다. 더 가까이 찍거나 해상도를 낮춰 다시 시도해 주세요.' },
        { status: 413 }
      );
    }

    let model = process.env.GEMINI_OCR_MODEL?.trim() || DEFAULT_GEMINI_OCR_MODEL;
    let response = await callGeminiOcr({
      apiKey,
      model,
      mimeType: parsedImage.mimeType,
      data: parsedImage.data,
    });

    if (response.status === 404) {
      const fallbackModel = await resolveFallbackFlashModel(apiKey, model);
      if (fallbackModel) {
        model = fallbackModel;
        response = await callGeminiOcr({
          apiKey,
          model,
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        });
      }
    }

    const rawText = await response.text();
    if (!response.ok) {
      const detail = parseGeminiErrorDetail(rawText);
      console.error(`[Gemini OCR ${response.status}]`, detail);

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'GEMINI_API_KEY 인증에 실패했습니다. Vercel 환경 변수의 키 값을 확인해 주세요.' },
          { status: 502 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Gemini OCR 무료/요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `사진 문자 인식(Gemini) 호출에 실패했습니다 (HTTP ${response.status}${detail ? `: ${detail}` : ''}).` },
        { status: 502 }
      );
    }

    const data = JSON.parse(rawText);
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
      return NextResponse.json(
        {
          error:
            '페이지 전체 인식이 정책상 제한되었습니다. 원하는 한두 문단만 가까이 촬영해 다시 시도해 주세요.',
        },
        { status: 422 }
      );
    }

    const parts: Array<{ text?: string }> = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
      : [];

    const extractedText = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();

    if (
      !extractedText ||
      extractedText === '[[NO_TEXT_FOUND]]' ||
      extractedText === 'NO_TEXT_FOUND'
    ) {
      return NextResponse.json(
        {
          error:
            '사진에서 읽을 수 있는 책 본문 글자를 찾지 못했습니다. 글자가 선명하게 보이도록 다시 촬영해 주세요.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: extractedText, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted')) {
      console.error('[Gemini OCR Timeout]', message);
      return NextResponse.json(
        { error: '사진 문자 인식 응답 시간이 초과되었습니다. 다시 시도해 주세요.' },
        { status: 504 }
      );
    }
    console.error('[Gemini OCR Unexpected Error]', message);
    return NextResponse.json(
      { error: '사진 문자 인식 처리 중 서버 오류가 발생했습니다.' },
      { status: 502 }
    );
  }
}
