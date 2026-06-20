import type { AppConfig } from "./config.js";

/**
 * Generate an embedding vector for `text` using Azure OpenAI
 * (text-embedding-3-small). Returns null on failure so callers can degrade
 * gracefully (memory is an enhancement, never a hard dependency).
 */
export async function embed(config: AppConfig, text: string): Promise<number[] | null> {
  const url =
    config.azureEndpoint.replace(/\/?$/, "/") +
    `openai/deployments/${config.azureEmbedDeployment}/embeddings?api-version=${config.azureApiVersion}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": config.azureApiKey },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const vec = json?.data?.[0]?.embedding;
    return Array.isArray(vec) ? vec : null;
  } catch {
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
