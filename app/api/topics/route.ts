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
      xTrends: trendsResult.status === "rejected" ? (trendsResult.reason as Error)?.message : null,
      coins: coinsResult.status === "rejected" ? (coinsResult.reason as Error)?.message : null,
      reddit: redditResult.status === "rejected" ? (redditResult.reason as Error)?.message : null,
    },
  });
}
