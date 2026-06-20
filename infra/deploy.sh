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
SA="${AZURE_STORAGE_ACCOUNT:-stlipcoding35567}"
SHARE=gitcodata
TAG="$(date +%Y%m%d%H%M%S)"
IMAGE="$ACR.azurecr.io/$APP:$TAG"

# --- Persistence: Azure Files share mounted at /data (idempotent) ---
echo ">> Ensuring Azure Files persistence ..."
az provider register -n Microsoft.Storage >/dev/null 2>&1 || true
if ! az storage account show -g "$RG" -n "$SA" >/dev/null 2>&1; then
  az storage account create -g "$RG" -n "$SA" -l "$LOC" --sku Standard_LRS --kind StorageV2 >/dev/null
fi
SA_KEY=$(az storage account keys list -g "$RG" -n "$SA" --query "[0].value" -o tsv)
az storage share-rm show -g "$RG" --storage-account "$SA" -n "$SHARE" >/dev/null 2>&1 \
  || az storage share-rm create -g "$RG" --storage-account "$SA" -n "$SHARE" --quota 5 >/dev/null
az containerapp env storage set -g "$RG" -n "$ENVNAME" \
  --storage-name "$SHARE" --azure-file-account-name "$SA" \
  --azure-file-account-key "$SA_KEY" --azure-file-share-name "$SHARE" \
  --access-mode ReadWrite >/dev/null 2>&1 || true

# Pre-build locally (native) — avoids vite/tsc segfaults under amd64 emulation.
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
echo ">> Building frontend (native) ..."
( cd frontend && npm run build )
echo ">> Building backend (native) ..."
( cd backend && npm run build )

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
      DB_PATH=/data/data.db \
      AZURE_OPENAI_API_KEY=secretref:aoai-key >/dev/null
  echo "   NOTE: mount the '$SHARE' volume at /data via YAML patch (see docs/AGENTS.md)."
fi

FQDN=$(az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo ">> Deployed: https://$FQDN"
