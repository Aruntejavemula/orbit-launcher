import type { AppItem } from "../types";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const seedApps: AppItem[] = [
  { id: "claude", name: "Claude", slug: "claude", color: "D97757", url: "https://claude.ai", category: "ai", plan: "paid", createdAt: now - 30 * day, lastOpened: now - 2 * 60 * 60 * 1000, expiresAt: now + 22 * day, weeklyMinutes: 320 },
  { id: "chatgpt", name: "ChatGPT", slug: "openai", color: "10A37F", url: "https://chat.openai.com", category: "ai", plan: "paid", createdAt: now - 60 * day, lastOpened: now - 5 * 60 * 60 * 1000, expiresAt: now + 12 * day, weeklyMinutes: 410 },
  { id: "perplexity", name: "Perplexity", slug: "perplexity", color: "20B8CD", url: "https://perplexity.ai", category: "ai", plan: "trial", createdAt: now - 10 * day, lastOpened: now - 1 * day, expiresAt: now + 5 * day, weeklyMinutes: 120 },
  { id: "figma", name: "Figma", slug: "figma", color: "F24E1E", url: "https://figma.com", category: "design", plan: "paid", createdAt: now - 100 * day, lastOpened: now - 3 * day, expiresAt: now + 28 * day, weeklyMinutes: 260 },
  { id: "framer", name: "Framer", slug: "framer", color: "0055FF", url: "https://framer.com", category: "design", plan: "trial", createdAt: now - 14 * day, lastOpened: now - 8 * day, expiresAt: now + 2 * day, weeklyMinutes: 75 },
  { id: "notion", name: "Notion", slug: "notion", color: "000000", url: "https://notion.so", category: "productivity", plan: "paid", createdAt: now - 200 * day, lastOpened: now - 30 * 60 * 1000, expiresAt: now + 7 * day, weeklyMinutes: 540 },
  { id: "linear", name: "Linear", slug: "linear", color: "5E6AD2", url: "https://linear.app", category: "productivity", plan: "paid", createdAt: now - 80 * day, lastOpened: now - 4 * 60 * 60 * 1000, expiresAt: now + 18 * day, weeklyMinutes: 290 },
  { id: "slack", name: "Slack", slug: "slack", color: "4A154B", url: "https://slack.com", category: "productivity", plan: "free", createdAt: now - 365 * day, lastOpened: now - 15 * 60 * 1000, weeklyMinutes: 600 },
  { id: "github", name: "GitHub", slug: "github", color: "181717", url: "https://github.com", category: "productivity", plan: "paid", createdAt: now - 500 * day, lastOpened: now - 1 * 60 * 60 * 1000, expiresAt: now + 45 * day, weeklyMinutes: 450 },
  { id: "spotify", name: "Spotify", slug: "spotify", color: "1DB954", url: "https://open.spotify.com", category: "music", plan: "paid", createdAt: now - 700 * day, lastOpened: now - 10 * 60 * 1000, expiresAt: now + 9 * day, weeklyMinutes: 380 },
  { id: "raycast", name: "Raycast", slug: "raycast", color: "FF6363", url: "https://raycast.com", category: "productivity", plan: "free", createdAt: now - 50 * day, lastOpened: now - 6 * 60 * 60 * 1000, weeklyMinutes: 95 },
  { id: "stripe", name: "Stripe", slug: "stripe", color: "635BFF", url: "https://stripe.com", category: "finance", plan: "free", createdAt: now - 25 * day, lastOpened: now - 12 * day, weeklyMinutes: 40 },
];
