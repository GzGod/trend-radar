"use client";

import type { RedditPost } from "@/lib/reddit";

interface RedditSectionProps {
  reddit: { crypto: RedditPost[]; ai: RedditPost[] };
  loading: boolean;
  onTopicClick: (topic: string) => void;
}

function SkeletonPost() {
  return (
    <div style={{ display: "flex", gap: "8px", padding: "8px 12px", alignItems: "flex-start" }}>
      <div className="skeleton" style={{ width: "32px", height: "14px", flexShrink: 0, marginTop: "1px" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div className="skeleton" style={{ width: "100%", height: "11px" }} />
        <div className="skeleton" style={{ width: "70%", height: "11px" }} />
      </div>
    </div>
  );
}

function SubredditBlock({
  label,
  posts,
  loading,
  onTopicClick,
  accent,
}: {
  label: string;
  posts: RedditPost[];
  loading: boolean;
  onTopicClick: (topic: string) => void;
  accent: string;
}) {
  return (
    <div>
      <div
        style={{
          padding: "8px 12px 6px",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: accent,
          borderBottom: "1px solid #1a2d4a",
          fontFamily: "monospace",
        }}
      >
        r/{label}
      </div>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ borderBottom: i < 3 ? "1px solid #1a2d4a" : "none" }}>
            <SkeletonPost />
          </div>
        ))
      ) : posts.length === 0 ? (
        <div style={{ color: "#334155", fontSize: "10px", padding: "12px", textAlign: "center" }}>
          — 暂无数据 —
        </div>
      ) : (
        posts.slice(0, 5).map((post, i) => (
          <button
            key={post.id}
            onClick={() => onTopicClick(`${post.title} (Reddit r/${post.subreddit})`)}
            className="card-reddit"
            style={{
              display: "flex",
              gap: "8px",
              padding: "8px 12px",
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: i < Math.min(posts.length, 5) - 1 ? "1px solid #1a2d4a" : "none",
              cursor: "pointer",
              textAlign: "left",
              alignItems: "flex-start",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0d1e38")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Score */}
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: accent,
                fontFamily: "monospace",
                flexShrink: 0,
                minWidth: "32px",
                textAlign: "right",
                paddingTop: "1px",
              }}
            >
              ▲{post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
            </span>

            {/* Title */}
            <span
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                lineHeight: "1.4",
                flex: 1,
              }}
            >
              {post.title}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export default function RedditSection({ reddit, loading, onTopicClick }: RedditSectionProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#a855f7",
            textTransform: "uppercase",
          }}
        >
          ◈ Reddit 热帖
        </span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #a855f730, transparent)" }} />
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-dim)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <SubredditBlock
          label="CryptoCurrency"
          posts={reddit.crypto}
          loading={loading}
          onTopicClick={onTopicClick}
          accent="#00d4ff"
        />
        <div style={{ borderTop: "1px solid #1e3a5f" }} />
        <SubredditBlock
          label="artificial"
          posts={reddit.ai}
          loading={loading}
          onTopicClick={onTopicClick}
          accent="#a855f7"
        />
      </div>
    </section>
  );
}
