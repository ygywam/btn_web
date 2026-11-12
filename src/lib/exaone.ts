import { NextResponse } from 'next/server';

const DEFAULT_EXAONE_BASE_URL = 'https://api.exaone.ai/v1';
const DEFAULT_EXAONE_MODEL = 'k-exaone_v2.5';

// 플레이스홀더 예시 문자열이 실제 API 키로 오인되는 것을 방지하기 위한 목록
const PLACEHOLDER_KEY_MARKERS = [
  'your_exaone_api_key',
  'your_api_key',
  'placeholder',
  'example',
  'changeme',
];

export interface ExaoneMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ExaoneChatOptions {
  messages: ExaoneMessage[];
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export interface ExaoneChatResult {
  content: string;
  model: string;
}

/**
 * EXAONE API 연동 중 발생한 상태 코드와 사용자 안내 메시지를 담는 예외 클래스
 */
export class ExaoneApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ExaoneApiError';
    this.status = status;
  }
}

/**
 * 환경 변수 EXAONE_API_KEY가 비어 있거나 예시 문구가 아닌 유효한 형태인지 검증
 */
export function getValidatedExaoneApiKey(): string | null {
  const rawKey = process.env.EXAONE_API_KEY?.trim();
  if (!rawKey || rawKey.length < 12) return null;

  const lower = rawKey.toLowerCase();
  if (PLACEHOLDER_KEY_MARKERS.some((marker) => lower.includes(marker))) {
    return null;
  }
  return rawKey;
}

function getExaoneBaseUrl(): string {
  const custom = process.env.EXAONE_BASE_URL?.trim();
  return (custom || DEFAULT_EXAONE_BASE_URL).replace(/\/+$/, '');
}

function stripInlineThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * EXAONE 응답 오류 메시지 추출 (키 등 민감 정보 제외)
 */
function parseErrorDetail(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    const msg = parsed?.error?.message || parsed?.message || parsed?.detail;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim().slice(0, 200);
    }
  } catch {
    // JSON이 아니면 일반 문자열 처리
  }
  return rawBody.trim().slice(0, 200);
}

/**
 * 지정된 모델이 거부될 경우 /v1/models 목록을 조회해 활성 EXAONE 모델을 찾는다.
 */
async function resolveAvailableExaoneModel(
  baseUrl: string,
  apiKey: string,
  excludedModel: string
): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const payload = await res.json();
    const models: Array<{ id?: string }> = Array.isArray(payload?.data) ? payload.data : [];
    const candidateIds = models
      .map((item) => item?.id?.trim())
      .filter((id): id is string => Boolean(id) && id !== excludedModel);

    if (candidateIds.length === 0) return null;
    const preferred = candidateIds.find((id) => id.toLowerCase().includes('exaone'));
    return preferred || candidateIds[0];
  } catch {
    return null;
  }
}

interface RawCompletionAttemptResult {
  ok: boolean;
  status: number;
  rawText: string;
  content: string;
  finishReason?: string;
}

async function requestExaoneCompletion(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ExaoneMessage[];
  temperature: number;
  maxTokens: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
}): Promise<RawCompletionAttemptResult> {
  const bodyPayload: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
  };

  if (params.reasoningEffort) {
    bodyPayload.reasoning_effort = params.reasoningEffort;
  }

  const response = await fetch(`${params.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(25000),
  });

  const rawText = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      rawText,
      content: '',
    };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new ExaoneApiError(502, 'EXAONE API가 올바른 JSON 응답을 반환하지 않았습니다.');
  }

  const choices = Array.isArray(data.choices) ? data.choices : [];
  const firstChoice = (choices[0] ?? {}) as {
    message?: { content?: string | null };
    finish_reason?: string;
  };
  const rawContent = firstChoice?.message?.content ?? '';
  const cleaned = typeof rawContent === 'string' ? stripInlineThinkingTags(rawContent) : '';

  return {
    ok: true,
    status: response.status,
    rawText,
    content: cleaned,
    finishReason: firstChoice?.finish_reason,
  };
}

/**
 * EXAONE Chat Completions API 호출 공통 함수
 * - k-exaone_v2.5의 추론 토큰(reasoning_effort)과 토큰 부족 현상을 방어한다.
 */
export async function callExaoneChat(options: ExaoneChatOptions): Promise<ExaoneChatResult> {
  const apiKey = getValidatedExaoneApiKey();
  if (!apiKey) {
    throw new ExaoneApiError(
      503,
      'EXAONE_API_KEY가 설정되지 않았습니다. Vercel 환경 변수 설정을 확인해 주세요.'
    );
  }

  const baseUrl = getExaoneBaseUrl();
  let model = process.env.EXAONE_MODEL?.trim() || DEFAULT_EXAONE_MODEL;
  const temperature = options.temperature ?? 0.7;
  let maxTokens = options.maxTokens ?? 2500;
  let reasoningEffort: 'low' | 'medium' | 'high' | undefined = options.reasoningEffort ?? 'low';

  let attempt = await requestExaoneCompletion({
    baseUrl,
    apiKey,
    model,
    messages: options.messages,
    temperature,
    maxTokens,
    reasoningEffort,
  });

  // reasoning_effort 파라미터를 지원하지 않는 모델/프록시인 경우 제거 후 1회 재시도
  if (!attempt.ok && attempt.status === 400 && attempt.rawText.toLowerCase().includes('reasoning_effort')) {
    reasoningEffort = undefined;
    attempt = await requestExaoneCompletion({
      baseUrl,
      apiKey,
      model,
      messages: options.messages,
      temperature,
      maxTokens,
      reasoningEffort,
    });
  }

  // 지정 모델 ID가 존재하지 않을 경우 /v1/models 목록으로 활성 모델을 찾아 1회 재시도
  if (
    !attempt.ok &&
    (attempt.status === 404 ||
      (attempt.status === 400 && attempt.rawText.toLowerCase().includes('model')))
  ) {
    const discoveredModel = await resolveAvailableExaoneModel(baseUrl, apiKey, model);
    if (discoveredModel) {
      model = discoveredModel;
      attempt = await requestExaoneCompletion({
        baseUrl,
        apiKey,
        model,
        messages: options.messages,
        temperature,
        maxTokens,
        reasoningEffort,
      });
    }
  }

  if (!attempt.ok) {
    const detail = parseErrorDetail(attempt.rawText);
    if (attempt.status === 401 || attempt.status === 403) {
      throw new ExaoneApiError(
        502,
        'EXAONE API 키 인증에 실패했습니다. Vercel에 등록된 EXAONE_API_KEY 값을 확인해 주세요.'
      );
    }
    if (attempt.status === 429) {
      throw new ExaoneApiError(
        429,
        'EXAONE API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.'
      );
    }
    throw new ExaoneApiError(
      502,
      `EXAONE API 호출에 실패했습니다 (HTTP ${attempt.status}${detail ? `: ${detail}` : ''}).`
    );
  }

  // 추론 토큰에서 max_tokens가 소진되어 본문이 비었을 경우 한도를 키워 1회 재시도
  if (!attempt.content && attempt.finishReason === 'length') {
    maxTokens = Math.max(maxTokens + 1500, 4096);
    attempt = await requestExaoneCompletion({
      baseUrl,
      apiKey,
      model,
      messages: options.messages,
      temperature,
      maxTokens,
      reasoningEffort,
    });
  }

  if (!attempt.ok || !attempt.content) {
    throw new ExaoneApiError(
      502,
      'EXAONE AI가 본문 응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    );
  }

  return { content: attempt.content, model };
}

/**
 * 마크다운 코드블록(```json) 등이 섞인 AI 응답에서 순수 JSON 객체를 추출·파싱
 */
export function extractJsonFromExaoneText<T>(rawText: string): T {
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonSlice =
    firstBrace !== -1 && lastBrace > firstBrace
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;

  try {
    return JSON.parse(jsonSlice) as T;
  } catch {
    throw new ExaoneApiError(
      502,
      'EXAONE AI 응답 형식을 해석하지 못했습니다. 다시 시도해 주세요.'
    );
  }
}

/**
 * API 라우트 catch 블록에서 일관된 HTTP 오류 응답 반환
 */
export function toExaoneErrorResponse(err: unknown) {
  if (err instanceof ExaoneApiError) {
    console.error(`[EXAONE API ${err.status}]`, err.message);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted')) {
    console.error('[EXAONE API Timeout]', message);
    return NextResponse.json(
      { error: 'EXAONE AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 504 }
    );
  }

  console.error('[EXAONE API Unexpected Error]', message);
  return NextResponse.json(
    { error: 'EXAONE AI 서버와 통신하는 중 오류가 발생했습니다.' },
    { status: 502 }
  );
}
