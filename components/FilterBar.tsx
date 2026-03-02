"use client";

type Filter = "all" | "crypto" | "ai";

interface FilterBarProps {
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  onRefresh: () => void;
  loading: boolean;
  updatedAt: string | null;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  return `${Math.floor(diff / 3600)}小时前`;
}

const TABS: { key: Filter; label: string; color: string; activeClass: string }[] = [
  { key: "all", label: "全部", color: "#00d4ff", activeClass: "tab-active-cyan" },
  { key: "crypto", label: "Crypto", color: "#00ff88", activeClass: "tab-active-cyan" },
  { key: "ai", label: "AI", color: "#a855f7", activeClass: "tab-active-purple" },
];

export default function FilterBar({ filter, onFilterChange, onRefresh, loading, updatedAt }: FilterBarProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(5, 11, 24, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1a2d4a",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontSize: "16px" }}>📡</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.1em",
            color: "#00d4ff",
            textShadow: "0 0 12px rgba(0, 212, 255, 0.5)",
            textTransform: "uppercase",
          }}
        >
          Trend Radar
        </span>
        {/* Live indicator */}
        <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px" }}>
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "#00ff88",
              animation: "radar-pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              position: "relative",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#00ff88",
            }}
          />
        </span>
      </div>

      {/* Filter tabs */}
      <nav style={{ display: "flex", gap: "4px" }}>
        {TABS.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              style={{
                padding: "5px 16px",
                borderRadius: "20px",
                border: `1px solid ${isActive ? tab.color : "#1a2d4a"}`,
                background: isActive ? `${tab.color}18` : "transparent",
                color: isActive ? tab.color : "#64748b",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 400,
                letterSpacing: "0.05em",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: isActive ? `0 0 10px ${tab.color}30` : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right: refresh + timestamp */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {updatedAt && (
          <span style={{ fontSize: "11px", color: "#334155", letterSpacing: "0.05em" }}>
            {timeAgo(updatedAt)}更新
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="刷新"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            border: "1px solid #1a2d4a",
            background: "transparent",
            color: loading ? "#334155" : "#00d4ff",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            transition: "all 0.15s",
          }}
        >
          <span className={loading ? "spin" : ""} style={{ display: "inline-block" }}>⟳</span>
        </button>
      </div>
    </header>
  );
}
