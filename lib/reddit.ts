// lib/reddit.ts
export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  numComments: number;
  subreddit: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSubredditHot(subreddit: string, limit = 8): Promise<RedditPost[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
    {
      headers: {
        "User-Agent": "trend-radar/1.0 (content aggregator)",
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    }
  );

  if (!res.ok) throw new Error(`Reddit ${subreddit} ${res.status}`);

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data?.children ?? [])
    .filter((c: any) => !c.data.stickied)
    .map((c: any) => ({
      id: c.data.id,
      title: c.data.title,
      url: `https://reddit.com${c.data.permalink}`,
      score: c.data.score,
      numComments: c.data.num_comments,
      subreddit,
    }));
}

export async function fetchRedditHot(): Promise<{ crypto: RedditPost[]; ai: RedditPost[] }> {
  const [crypto, ai] = await Promise.allSettled([
    fetchSubredditHot("CryptoCurrency"),
    fetchSubredditHot("artificial"),
  ]);

  return {
    crypto: crypto.status === "fulfilled" ? crypto.value : [],
    ai: ai.status === "fulfilled" ? ai.value : [],
  };
}
