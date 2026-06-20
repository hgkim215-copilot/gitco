#!/usr/bin/env bash
set -euo pipefail

# Loads Azure creds (endpoint/key/deployment) from the session creds file if present,
# otherwise expects them in the environment.
CREDS="${AZURE_CREDS_FILE:-/Users/hyeongikim/.copilot/session-state/f0833591-3b15-4152-94b2-726db97cf411/files/azure-credentials.env}"
if [ -f "$CREDS" ]; then set -a; source "$CREDS"; set +a; fi

RG=rg-lipcoding2026
LOC=eastus2
APP=ai-chief-of-staff
ENVNAME=lip-env

az extension add --name containerapp --upgrade -y >/dev/null 2>&1 || true

echo ">> Deploying $APP to Azure Container Apps ($LOC) ..."
az containerapp up \
  --name "$APP" \
  --resource-group "$RG" \
  --location "$LOC" \
  --environment "$ENVNAME" \
  --source . \
  --target-port 8080 \
  --ingress external \
  --env-vars \
      AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
      AZURE_OPENAI_DEPLOYMENT="${AZURE_OPENAI_DEPLOYMENT:-gpt-4.1-mini}"

echo ">> Setting API key as a secret and binding it ..."
az containerapp secret set -n "$APP" -g "$RG" \
  --secrets aoai-key="$AZURE_OPENAI_API_KEY" >/dev/null
az containerapp update -n "$APP" -g "$RG" \
  --set-env-vars AZURE_OPENAI_API_KEY=secretref:aoai-key >/dev/null

FQDN=$(az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo ">> Deployed: https://$FQDN"
