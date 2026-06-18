#!/usr/bin/env bash
#
# One-time setup for the "Deploy to Firebase Hosting (prod)" GitHub Actions pipeline.
#
# Creates a dedicated Firebase deploy service account, grants it Hosting deploy
# permissions on the rapids-platform project, mints a JSON key, and stores that
# key as the FIREBASE_SERVICE_ACCOUNT secret on the GitHub repo that runs the
# workflow. After this runs, every push to `main` auto-deploys to
# https://ehr-sandbox.web.app
#
# Prerequisites (one interactive login each, if not already done):
#   gcloud auth login
#   gh auth login        # account needs ADMIN on $REPO to set secrets
#
# Usage:
#   ./scripts/setup-firebase-cicd.sh
#   REPO=saiprasad055/EHR-Sandbox-Dashboard ./scripts/setup-firebase-cicd.sh
#
set -euo pipefail

PROJECT="${PROJECT:-rapids-platform}"
REPO="${REPO:-risa-labs-inc/EHR-Sandbox-Dashboard}"
SA_NAME="${SA_NAME:-ehr-sandbox-deployer}"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
KEY_FILE="$(mktemp -t ehr-sandbox-sa-XXXXXX.json)"

cleanup() { rm -f "$KEY_FILE"; }
trap cleanup EXIT

echo ">> Project: $PROJECT"
echo ">> GitHub repo: $REPO"
echo ">> Service account: $SA_EMAIL"

# 1. Create the service account (idempotent).
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --project "$PROJECT" \
    --display-name "EHR Sandbox Hosting Deployer (GitHub Actions)"
else
  echo ">> Service account already exists, reusing."
fi

# 2. Grant the roles needed to deploy Firebase Hosting.
for ROLE in roles/firebasehosting.admin roles/firebase.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member "serviceAccount:${SA_EMAIL}" \
    --role "$ROLE" \
    --condition=None >/dev/null
  echo ">> Granted $ROLE"
done

# 3. Mint a JSON key.
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account "$SA_EMAIL" \
  --project "$PROJECT"

# 4. Store it as the GitHub Actions secret.
gh secret set FIREBASE_SERVICE_ACCOUNT --repo "$REPO" < "$KEY_FILE"
echo ">> Set FIREBASE_SERVICE_ACCOUNT secret on $REPO"

echo
echo "Done. Push to main on $REPO (or run the workflow manually) to deploy."
