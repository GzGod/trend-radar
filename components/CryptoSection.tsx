"use client";

import type { TrendingCoin } from "@/lib/coingecko";

interface CryptoSectionProps {
  coins: TrendingCoin[];
  loading: boolean;
  onTopicClick: (topic: string) => void;
}

function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px" }}>
      <div className="skeleton" style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div className="skeleton" style={{ width: "80px", height: "11px" }} />
        <div className="skeleton" style={{ width: "50px", height: "9px" }} />
      </div>
      <div className="skeleton" style={{ width: "50px", height: "11px" }} />
    </div>
  );
}

export default function CryptoSection({ coins, loading, onTopicClick }: CryptoSectionProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#00ff88",
            textTransform: "uppercase",
          }}
        >
          ◈ Crypto 热点
        </span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #00ff8830, transparent)" }} />
        {!loading && (
          <span style={{ fontSize: "9px", color: "#334155" }}>CoinGecko</span>
        )}
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-dim)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ borderBottom: i < 7 ? "1px solid #1a2d4a" : "none" }}>
              <SkeletonRow />
            </div>
          ))
        ) : coins.length === 0 ? (
          <div style={{ color: "#334155", fontSize: "11px", padding: "20px", textAlign: "center" }}>
            — 暂无数据 —
          </div>
        ) : (
          coins.map((coin, i) => {
            const pct = coin.priceChangePercent24h;
            const pctColor = pct === null ? "#334155" : pct >= 0 ? "#00ff88" : "#ef4444";
            const pctStr = pct === null ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

            return (
              <button
                key={coin.id}
                onClick={() => onTopicClick(`${coin.name} (${coin.symbol}) 加密货币热点`)}
                className="card-crypto"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: i < coins.length - 1 ? "1px solid #1a2d4a" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0d1e38")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Rank */}
                <span style={{ fontSize: "11px", color: "#334155", width: "14px", textAlign: "right", flexShrink: 0 }}>
                  {i + 1}
                </span>

                {/* Coin image */}
                {coin.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coin.thumb}
                    alt={coin.name}
                    width={24}
                    height={24}
                    style={{ borderRadius: "50%", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#1a2d4a", flexShrink: 0 }} />
                )}

                {/* Name + symbol */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {coin.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>
                    {coin.symbol}
                    {coin.marketCapRank && (
                      <span style={{ marginLeft: "6px", color: "#1e3a5f" }}>#{coin.marketCapRank}</span>
                    )}
                  </div>
                </div>

                {/* Price change */}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: pctColor,
                    fontFamily: "monospace",
                    flexShrink: 0,
                    textShadow: pct !== null && pct >= 0 ? "0 0 8px rgba(0,255,136,0.4)" : pct !== null ? "0 0 8px rgba(239,68,68,0.4)" : "none",
                  }}
                >
                  {pctStr}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
