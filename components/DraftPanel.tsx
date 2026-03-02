"use client";

import { useEffect, useRef, useState } from "react";

interface DraftPanelProps {
  topic: string | null;
  onClose: () => void;
}

export default function DraftPanel({ topic, onClose }: DraftPanelProps) {
  const [draftText, setDraftText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!topic) {
      setDraftText("");
      setIsDone(false);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setDraftText("");
    setIsDone(false);
    setIsStreaming(true);
    setCopied(false);

    (async () => {
      try {
        const res = await fetch("/api/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.text();
          setDraftText(`[错误] ${err}`);
          setIsDone(true);
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
                setDraftText((prev) => prev + delta);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setDraftText((prev) => prev + "\n[连接中断]");
        }
      } finally {
        setIsStreaming(false);
        setIsDone(true);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [topic]);

  const handleCopy = async () => {
    if (!draftText) return;
    await navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOpen = topic !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 11, 24, 0.5)",
            zIndex: 40,
          }}
        />
      )}

      {/* Panel */}
      <div
        className={`draft-panel${isOpen ? " open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "384px",
          maxWidth: "100vw",
          background: "#070e1f",
          borderLeft: "1px solid #1a2d4a",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1a2d4a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#00ff88",
              textTransform: "uppercase",
            }}
          >
            ✍ 推文草稿
          </span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #1a2d4a",
              borderRadius: "4px",
              color: "#64748b",
              cursor: "pointer",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e2e8f0";
              e.currentTarget.style.borderColor = "#334155";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#1a2d4a";
            }}
          >
            ✕
          </button>
        </div>

        {/* Topic */}
        {topic && (
          <div
            style={{
              margin: "16px 20px 0",
              padding: "10px 12px",
              background: "#0a1628",
              border: "1px solid #1a2d4a",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#64748b",
              lineHeight: "1.5",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#334155", marginRight: "6px" }}>话题</span>
            <span style={{ color: "#94a3b8" }}>{topic}</span>
          </div>
        )}

        {/* Draft content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          {isStreaming && !draftText && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontSize: "11px" }}>
              <span className="spin" style={{ display: "inline-block", fontSize: "14px", color: "#00ff88" }}>⟳</span>
              <span>生成中...</span>
            </div>
          )}

          {draftText && (
            <p
              className={isStreaming ? "cursor-blink" : ""}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "15px",
                lineHeight: "1.8",
                color: "#e2e8f0",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {draftText}
            </p>
          )}
        </div>

        {/* Footer: char count + copy button */}
        {isDone && draftText && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #1a2d4a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>
              {draftText.length} 字
            </span>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: `1px solid ${copied ? "#00ff88" : "#1a2d4a"}`,
                background: copied ? "rgba(0,255,136,0.1)" : "transparent",
                color: copied ? "#00ff88" : "#64748b",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {copied ? "✓ 已复制" : "复制"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
