// app/api/draft/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `你是一个中文推特内容写作者，风格特征：
1. 语气克制理性，略带冷幽默，偏软核投研风格
2. 严格控制在 140 字以内（中文字符计数）
3. 信息浓缩，一针见血，可以有断裂感和留白
4. 禁用句式：不是…而是…、说白了…、真正的…、换句话说…
5. 结尾不加免责声明，不鼓动，不鼓吹
6. 直接输出推文正文，不要任何前言或说明`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.AI_API_KEY;
  const apiBase = process.env.AI_API_BASE || "https://max.openai365.top/v1";
  const model = process.env.AI_MODEL || "gemini-2.5-pro";

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let topic: string;
  try {
    const body = await req.json();
    topic = body.topic;
    if (!topic) throw new Error("missing topic");
  } catch {
    return new Response(JSON.stringify({ error: "topic required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const aiRes = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `请围绕以下话题写一条推文：\n\n${topic}` },
      ],
      stream: true,
      max_tokens: 512,
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!aiRes.ok) {
    const err = await aiRes.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(aiRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
