"use client";

import { useCallback, useEffect, useState } from "react";
import type { TrendData } from "@/lib/scraper";
import type { TrendingCoin } from "@/lib/coingecko";
import type { CommunityPost } from "@/lib/community";
import FilterBar from "./FilterBar";
import XTrendsSection from "./XTrendsSection";
import CryptoSection from "./CryptoSection";
import CommunitySection from "./CommunitySection";
import DraftPanel from "./DraftPanel";
import TopicSuggestions from "./TopicSuggestions";

type Filter = "all" | "crypto" | "ai";

interface TopicsData {
  xTrends: TrendData | null;
  coinTrending: TrendingCoin[];
  community: { crypto: CommunityPost[]; ai: CommunityPost[] };
  updatedAt: string;
  errors: { xTrends: string | null; coins: string | null; community: string | null };
}

export default function Dashboard() {
  const [data, setData] = useState<TopicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const fetchData = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/topics?filter=${f}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TopicsData = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to fetch topics:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filter);
  }, [filter, fetchData]);

  const tweets = data?.xTrends?.tweets ?? [];
  const coins = data?.coinTrending ?? [];
  const community = data?.community ?? { crypto: [], ai: [] };

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        onRefresh={() => fetchData(filter)}
        loading={loading}
        updatedAt={data?.updatedAt ?? null}
      />

      <div style={{ padding: "16px 24px 0", maxWidth: "1400px", margin: "0 auto" }}>
        <TopicSuggestions
          xTrends={data?.xTrends ?? null}
          coinTrending={data?.coinTrending ?? []}
          community={data?.community ?? { crypto: [], ai: [] }}
          onTopicSelect={setSelectedTopic}
          dataLoading={loading}
        />
      </div>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          padding: "20px 24px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
        className="dashboard-grid"
      >
        <XTrendsSection tweets={tweets} loading={loading} onTopicClick={setSelectedTopic} />
        <CryptoSection coins={coins} loading={loading} onTopicClick={setSelectedTopic} />
        <CommunitySection community={community} loading={loading} onTopicClick={setSelectedTopic} />
      </main>

      <DraftPanel topic={selectedTopic} onClose={() => setSelectedTopic(null)} />

      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 901px) and (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
