"use client";

import { useState } from "react";
import type { TrendData } from "@/lib/scraper";
import type { TrendingCoin } from "@/lib/coingecko";
import type { CommunityPost } from "@/lib/community";

interface TopicItem {
  title: string;
  angle: string;
  relatedArticles: string[];
}

interface SuggestResult {
  crypto: TopicItem[];
  ai: TopicItem[];
}

interface TopicSuggestionsProps {
  xTrends: TrendData | null;
  coinTrending: TrendingCoin[];
  community: { crypto: CommunityPost[]; ai: CommunityPost[] };
  onTopicSelect: (topic: string) => void;
  dataLoading: boolean;
}

function TrackColumn({
  label,
  accent,
  icon,
  topics,
  onTopicSelect,
}: {
  label: string;
  accent: string;
  icon: string;
  topics: TopicItem[];
  onTopicSelect: (topic: string) => void;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Track header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: `1px solid ${accent}30`,
        }}
      >
        <span style={{ fontSize: "13px" }}>{icon}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: accent, textTransform: "uppercase" }}>
          {label}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {topics.map((topic, i) => (
          <TopicCard key={i} topic={topic} accent={accent} index={i} onTopicSelect={onTopicSelect} />
        ))}
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  accent,
  index,
  onTopicSelect,
}: {
  topic: TopicItem;
  accent: string;
  index: number;
  onTopicSelect: (topic: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "#0a1628",
        border: "1px solid #1a2d4a",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = `${accent}40`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1a2d4a")}
    >
      {/* Topic title row */}
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: accent,
            fontFamily: "monospace",
            flexShrink: 0,
            paddingTop: "2px",
            opacity: 0.7,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.4", fontWeight: 500 }}>
            {topic.title}
          </div>
          {topic.angle && (
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", lineHeight: "1.4" }}>
              {topic.angle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {/* Draft button */}
          <button
            onClick={() => onTopicSelect(topic.title)}
            style={{
              fontSize: "10px",
              padding: "3px 8px",
              border: "1px solid #1a2d4a",
              color: "#64748b",
              borderRadius: "4px",
              background: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = accent;
              e.currentTarget.style.borderColor = `${accent}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#1a2d4a";
            }}
          >
            ✍ 草稿
          </button>
          {/* Expand button */}
          {topic.relatedArticles?.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                fontSize: "10px",
                padding: "3px 6px",
                border: "1px solid #1a2d4a",
                color: "#64748b",
                borderRadius: "4px",
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.borderColor = "#334155";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.borderColor = "#1a2d4a";
              }}
            >
              {expanded ? "▲" : "▼"} {topic.relatedArticles.length}
            </button>
          )}
        </div>
      </div>

      {/* Related articles */}
      {expanded && topic.relatedArticles?.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #1a2d4a",
            padding: "8px 12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.08em", marginBottom: "4px", textTransform: "uppercase" }}>
            参考资料
          </div>
          {topic.relatedArticles.map((article, j) => (
            <div
              key={j}
              style={{
                fontSize: "11px",
                color: "#475569",
                lineHeight: "1.4",
                paddingLeft: "8px",
                borderLeft: `2px solid ${accent}30`,
              }}
            >
              {article}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopicSuggestions({
  xTrends,
  coinTrending,
  community,
  onTopicSelect,
  dataLoading,
}: TopicSuggestionsProps) {
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData =
    (xTrends?.tweets?.length ?? 0) > 0 ||
    coinTrending.length > 0 ||
    community.crypto.length > 0 ||
    community.ai.length > 0;

  const handleGenerate = async () => {
    setResult(null);
    setError(null);
    setIsDone(false);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xTrends, coinTrending, community }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(err.error ?? "生成失败");
        return;
      }

      const data: SuggestResult = await res.json();
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsGenerating(false);
      setIsDone(true);
    }
  };

  const totalTopics = (result?.crypto?.length ?? 0) + (result?.ai?.length ?? 0);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid #1a2d4a",
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: "4px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: result || isGenerating ? "16px" : "0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#00ff88", textTransform: "uppercase" }}>
            ◈ 今日选题
          </span>
          {isDone && totalTopics > 0 && (
            <span style={{ fontSize: "10px", color: "#334155" }}>{totalTopics} 个选题</span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || dataLoading || !hasData}
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: `1px solid ${isGenerating ? "#1a2d4a" : "#00ff88"}`,
            background: isGenerating ? "transparent" : "rgba(0,255,136,0.08)",
            color: isGenerating || dataLoading || !hasData ? "#334155" : "#00ff88",
            fontSize: "12px",
            fontWeight: 600,
            cursor: isGenerating || dataLoading || !hasData ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s",
          }}
        >
          {isGenerating ? (
            <>
              <span className="spin" style={{ display: "inline-block" }}>⟳</span>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <span>✦</span>
              <span>{isDone ? "重新生成" : "生成选题"}</span>
            </>
          )}
        </button>
      </div>

      {/* Skeleton while loading */}
      {isGenerating && !result && (
        <div style={{ display: "flex", gap: "16px" }}>
          {[0, 1].map((col) => (
            <div key={col} style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: "16px", width: "80px", marginBottom: "12px", borderRadius: "4px" }} />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "64px", borderRadius: "8px", marginBottom: "8px" }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ fontSize: "12px", color: "#ef4444", padding: "8px 0" }}>
          ⚠ {error}
        </div>
      )}

      {/* Two-track layout */}
      {result && (
        <div style={{ display: "flex", gap: "16px" }} className="topic-tracks">
          {(result.crypto?.length ?? 0) > 0 && (
            <TrackColumn
              label="Crypto 赛道"
              accent="#00d4ff"
              icon="₿"
              topics={result.crypto}
              onTopicSelect={onTopicSelect}
            />
          )}
          {(result.ai?.length ?? 0) > 0 && (
            <TrackColumn
              label="AI 赛道"
              accent="#a855f7"
              icon="◎"
              topics={result.ai}
              onTopicSelect={onTopicSelect}
            />
          )}
        </div>
      )}

      {/* Empty state */}
      {!isGenerating && !isDone && (
        <p style={{ fontSize: "12px", color: "#334155", margin: 0 }}>
          基于当前热点数据，AI 为你推荐 Crypto 和 AI 赛道的今日选题，每个选题附带参考资料。
        </p>
      )}

      <style>{`
        @media (max-width: 700px) {
          .topic-tracks { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
