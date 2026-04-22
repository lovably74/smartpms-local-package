import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[] | null | undefined
): MessageContent[] => {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  // null/undefined 방어
  if (part === null || part === undefined) {
    return { type: "text", text: "" };
  }

  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  // assistant 가 tool_calls 를 포함한 경우 content 가 null 일 수 있음
  if ((message as any).tool_calls) {
    return {
      role,
      name,
      content: message.content ?? null,
      tool_calls: (message as any).tool_calls,
    };
  }

  const parts = ensureArray(message.content);
  // 빈 content 처리
  if (parts.length === 0) {
    return { role, name, content: "" };
  }
  const contentParts = parts.map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  if (ENV.geminiApiKey) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
  return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey && !ENV.geminiApiKey) {
    throw new Error("Neither OPENAI_API_KEY nor GEMINI_API_KEY is configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = 8192;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${ENV.geminiApiKey || ENV.forgeApiKey}`,
  };

  // 재시도 로직: 503/429 일시적 오류 시 재시도, retryDelay 파싱
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    payload.model = model;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(resolveApiUrl(), {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return (await response.json()) as InvokeResult;
        }

        const errorText = await response.text();

        if (response.status === 429) {
          // 할당량 초과: retryDelay 파싱
          const retryMatch = errorText.match(/retryDelay.*?(\d+)s/);
          const waitSec = retryMatch ? Math.min(parseInt(retryMatch[1], 10), 30) : 5 * (attempt + 1);

          // 일일 할당량 완전 소진 (limit: 0) → 즉시 다음 모델로
          if (errorText.includes('"limit": 0') || errorText.includes('PerDayPerProject')) {
            console.warn(`LLM ${model} daily quota exhausted, trying next model...`);
            lastError = new Error(`QUOTA_EXHAUSTED:${model}`);
            break; // 이 모델은 더 재시도해도 의미 없음
          }

          console.warn(`LLM ${model} attempt ${attempt + 1} rate limited, waiting ${waitSec}s...`);
          lastError = new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }

        if (response.status === 503) {
          console.warn(`LLM ${model} attempt ${attempt + 1} unavailable, retrying...`);
          lastError = new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        // 그 외 오류는 즉시 throw
        throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("LLM invoke failed:") && !err.message.includes("503") && !err.message.includes("429")) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        if (lastError.message.startsWith("QUOTA_EXHAUSTED:")) break;
      }
    }
    console.warn(`Model ${model} exhausted retries, trying next model...`);
  }

  // 할당량 소진 시 사용자 친화적 에러
  if (lastError?.message.startsWith("QUOTA_EXHAUSTED:")) {
    throw new Error("Gemini API 일일 사용 할당량이 초과되었습니다. 잠시 후 다시 시도하거나, Google AI Studio에서 결제를 활성화해 주세요.");
  }

  throw lastError || new Error("All LLM models failed");
}
