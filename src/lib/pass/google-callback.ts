import { createPublicKey, verify } from "node:crypto"
import { z } from "zod"

/**
 * Verifies Google Wallet save/delete callbacks (ECv2SigningOnly), the same
 * check Tink's PaymentMethodTokenRecipient does: a Google root key signs an
 * intermediate key, which signs the message.
 */
export const SENDER_ID = "GooglePayPasses"
export const PROTOCOL = "ECv2SigningOnly"

export type RootKey = { keyValue: string; protocolVersion: string; keyExpiration?: string }

const callbackSchema = z.object({
  protocolVersion: z.literal(PROTOCOL),
  signature: z.string(),
  signedMessage: z.string(),
  intermediateSigningKey: z.object({ signedKey: z.string(), signatures: z.array(z.string()) }),
})

const signedKeySchema = z.object({ keyValue: z.string(), keyExpiration: z.string() })

const messageSchema = z.object({
  classId: z.string(),
  objectId: z.string(),
  eventType: z.string(),
  expTimeMillis: z.union([z.string(), z.number()]),
  nonce: z.string().optional(),
})

export type CallbackMessage = z.infer<typeof messageSchema>

/** Each part as a 4-byte little-endian length followed by its UTF-8 bytes. */
export function lengthValue(...parts: string[]) {
  return Buffer.concat(
    parts.flatMap((part) => {
      const bytes = Buffer.from(part, "utf8")
      const length = Buffer.alloc(4)
      length.writeUInt32LE(bytes.length)
      return [length, bytes]
    }),
  )
}

function verifies(keyValue: string, data: Buffer, signature: string) {
  try {
    const key = createPublicKey({ key: Buffer.from(keyValue, "base64"), format: "der", type: "spki" })
    return verify("sha256", data, key, Buffer.from(signature, "base64"))
  } catch {
    return false
  }
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

export function verifyCallback(
  body: unknown,
  { recipientId, rootKeys, now = Date.now() }: { recipientId: string; rootKeys: RootKey[]; now?: number },
): CallbackMessage | null {
  const parsed = callbackSchema.safeParse(body)
  if (!parsed.success) return null
  const { signature, signedMessage, intermediateSigningKey } = parsed.data

  const roots = rootKeys.filter(
    (k) => k.protocolVersion === PROTOCOL && (!k.keyExpiration || Number(k.keyExpiration) > now),
  )
  const keyData = lengthValue(SENDER_ID, PROTOCOL, intermediateSigningKey.signedKey)
  const keySigned = intermediateSigningKey.signatures.some((sig) => roots.some((k) => verifies(k.keyValue, keyData, sig)))
  if (!keySigned) return null

  const signedKey = signedKeySchema.safeParse(parseJson(intermediateSigningKey.signedKey))
  if (!signedKey.success || Number(signedKey.data.keyExpiration) <= now) return null

  const messageData = lengthValue(SENDER_ID, recipientId, PROTOCOL, signedMessage)
  if (!verifies(signedKey.data.keyValue, messageData, signature)) return null

  const message = messageSchema.safeParse(parseJson(signedMessage))
  if (!message.success || Number(message.data.expTimeMillis) <= now) return null
  return message.data
}
