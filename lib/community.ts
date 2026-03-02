// lib/community.ts
// Replaces Reddit (blocked on Vercel) with:
// - CryptoCompare news API (crypto) — free, no auth
// - HN Algolia search API (AI) — free, no auth

export interface CommunityPost {
  id: string;
  title: string;
  url: string;
  score: number;
  source: string;
  category: "crypto" | "ai";
}

async function fetchCryptoNews(limit = 8): Promise<CommunityPost[]> {
  const res = await fetch(
    `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular&limit=${limit}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`CryptoCompare ${res.status}`);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.Data ?? []).slice(0, limit).map((item: any) => ({
    id: String(item.id),
    title: item.title,
    url: item.url,
    score: item.upvotes ?? 0,
    source: item.source_info?.name ?? item.source ?? "CryptoCompare",
    category: "crypto" as const,
  }));
}

async function fetchHNAI(limit = 8): Promise<CommunityPost[]> {
  const query = encodeURIComponent("AI LLM machine learning agent");
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?tags=story&query=${query}&hitsPerPage=${limit}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`HN Algolia ${res.status}`);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.hits ?? []).slice(0, limit).map((item: any) => ({
    id: item.objectID,
    title: item.title,
    url: item.url ?? `https://news.ycombinator.com/item?id=${item.objectID}`,
    score: item.points ?? 0,
    source: "Hacker News",
    category: "ai" as const,
  }));
}

export async function fetchCommunityHot(): Promise<{ crypto: CommunityPost[]; ai: CommunityPost[] }> {
  const [crypto, ai] = await Promise.allSettled([
    fetchCryptoNews(),
    fetchHNAI(),
  ]);
  return {
    crypto: crypto.status === "fulfilled" ? crypto.value : [],
    ai: ai.status === "fulfilled" ? ai.value : [],
  };
}
