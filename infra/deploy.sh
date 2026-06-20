#!/usr/bin/env bash
set -euo pipefail

# Builds the container image LOCALLY (ACR Tasks/cloud-build is disabled on this
# subscription), pushes it to Azure Container Registry, and deploys it to
# Azure Container Apps.
#
# Requires: docker (with buildx), az (logged in), and Azure OpenAI creds in env
# or in the session creds file referenced below.

CREDS="${AZURE_CREDS_FILE:-/Users/hyeongikim/.copilot/session-state/f0833591-3b15-4152-94b2-726db97cf411/files/azure-credentials.env}"
if [ -f "$CREDS" ]; then set -a; source "$CREDS"; set +a; fi

RG=rg-lipcoding2026
LOC=eastus2
APP=ai-chief-of-staff
ENVNAME=lip-env
ACR=ca74949c518eacr
IMAGE="$ACR.azurecr.io/$APP:latest"

echo ">> Enabling ACR admin user ..."
az acr update -n "$ACR" --admin-enabled true >/dev/null
ACR_USER=$(az acr credential show -n "$ACR" --query username -o tsv)
ACR_PASS=$(az acr credential show -n "$ACR" --query "passwords[0].value" -o tsv)

echo ">> Building image locally (linux/amd64) ..."
docker buildx build --platform linux/amd64 -t "$IMAGE" --load .

echo ">> Logging in to ACR and pushing ..."
echo "$ACR_PASS" | docker login "$ACR.azurecr.io" -u "$ACR_USER" --password-stdin
docker push "$IMAGE"

echo ">> Creating/updating the Container App ..."
if az containerapp show -n "$APP" -g "$RG" >/dev/null 2>&1; then
  az containerapp update -n "$APP" -g "$RG" --image "$IMAGE" >/dev/null
else
  az containerapp create \
    --name "$APP" --resource-group "$RG" --environment "$ENVNAME" \
    --image "$IMAGE" \
    --registry-server "$ACR.azurecr.io" \
    --registry-username "$ACR_USER" \
    --registry-password "$ACR_PASS" \
    --target-port 8080 --ingress external \
    --min-replicas 1 --max-replicas 1 \
    --secrets aoai-key="$AZURE_OPENAI_API_KEY" \
    --env-vars \
      AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
      AZURE_OPENAI_DEPLOYMENT="${AZURE_OPENAI_DEPLOYMENT:-gpt-4.1-mini}" \
      AZURE_OPENAI_API_KEY=secretref:aoai-key >/dev/null
fi

FQDN=$(az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo ">> Deployed: https://$FQDN"
