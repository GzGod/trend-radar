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
    `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
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
