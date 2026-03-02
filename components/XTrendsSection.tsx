"use client";

import type { Tweet } from "@/lib/scraper";

interface XTrendsSectionProps {
  tweets: Tweet[];
  loading: boolean;
  onTopicClick: (topic: string) => void;
}

function HeatBar({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#00d4ff";
  return (
    <div style={{ height: "2px", background: "#1a2d4a", borderRadius: "1px", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(score, 100)}%`,
          background: color,
          borderRadius: "1px",
          boxShadow: `0 0 6px ${color}80`,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, { color: string; border: string }> = {
    1: { color: "#ffd700", border: "rgba(255,215,0,0.3)" },
    2: { color: "#c0c0c0", border: "rgba(192,192,192,0.3)" },
    3: { color: "#cd7f32", border: "rgba(205,127,50,0.3)" },
  };
  const style = colors[rank] ?? { color: "#334155", border: "rgba(51,65,85,0.3)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "20px",
        height: "20px",
        borderRadius: "4px",
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: "10px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {rank}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-dim)",
        borderRadius: "8px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div className="skeleton" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
        <div className="skeleton" style={{ width: "120px", height: "12px" }} />
      </div>
      <div className="skeleton" style={{ width: "100%", height: "12px" }} />
      <div className="skeleton" style={{ width: "80%", height: "12px" }} />
      <div className="skeleton" style={{ width: "100%", height: "2px" }} />
    </div>
  );
}

export default function XTrendsSection({ tweets, loading, onTopicClick }: XTrendsSectionProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#00d4ff",
            textTransform: "uppercase",
          }}
        >
          ◈ X 热榜
        </span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #00d4ff30, transparent)" }} />
        {!loading && (
          <span style={{ fontSize: "9px", color: "#334155" }}>{tweets.length} 条</span>
        )}
      </div>

      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
      ) : tweets.length === 0 ? (
        <div style={{ color: "#334155", fontSize: "11px", padding: "20px 0", textAlign: "center" }}>
          — 暂无数据 —
        </div>
      ) : (
        tweets.slice(0, 15).map((tweet) => (
          <button
            key={tweet.id}
            onClick={() => onTopicClick(tweet.content)}
            className="card-x"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-dim)",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            {/* Top row: rank + author */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <RankBadge rank={tweet.rank} />
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tweet.author}
              </span>
              <span style={{ fontSize: "10px", color: "#334155", fontFamily: "monospace" }}>
                @{tweet.handle}
              </span>
            </div>

            {/* Content */}
            <p style={{
              fontSize: "11px",
              color: "#94a3b8",
              lineHeight: "1.5",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {tweet.content}
            </p>

            {/* Heat bar */}
            <HeatBar score={tweet.heatScore} />

            {/* Stats */}
            <div style={{ display: "flex", gap: "12px" }}>
              {[
                { icon: "👁", val: tweet.views },
                { icon: "♥", val: tweet.likes },
                { icon: "↺", val: tweet.retweets },
              ].map(({ icon, val }) => (
                <span key={icon} style={{ fontSize: "9px", color: "#334155", display: "flex", alignItems: "center", gap: "3px" }}>
                  <span>{icon}</span>
                  <span style={{ fontFamily: "monospace" }}>{val}</span>
                </span>
              ))}
              <span style={{ marginLeft: "auto", fontSize: "9px", color: "#1e3a5f" }}>
                热度 {tweet.heatScore.toFixed(0)}
              </span>
            </div>
          </button>
        ))
      )}
    </section>
  );
}
