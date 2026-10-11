import "server-only"

import { readPem } from "@/lib/pass/schema"

export { SITE_HOST, SITE_URL } from "@/lib/pass/config-public"

export function appleConfig() {
  const config = {
    teamId: process.env.APPLE_TEAM_ID,
    passTypeId: process.env.APPLE_PASS_TYPE_ID,
    organizationName: process.env.APPLE_ORGANIZATION_NAME ?? "Myrzan Wallet",
    signerCert: readPem(process.env.APPLE_SIGNER_CERT_PEM),
    signerKey: readPem(process.env.APPLE_SIGNER_KEY_PEM),
    signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE,
    wwdr: readPem(process.env.APPLE_WWDR_PEM),
  }
  const { teamId, passTypeId, signerCert, signerKey, wwdr } = config
  if (!teamId || !passTypeId || !signerCert || !signerKey || !wwdr) return null
  return { ...config, teamId, passTypeId, signerCert, signerKey, wwdr }
}

export type GoogleServiceAccount = { client_email: string; private_key: string }

export function googleConfig() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!issuerId || !raw) return null
  const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")
  const account = JSON.parse(json) as GoogleServiceAccount
  return {
    issuerId,
    account,
    classSuffix: process.env.GOOGLE_WALLET_CLASS_SUFFIX ?? "generic_v1",
  }
}
