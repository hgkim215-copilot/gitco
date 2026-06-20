export interface AppConfig {
  port: number;
  azureEndpoint: string;
  azureApiKey: string;
  azureDeployment: string;
}

export function loadConfig(): AppConfig {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1-mini";
  if (!azureEndpoint || !azureApiKey) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY");
  }
  return {
    port: Number(process.env.PORT ?? 8080),
    azureEndpoint,
    azureApiKey,
    azureDeployment,
  };
}
