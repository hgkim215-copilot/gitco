export interface AppConfig {
  port: number;
  azureEndpoint: string;
  azureApiKey: string;
  azureDeployment: string;
  azureEmbedDeployment: string;
  azureApiVersion: string;
}

export function loadConfig(): AppConfig {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1-mini";
  const azureEmbedDeployment =
    process.env.AZURE_OPENAI_EMBED_DEPLOYMENT ?? "text-embedding-3-small";
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";
  if (!azureEndpoint || !azureApiKey) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY");
  }
  return {
    port: Number(process.env.PORT ?? 8080),
    azureEndpoint,
    azureApiKey,
    azureDeployment,
    azureEmbedDeployment,
    azureApiVersion,
  };
}
