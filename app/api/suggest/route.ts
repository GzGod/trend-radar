import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_PROMPT = `你是一位专业的中文推特内容策略师，擅长从热点数据中提炼高价值选题。`;

function buildPrompt(body: {
  xTrends: { tweets: Array<{ content: string; heatScore: number; rank: number }>; hotTags: Array<{ name: string; count: number }> } | null;
  coinTrending: Array<{ name: string; symbol: string; priceChangePercent24h: number | null }>;
  community: { crypto: Array<{ title: string; source: string }>; ai: Array<{ title: string; source: string }> };
}): string {
  const lines: string[] = [];

  if (body.xTrends?.tweets?.length) {
    lines.push("【X 热榜 TOP 10】");
    body.xTrends.tweets.slice(0, 10).forEach((t, i) => {
      lines.push(`${i + 1}. [热度${t.heatScore.toFixed(0)}] ${t.content}`);
    });
    if (body.xTrends.hotTags?.length) {
      lines.push(`热门话题标签：${body.xTrends.hotTags.slice(0, 6).map(t => `#${t.name}`).join(" ")}`);
    }
  }

  if (body.coinTrending?.length) {
    lines.push("\n【Crypto 热点币种】");
    body.coinTrending.slice(0, 8).forEach(c => {
      const pct = c.priceChangePercent24h !== null ? `${c.priceChangePercent24h >= 0 ? "+" : ""}${c.priceChangePercent24h.toFixed(1)}%` : "";
      lines.push(`- ${c.name} (${c.symbol}) ${pct}`);
    });
  }

  if (body.community?.crypto?.length) {
    lines.push("\n【Crypto 社区热议】");
    body.community.crypto.slice(0, 6).forEach(p => lines.push(`- ${p.title}`));
  }

  if (body.community?.ai?.length) {
    lines.push("\n【AI 社区热议】");
    body.community.ai.slice(0, 6).forEach(p => lines.push(`- ${p.title}`));
  }

  return `以下是当前热点数据：

${lines.join("\n")}

请从以上数据中提炼出 6~8 个最值得写的中文推特选题。

输出格式要求（严格遵守）：
- 只输出选题列表，不要任何前言、解释、总结
- 每行一个选题，格式：数字. 选题标题
- 选题标题控制在 20 字以内，简洁有力，有观点
- 不使用 emoji、markdown 标题、分隔线等任何装饰符号
- 不输出任何其他内容`;
}

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

  let body: Parameters<typeof buildPrompt>[0];
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = buildPrompt(body);

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
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(55000),
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
