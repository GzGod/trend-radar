// app/api/topics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { scrapeTrends } from "@/lib/scraper";
import { fetchTrendingCoins } from "@/lib/coingecko";
import { fetchCommunityHot } from "@/lib/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filter = req.nextUrl.searchParams.get("filter") ?? "all";
  const xhuntTag = filter === "all" ? undefined : filter;

  const [trendsResult, coinsResult, communityResult] = await Promise.allSettled([
    scrapeTrends("cn", 4, xhuntTag),
    fetchTrendingCoins(),
    fetchCommunityHot(),
  ]);

  return NextResponse.json({
    xTrends: trendsResult.status === "fulfilled" ? trendsResult.value : null,
    coinTrending: coinsResult.status === "fulfilled" ? coinsResult.value : [],
    community: communityResult.status === "fulfilled" ? communityResult.value : { crypto: [], ai: [] },
    updatedAt: new Date().toISOString(),
    errors: {
      xTrends: trendsResult.status === "rejected" ? (trendsResult.reason as Error)?.message : null,
      coins: coinsResult.status === "rejected" ? (coinsResult.reason as Error)?.message : null,
      community: communityResult.status === "rejected" ? (communityResult.reason as Error)?.message : null,
    },
  });
}
