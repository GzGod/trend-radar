# Trend Radar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a crypto/AI hot topic aggregation dashboard at `e:/vibe/trend-radar/` that pulls from X/Twitter trends, CoinGecko, and Reddit, displays them in a polished dark-theme UI, and lets users click any topic to generate a tweet draft via AI.

**Architecture:** Next.js 14 App Router with a single `/api/topics` route that concurrently fetches three data sources (xhunt.ai via cheerio scraping, CoinGecko public REST API, Reddit public JSON API). A `/api/draft` route streams AI-generated tweet drafts via SSE. The frontend is a single-page dashboard with three sections and a slide-out draft panel.

**Tech Stack:** Next.js 16 + TypeScript, Tailwind CSS v4, cheerio, OpenAI-compatible API (Gemini/Claude), Vercel deployment.

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `e:/vibe/trend-radar/` (project root)

**Step 1: Initialize project**

```bash
cd e:/vibe
npx create-next-app@latest trend-radar --typescript --tailwind --app --no-src-dir --no-eslint --import-alias "@/*"
```

**Step 2: Install dependencies**

```bash
cd e:/vibe/trend-radar
npm install cheerio
```

**Step 3: Verify dev server starts**

Run `npm run dev` manually and confirm `http://localhost:3000` loads. Then stop it.

**Step 4: Create .env.local**

```bash
# e:/vibe/trend-radar/.env.local
AI_API_KEY=your_key_here
AI_API_BASE=https://max.openai365.top/v1
AI_MODEL=gemini-2.5-pro
```

**Step 5: Commit**

```bash
cd e:/vibe/trend-radar
git init
git add .
git commit -m "feat: scaffold Next.js project"
```

---

## Task 2: Data layer — xhunt.ai scraper

**Files:**
- Create: `lib/scraper.ts`

**Step 1: Copy and adapt scraper from xtrends**

The scraper logic is proven. Copy it verbatim from `e:/vibe/xtrends/src/lib/scraper.ts` into `lib/scraper.ts`. No changes needed — the `scrapeTrends(group, hours, tag)` function and `Tweet`/`TrendData` interfaces are reused as-is.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit**

```bash
git add lib/scraper.ts
git commit -m "feat: add xhunt.ai scraper (ported from xtrends)"
```

---

## Task 3: Data layer — CoinGecko client

**Files:**
- Create: `lib/coingecko.ts`

**Step 1: Write the client**

```typescript
// lib/coingecko.ts
export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number | null;
  priceChangePercent24h: number | null;
}

export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const res = await fetch("https://api.coingecko.com/api/v3/search/trending", {
    headers: { Accept: "application/json" },
    next: { revalidate: 1800 }, // cache 30 min
  });

  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

  const data = await res.json();
  return (data.coins ?? []).slice(0, 10).map((item: any) => ({
    id: item.item.id,
    name: item.item.name,
    symbol: item.item.symbol,
    thumb: item.item.thumb,
    marketCapRank: item.item.market_cap_rank ?? null,
    priceChangePercent24h: item.item.data?.price_change_percentage_24h?.usd ?? null,
  }));
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add lib/coingecko.ts
git commit -m "feat: add CoinGecko trending coins client"
```

---

## Task 4: Data layer — Reddit client

**Files:**
- Create: `lib/reddit.ts`

**Step 1: Write the client**

```typescript
// lib/reddit.ts
export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  numComments: number;
  subreddit: string;
}

async function fetchSubredditHot(subreddit: string, limit = 8): Promise<RedditPost[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
    {
      headers: {
        "User-Agent": "trend-radar/1.0 (content aggregator)",
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    }
  );

  if (!res.ok) throw new Error(`Reddit ${subreddit} ${res.status}`);

  const data = await res.json();
  return (data.data?.children ?? [])
    .filter((c: any) => !c.data.stickied)
    .map((c: any) => ({
      id: c.data.id,
      title: c.data.title,
      url: `https://reddit.com${c.data.permalink}`,
      score: c.data.score,
      numComments: c.data.num_comments,
      subreddit,
    }));
}

export async function fetchRedditHot(): Promise<{ crypto: RedditPost[]; ai: RedditPost[] }> {
  const [crypto, ai] = await Promise.allSettled([
    fetchSubredditHot("CryptoCurrency"),
    fetchSubredditHot("artificial"),
  ]);

  return {
    crypto: crypto.status === "fulfilled" ? crypto.value : [],
    ai: ai.status === "fulfilled" ? ai.value : [],
  };
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add lib/reddit.ts
git commit -m "feat: add Reddit hot posts client"
```

---

## Task 5: API route — /api/topics

**Files:**
- Create: `app/api/topics/route.ts`

**Step 1: Write the route**

```typescript
// app/api/topics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { scrapeTrends } from "@/lib/scraper";
import { fetchTrendingCoins } from "@/lib/coingecko";
import { fetchRedditHot } from "@/lib/reddit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filter = req.nextUrl.searchParams.get("filter") ?? "all";

  // Map filter to xhunt tag param
  const xhuntTag = filter === "all" ? undefined : filter; // "crypto" | "ai" | undefined

  const [trendsResult, coinsResult, redditResult] = await Promise.allSettled([
    scrapeTrends("cn", 4, xhuntTag),
    fetchTrendingCoins(),
    fetchRedditHot(),
  ]);

  return NextResponse.json({
    xTrends: trendsResult.status === "fulfilled" ? trendsResult.value : null,
    coinTrending: coinsResult.status === "fulfilled" ? coinsResult.value : [],
    reddit: redditResult.status === "fulfilled" ? redditResult.value : { crypto: [], ai: [] },
    updatedAt: new Date().toISOString(),
    errors: {
      xTrends: trendsResult.status === "rejected" ? trendsResult.reason?.message : null,
      coins: coinsResult.status === "rejected" ? coinsResult.reason?.message : null,
      reddit: redditResult.status === "rejected" ? redditResult.reason?.message : null,
    },
  });
}
```

**Step 2: Test the route manually**

Start dev server (`npm run dev`), then open `http://localhost:3000/api/topics` in browser.
Expected: JSON with `xTrends`, `coinTrending`, `reddit` keys.

**Step 3: Commit**

```bash
git add app/api/topics/route.ts
git commit -m "feat: add /api/topics aggregation route"
```

---

## Task 6: API route — /api/draft

**Files:**
- Create: `app/api/draft/route.ts`

**Step 1: Write the route**

```typescript
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
```

**Step 2: Commit**

```bash
git add app/api/draft/route.ts
git commit -m "feat: add /api/draft SSE streaming route"
```

---

## Task 7: UI — invoke frontend-design skill

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `components/Dashboard.tsx`
- Create: `components/TopicCard.tsx`
- Create: `components/XTrendsSection.tsx`
- Create: `components/CryptoSection.tsx`
- Create: `components/RedditSection.tsx`
- Create: `components/DraftPanel.tsx`
- Create: `components/FilterBar.tsx`

**Step 1: Invoke frontend-design skill**

Use the `frontend-design` skill with the following brief:

> Build a dark-theme crypto/AI hot topic dashboard called "Trend Radar".
>
> Layout:
> - Top bar: "Trend Radar" logo (left), filter tabs (全部 / Crypto / AI), refresh button + "Updated X min ago" timestamp (right)
> - Main grid: 3 columns on desktop, stacked on mobile
>   - Column 1: "X 热榜" — list of tweet cards (rank badge, author handle, content summary, heat score bar)
>   - Column 2: "Crypto 热点" — CoinGecko trending coins (coin icon, name, symbol, 24h % change in green/red)
>   - Column 3: "Reddit 热帖" — two sub-sections (r/CryptoCurrency and r/artificial), each showing 5 post titles with score
> - Right slide-out panel (triggered by clicking any card): shows selected topic title, streaming AI draft text, copy button
>
> Style: deep space dark (`#0a0f1e` background), neon accent colors (cyan `#00d4ff` for crypto, purple `#a855f7` for AI), card borders with subtle glow, monospace font for handles/symbols. Skeleton loading states for all sections.
>
> Components are React client components using `useState`/`useEffect`. Data is fetched from `/api/topics`. Draft is streamed from `/api/draft`.

**Step 2: Wire up data fetching in Dashboard.tsx**

The Dashboard component should:
1. On mount, call `fetch('/api/topics?filter=all')`
2. Store result in state: `{ xTrends, coinTrending, reddit, updatedAt }`
3. Pass data down to section components
4. Expose `onTopicClick(topic: string)` callback to open DraftPanel

**Step 3: Wire up DraftPanel streaming**

When a topic is clicked:
1. Set `selectedTopic` state
2. Open panel (slide in from right)
3. Call `fetch('/api/draft', { method: 'POST', body: JSON.stringify({ topic }) })`
4. Read SSE stream, accumulate text, update `draftText` state in real-time
5. Show copy button when stream ends

**Step 4: Commit**

```bash
git add app/ components/
git commit -m "feat: add dashboard UI with three-section layout and draft panel"
```

---

## Task 8: Vercel config and deployment

**Files:**
- Create: `vercel.json`

**Step 1: Add vercel.json**

```json
{
  "functions": {
    "app/api/topics/route.ts": { "maxDuration": 30 },
    "app/api/draft/route.ts": { "maxDuration": 60 }
  }
}
```

**Step 2: Add .env.local to .gitignore**

Verify `.gitignore` contains `.env.local` (Next.js default includes it).

**Step 3: Final build check**

```bash
npm run build
```
Expected: build succeeds with no errors.

**Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: add vercel config with function timeouts"
```

---

## Environment Variables Reference

```
AI_API_KEY=        # Required — AI API key
AI_API_BASE=https://max.openai365.top/v1
AI_MODEL=gemini-2.5-pro
```

Set these in Vercel dashboard under Project Settings → Environment Variables before deploying.
