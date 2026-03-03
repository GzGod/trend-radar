import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_PROMPT = `你是一位专业的中文推特内容策略师，擅长从热点数据中提炼高价值选题。你必须严格按照 JSON 格式输出，不输出任何其他内容。`;

interface SourceData {
  xTrends: { tweets: Array<{ content: string; heatScore: number }>; hotTags: Array<{ name: string }> } | null;
  coinTrending: Array<{ name: string; symbol: string; priceChangePercent24h: number | null }>;
  community: { crypto: Array<{ title: string; source: string; url: string }>; ai: Array<{ title: string; source: string; url: string }> };
}

function buildPrompt(body: SourceData): string {
  const lines: string[] = [];

  if (body.xTrends?.tweets?.length) {
    lines.push("【X 热榜】");
    body.xTrends.tweets.slice(0, 8).forEach((t, i) => {
      lines.push(`${i + 1}. [热度${t.heatScore.toFixed(0)}] ${t.content}`);
    });
    if (body.xTrends.hotTags?.length) {
      lines.push(`热门标签：${body.xTrends.hotTags.slice(0, 5).map(t => `#${t.name}`).join(" ")}`);
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
    lines.push("\n【Crypto 社区新闻】");
    body.community.crypto.slice(0, 6).forEach((p, i) => lines.push(`C${i + 1}. ${p.title}`));
  }

  if (body.community?.ai?.length) {
    lines.push("\n【AI 社区热议】");
    body.community.ai.slice(0, 6).forEach((p, i) => lines.push(`A${i + 1}. ${p.title}`));
  }

  return `以下是当前热点数据：

${lines.join("\n")}

请基于以上数据，分别为 Crypto 赛道和 AI 赛道各生成 3 个选题。

每个选题需要：
1. 一个简洁有力的中文标题（20字以内，有观点，不用emoji）
2. 一句话写作角度（30字以内，说明从什么视角切入）
3. 从上面数据中找出 2~3 条最相关的参考资料（直接引用原文标题）

严格按以下 JSON 格式输出，不输出任何其他内容：
{
  "crypto": [
    {
      "title": "选题标题",
      "angle": "写作角度",
      "relatedArticles": ["相关文章标题1", "相关文章标题2"]
    }
  ],
  "ai": [
    {
      "title": "选题标题",
      "angle": "写作角度",
      "relatedArticles": ["相关文章标题1", "相关文章标题2"]
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.AI_API_KEY;
  const apiBase = process.env.AI_API_BASE || "https://max.openai365.top/v1";
  const model = process.env.AI_MODEL || "gemini-2.5-pro";

  if (!apiKey) {
    return NextResponse.json({ error: "AI_API_KEY not configured" }, { status: 500 });
  }

  let body: SourceData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
      stream: false,
      max_tokens: 1500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!aiRes.ok) {
    const err = await aiRes.text();
    return NextResponse.json({ error: err }, { status: 502 });
  }

  const aiJson = await aiRes.json();
  const content: string = aiJson.choices?.[0]?.message?.content ?? "";

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "AI returned invalid format", raw: content }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI JSON", raw: content }, { status: 502 });
  }
}
