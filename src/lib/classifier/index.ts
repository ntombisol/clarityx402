import type { BazaarResource } from "@/lib/bazaar/types";

// Category definitions with keywords for matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "llm-inference": [
    "llm",
    "gpt",
    "claude",
    "chat",
    "completion",
    "text generation",
    "language model",
    "ai model",
    "inference",
    "prompt",
    "embedding",
    "openai",
    "anthropic",
    "mistral",
    "llama",
    "gemini",
  ],
  "image-generation": [
    "image",
    "picture",
    "photo",
    "dall-e",
    "dalle",
    "stable diffusion",
    "midjourney",
    "text-to-image",
    "text to image",
    "image generation",
    "generate image",
    "art",
    "illustration",
    "flux",
  ],
  "data-feeds": [
    "price",
    "prices",
    "market data",
    "feed",
    "ticker",
    "quote",
    "weather",
    "news",
    "stock",
    "forex",
    "exchange rate",
    "oracle",
    "data feed",
  ],
  security: [
    "security",
    "audit",
    "scan",
    "verify",
    "verification",
    "wallet check",
    "contract scan",
    "vulnerability",
    "risk",
    "malware",
    "phishing",
    "scam",
  ],
  search: [
    "search",
    "find",
    "lookup",
    "query",
    "google",
    "bing",
    "web search",
    "internet search",
    "serp",
  ],
  utilities: [
    "qr",
    "qr code",
    "url",
    "shortener",
    "shorten",
    "convert",
    "converter",
    "encode",
    "decode",
    "hash",
    "utility",
    "tool",
    "resize",
    "compress",
  ],
  defi: [
    "defi",
    "swap",
    "pool",
    "liquidity",
    "yield",
    "apy",
    "apr",
    "stake",
    "staking",
    "lending",
    "borrow",
    "trading",
    "dex",
    "amm",
    "uniswap",
    "aave",
  ],
  social: [
    "twitter",
    "x.com",
    "tweet",
    "farcaster",
    "lens",
    "social",
    "profile",
    "follower",
    "post",
    "feed",
    "timeline",
    "mention",
  ],
};

// Tag extraction patterns
const TAG_PATTERNS: Record<string, RegExp> = {
  crypto: /crypto|blockchain|web3|token|nft|eth|sol|btc/i,
  ai: /ai|artificial intelligence|machine learning|ml|neural/i,
  realtime: /real-?time|live|streaming/i,
  free: /free|no cost/i,
  premium: /premium|paid|subscription/i,
  api: /api|rest|graphql/i,
};

export interface ClassificationResult {
  category: string | null;
  tags: string[];
  confidence: number;
}

/**
 * Classify an endpoint based on its description and metadata
 */
export function classifyEndpoint(resource: BazaarResource): ClassificationResult {
  const textToAnalyze = [
    resource.description || "",
    resource.url || "",
    resource.provider?.name || "",
    JSON.stringify(resource.metadata || {}),
  ]
    .join(" ")
    .toLowerCase();

  // Score each category
  const categoryScores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        // Longer keywords get higher scores (more specific)
        score += keyword.length;
      }
    }
    if (score > 0) {
      categoryScores[category] = score;
    }
  }

  // Find the best category
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Extract tags
  const tags: string[] = [];
  for (const [tag, pattern] of Object.entries(TAG_PATTERNS)) {
    if (pattern.test(textToAnalyze)) {
      tags.push(tag);
    }
  }

  // Calculate confidence (0-1)
  // Higher score and fewer competing categories = higher confidence
  const competingCategories = Object.keys(categoryScores).length;
  const confidence =
    bestScore > 0
      ? Math.min(1, bestScore / 50) * (1 - (competingCategories - 1) * 0.1)
      : 0;

  return {
    category: bestCategory,
    tags,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

/**
 * Batch classify multiple endpoints
 */
export function classifyEndpoints(
  resources: BazaarResource[]
): Map<string, ClassificationResult> {
  const results = new Map<string, ClassificationResult>();

  for (const resource of resources) {
    results.set(resource.url, classifyEndpoint(resource));
  }

  return results;
}
