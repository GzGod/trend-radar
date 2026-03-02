# Trend Radar — 设计文档

**日期：** 2026-03-03
**项目目录：** `e:/vibe/trend-radar/`

---

## 一、产品概述

面向 crypto/AI 推特创作者的热点话题聚合看板。每天打开即可看到当前最热的话题，点击话题一键生成推文草稿，帮助决定"今天发什么"。

---

## 二、技术栈

- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（深色主题）
- cheerio（服务端 HTML 解析）
- OpenAI 兼容 API（Gemini / Claude）
- 部署：Vercel

---

## 三、数据源

| 数据源 | 接口方式 | 内容 |
|--------|----------|------|
| xhunt.ai | 服务端 fetch + cheerio | X 热榜推文，crypto/ai 标签 |
| CoinGecko | 公开 REST API `/coins/trending` | 当前最热 Coin |
| Reddit | 公开 JSON API `r/CryptoCurrency/hot.json` + `r/artificial/hot.json` | 社区热帖 |

---

## 四、API 路由

### `GET /api/topics`
并发请求三个数据源，合并返回。

**Query params：**
- `filter`: `all` | `crypto` | `ai`（默认 `all`）

**Response：**
```json
{
  "xTrends": [...],
  "coinTrending": [...],
  "reddit": { "crypto": [...], "ai": [...] },
  "updatedAt": "ISO timestamp"
}
```

### `POST /api/draft`
根据话题生成推文草稿。

**Body：**
```json
{ "topic": "话题标题或摘要", "model": "gemini-2.5-pro" }
```

**Response：** SSE 流式输出，140字以内中文推文草稿。

---

## 五、前端页面结构

```
app/
├── page.tsx              # 主 Dashboard
├── layout.tsx
└── globals.css

components/
├── Dashboard.tsx         # 主布局，状态管理
├── TopicCard.tsx         # 通用话题卡片
├── XTrendsSection.tsx    # X 热榜区块
├── CryptoSection.tsx     # CoinGecko 热点区块
├── RedditSection.tsx     # Reddit 热帖区块
├── DraftPanel.tsx        # 右侧滑出草稿面板
└── FilterBar.tsx         # 顶部筛选栏

lib/
├── scraper.ts            # xhunt.ai 抓取（复用 xtrends 逻辑）
├── coingecko.ts          # CoinGecko API 封装
└── reddit.ts             # Reddit API 封装
```

---

## 六、UI 设计

使用 `frontend-design` skill 生成，深色主题，科技感风格。

**布局：**
- 顶部：Logo + 刷新按钮 + 最后更新时间 + 分类 Tab（全部 / Crypto / AI）
- 主体：三列或瀑布流卡片布局
  - X 热榜（左/上）
  - Crypto 行情热点（中）
  - Reddit 热帖（右/下）
- 右侧：点击话题后滑出的草稿生成面板

---

## 七、AI 草稿生成

- 触发：点击任意话题卡片
- 风格：克制理性，略带冷幽默，140字以内，中文
- 禁用句式：不是…而是…、说白了…、真正的…
- 输出：SSE 流式，生成完成后显示复制按钮

---

## 八、环境变量

```
AI_API_KEY=
AI_API_BASE=https://max.openai365.top/v1
AI_MODEL=gemini-2.5-pro
```

---

## 九、已知限制

- xhunt.ai 页面结构变更会导致解析失败
- CoinGecko 免费 API 有频率限制（30次/分钟）
- Reddit JSON API 偶尔需要 User-Agent 头
