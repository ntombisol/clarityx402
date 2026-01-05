import type { BazaarResource } from "@/lib/bazaar/types";

// URL path patterns for classification (checked against URL path)
const URL_PATH_PATTERNS: Record<string, RegExp[]> = {
  "llm-inference": [
    /\/chat/i,
    /\/completions?/i,
    /\/v1\/messages/i,
    /\/generate\/?text/i,
    /\/llm/i,
    /\/gpt/i,
    /\/claude/i,
    /\/ask/i,
    /\/prompt/i,
    /\/inference/i,
    /\/embed(dings?)?/i,
    /\/ai\/.*chat/i,
    /\/model/i,
    /\/predict/i,
    /\/summarize/i,
    /\/translate/i,
    /\/analyze/i,
    /\/extract/i,
    /\/rewrite/i,
    /\/assistant/i,
    /\/agent/i,
  ],
  "image-generation": [
    /\/image/i,
    /\/img/i,
    /\/generate.*image/i,
    /\/flux/i,
    /\/stable-?diffusion/i,
    /\/dalle?/i,
    /\/txt2img/i,
    /\/text-to-image/i,
    /\/art/i,
    /\/render/i,
    /\/draw/i,
    /\/vision/i,
  ],
  "data-feeds": [
    /\/price/i,
    /\/prices/i,
    /\/ticker/i,
    /\/quote/i,
    /\/market/i,
    /\/rates?/i,
    /\/feed/i,
    /\/oracle/i,
    /\/weather/i,
    /\/news/i,
    /\/stock/i,
    /\/forex/i,
    /\/crypto\/.*price/i,
    /\/token\/.*price/i,
    /\/data\//i,
    /\/momentum/i,
    /\/analytics/i,
  ],
  security: [
    /\/security/i,
    /\/audit/i,
    /\/scan/i,
    /\/verify/i,
    /\/check/i,
    /\/validate/i,
    /\/risk/i,
    /\/threat/i,
    /\/malware/i,
    /\/phishing/i,
    /[\/.]hygiene/i,
    /\/compliance/i,
    /\/fraud/i,
    /\/contact[\/.]?/i,
  ],
  search: [
    /\/search/i,
    /\/find/i,
    /\/lookup/i,
    /\/query/i,
    /\/serp/i,
    /\/discover/i,
    /\/browse/i,
  ],
  utilities: [
    /\/qr/i,
    /\/url/i,
    /\/shorten/i,
    /\/convert/i,
    /\/encode/i,
    /\/decode/i,
    /\/hash/i,
    /\/compress/i,
    /\/resize/i,
    /\/pdf/i,
    /\/screenshot/i,
    /\/scrape/i,
    /\/mint/i,
    /\/nft/i,
  ],
  defi: [
    /\/swap/i,
    /\/pool/i,
    /\/liquidity/i,
    /\/yield/i,
    /\/stake/i,
    /\/lend/i,
    /\/borrow/i,
    /\/trade/i,
    /\/dex/i,
    /\/amm/i,
    /\/bridge/i,
    /\/vault/i,
    /\/farm/i,
    /\/apy/i,
  ],
  social: [
    /\/twitter/i,
    /\/tweet/i,
    /\/x\.com/i,
    /\/farcaster/i,
    /\/cast/i,
    /\/lens/i,
    /\/social/i,
    /\/profile/i,
    /\/follow/i,
    /\/post/i,
    /\/timeline/i,
    /\/mention/i,
    /\/user/i,
  ],
};

// Known domains mapped to categories
const DOMAIN_CATEGORY_MAP: Record<string, string> = {
  // LLM providers
  "openai.com": "llm-inference",
  "api.openai.com": "llm-inference",
  "anthropic.com": "llm-inference",
  "api.anthropic.com": "llm-inference",
  "cohere.ai": "llm-inference",
  "ai.google.dev": "llm-inference",
  "replicate.com": "llm-inference",
  "huggingface.co": "llm-inference",
  "together.ai": "llm-inference",
  "groq.com": "llm-inference",
  "perplexity.ai": "llm-inference",
  "mistral.ai": "llm-inference",

  // Image generation
  "stability.ai": "image-generation",
  "midjourney.com": "image-generation",
  "leonardo.ai": "image-generation",
  "getimg.ai": "image-generation",

  // Data feeds
  "coingecko.com": "data-feeds",
  "coinmarketcap.com": "data-feeds",
  "cryptocompare.com": "data-feeds",
  "alphavantage.co": "data-feeds",
  "finnhub.io": "data-feeds",

  // DeFi
  "uniswap.org": "defi",
  "aave.com": "defi",
  "curve.fi": "defi",
  "1inch.io": "defi",
  "paraswap.io": "defi",

  // Social
  "farcaster.xyz": "social",
  "warpcast.com": "social",
};

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
 * Extract domain and path from URL
 */
function parseUrl(url: string): { domain: string; path: string } {
  try {
    const parsed = new URL(url);
    return {
      domain: parsed.hostname.replace(/^www\./, ""),
      path: parsed.pathname + parsed.search,
    };
  } catch {
    return { domain: "", path: url };
  }
}

/**
 * Capitalize first letter of each word
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Clean up domain name for display
 */
function formatDomainName(domain: string): string {
  // Get first part of domain, remove common suffixes
  let name = domain.split(".")[0];
  // Remove common prefixes/suffixes
  name = name.replace(/^(api|www|app|my)-?/i, "");
  name = name.replace(/-?(api|app|service|server|prod|dev|staging)$/i, "");
  // Convert kebab-case to spaces
  name = name.replace(/[-_]/g, " ");
  // Title case
  return titleCase(name.trim()) || titleCase(domain.split(".")[0]);
}

/**
 * Generate a description from URL patterns when none exists
 */
export function generateDescriptionFromUrl(url: string): string | null {
  const { domain, path } = parseUrl(url);

  // Extract meaningful path segments
  const segments = path
    .split(/[\/\-_.]/)
    .filter((s) => s.length > 2 && !/^(api|v\d|x402|https?|com|app|io)$/i.test(s))
    .map((s) => s.replace(/([A-Z])/g, " $1").trim()) // camelCase to spaces
    .slice(0, 3);

  if (segments.length === 0) {
    return null;
  }

  // Format the action from path segments
  const action = titleCase(segments.join(" "));

  // Format the provider name from domain
  const provider = formatDomainName(domain);

  // Build natural description based on what we have
  if (provider && action) {
    return `${action} service by ${provider}`;
  } else if (action) {
    return `${action} API`;
  }

  return null;
}

/**
 * Classify an endpoint based on its description, URL patterns, and metadata
 */
export function classifyEndpoint(resource: BazaarResource): ClassificationResult {
  const url = resource.url || "";
  const { domain, path } = parseUrl(url);

  const textToAnalyze = [
    resource.description || "",
    url,
    resource.provider?.name || "",
    JSON.stringify(resource.metadata || {}),
  ]
    .join(" ")
    .toLowerCase();

  // Score each category
  const categoryScores: Record<string, number> = {};

  // 1. Check domain mapping first (highest priority)
  const domainCategory = DOMAIN_CATEGORY_MAP[domain];
  if (domainCategory) {
    categoryScores[domainCategory] = 100; // High score for known domains
  }

  // 2. Check URL path patterns (high priority)
  for (const [category, patterns] of Object.entries(URL_PATH_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(path)) {
        categoryScores[category] = (categoryScores[category] || 0) + 50;
        break; // Only count once per category
      }
    }
  }

  // 3. Keyword matching in text (lower priority)
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        // Longer keywords get higher scores (more specific)
        score += keyword.length;
      }
    }
    if (score > 0) {
      categoryScores[category] = (categoryScores[category] || 0) + score;
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

  // Don't default to utilities - leave as null if no match
  // (utilities should only be matched explicitly)

  // Extract tags
  const tags: string[] = [];
  for (const [tag, pattern] of Object.entries(TAG_PATTERNS)) {
    if (pattern.test(textToAnalyze)) {
      tags.push(tag);
    }
  }

  // Calculate confidence (0-1)
  // Domain match = high confidence, URL pattern = medium, keyword only = lower
  let confidence = 0;
  if (domainCategory) {
    confidence = 0.95;
  } else if (bestScore >= 50) {
    confidence = 0.8; // URL pattern match
  } else if (bestScore > 0) {
    const competingCategories = Object.keys(categoryScores).length;
    confidence = Math.min(0.6, bestScore / 50) * (1 - (competingCategories - 1) * 0.1);
  }

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
