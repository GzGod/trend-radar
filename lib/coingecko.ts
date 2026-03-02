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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.coins ?? []).slice(0, 10).map((item: any) => ({
    id: item.item.id,
    name: item.item.name,
    symbol: item.item.symbol,
    thumb: item.item.thumb,
    marketCapRank: item.item.market_cap_rank ?? null,
    priceChangePercent24h: item.item.data?.price_change_percentage_24h?.usd ?? null,
  }));
}
