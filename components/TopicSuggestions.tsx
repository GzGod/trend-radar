"use client";

import { useRef, useState } from "react";
import type { TrendData } from "@/lib/scraper";
import type { TrendingCoin } from "@/lib/coingecko";
import type { CommunityPost } from "@/lib/community";

interface TopicSuggestionsProps {
  xTrends: TrendData | null;
  coinTrending: TrendingCoin[];
  community: { crypto: CommunityPost[]; ai: CommunityPost[] };
  onTopicSelect: (topic: string) => void;
  dataLoading: boolean;
}

export default function TopicSuggestions({ xTrends, coinTrending, community, onTopicSelect, dataLoading }: TopicSuggestionsProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [rawText, setRawText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const hasData = (xTrends?.tweets?.length ?? 0) > 0 || coinTrending.length > 0 || community.crypto.length > 0 || community.ai.length > 0;

  // Parse numbered list from streamed text
  function parseTopics(text: string): string[] {
    return text
      .split("\n")
      .map(line => line.replace(/^\d+\.\s*/, "").trim())
      .filter(line => line.length > 3 && line.length < 60);
  }

  const handleGenerate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTopics([]);
    setRawText("");
    setIsDone(false);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xTrends, coinTrending, community }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setIsGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setRawText(accumulated);
              setTopics(parseTopics(accumulated));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error("Suggest error:", e);
      }
    } finally {
      setIsGenerating(false);
      setIsDone(true);
    }
  };

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: topics.length > 0 || isGenerating ? "14px" : "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#00ff88", textTransform: "uppercase" }}>
            ◈ 今日选题
          </span>
          {isDone && topics.length > 0 && (
            <span style={{ fontSize: "10px", color: "#334155" }}>{topics.length} 个选题</span>
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

      {/* Topics grid */}
      {(topics.length > 0 || isGenerating) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "8px",
          }}
        >
          {topics.map((topic, i) => (
            <button
              key={i}
              onClick={() => onTopicSelect(topic)}
              style={{
                padding: "10px 14px",
                background: "#0a1628",
                border: "1px solid #1a2d4a",
                borderRadius: "6px",
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: "1.4",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,255,136,0.35)";
                e.currentTarget.style.color = "#e2e8f0";
                e.currentTarget.style.background = "#0d1e38";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1a2d4a";
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.background = "#0a1628";
              }}
            >
              <span style={{ color: "#334155", fontSize: "10px", flexShrink: 0, paddingTop: "2px", fontFamily: "monospace" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{topic}</span>
            </button>
          ))}
          {isGenerating && topics.length === 0 && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "44px", borderRadius: "6px" }} />
            ))
          )}
        </div>
      )}

      {!isGenerating && !isDone && (
        <p style={{ fontSize: "12px", color: "#334155", margin: 0 }}>
          基于当前热点数据，AI 为你推荐今天最值得写的选题，点击选题直接生成推文草稿。
        </p>
      )}
    </div>
  );
}
