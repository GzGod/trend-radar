"use client";

import type { CommunityPost } from "@/lib/community";

interface CommunitySectionProps {
  community: { crypto: CommunityPost[]; ai: CommunityPost[] };
  loading: boolean;
  onTopicClick: (topic: string) => void;
}

function SkeletonPost() {
  return (
    <div style={{ display: "flex", gap: "8px", padding: "10px 14px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div className="skeleton" style={{ width: "100%", height: "13px" }} />
        <div className="skeleton" style={{ width: "60%", height: "13px" }} />
      </div>
      <div className="skeleton" style={{ width: "40px", height: "11px", flexShrink: 0 }} />
    </div>
  );
}

function PostBlock({
  label,
  posts,
  loading,
  onTopicClick,
  accent,
  icon,
}: {
  label: string;
  posts: CommunityPost[];
  loading: boolean;
  onTopicClick: (topic: string) => void;
  accent: string;
  icon: string;
}) {
  return (
    <div>
      <div
        style={{
          padding: "10px 14px 8px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: accent,
          borderBottom: "1px solid #1a2d4a",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ borderBottom: i < 3 ? "1px solid #1a2d4a" : "none" }}>
            <SkeletonPost />
          </div>
        ))
      ) : posts.length === 0 ? (
        <div style={{ color: "#334155", fontSize: "11px", padding: "14px", textAlign: "center" }}>
          — 暂无数据 —
        </div>
      ) : (
        posts.slice(0, 6).map((post, i) => (
          <button
            key={post.id}
            onClick={() => onTopicClick(post.title)}
            className="card-reddit"
            style={{
              display: "flex",
              gap: "10px",
              padding: "10px 14px",
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: i < Math.min(posts.length, 6) - 1 ? "1px solid #1a2d4a" : "none",
              cursor: "pointer",
              textAlign: "left",
              alignItems: "flex-start",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0d1e38")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* Title */}
            <span style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.4", flex: 1 }}>
              {post.title}
            </span>
            {/* Source */}
            <span
              style={{
                fontSize: "9px",
                color: "#334155",
                flexShrink: 0,
                paddingTop: "2px",
                maxWidth: "60px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {post.source}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export default function CommunitySection({ community, loading, onTopicClick }: CommunitySectionProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#a855f7", textTransform: "uppercase" }}>
          ◈ 社区热议
        </span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #a855f730, transparent)" }} />
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-dim)", borderRadius: "8px", overflow: "hidden" }}>
        <PostBlock
          label="Crypto 新闻"
          posts={community.crypto}
          loading={loading}
          onTopicClick={onTopicClick}
          accent="#00d4ff"
          icon="📰"
        />
        <div style={{ borderTop: "1px solid #1e3a5f" }} />
        <PostBlock
          label="Hacker News · AI"
          posts={community.ai}
          loading={loading}
          onTopicClick={onTopicClick}
          accent="#a855f7"
          icon="🤖"
        />
      </div>
    </section>
  );
}
