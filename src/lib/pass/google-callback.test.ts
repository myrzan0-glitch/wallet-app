import { generateKeyPairSync, sign } from "node:crypto"
import { describe, expect, it } from "vitest"

import { PROTOCOL, SENDER_ID, lengthValue, verifyCallback } from "@/lib/pass/google-callback"

const now = 1_800_000_000_000
const der = (key: ReturnType<typeof generateKeyPairSync>["publicKey"]) =>
  key.export({ format: "der", type: "spki" }).toString("base64")

const root = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
const intermediate = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
const rootKeys = [{ keyValue: der(root.publicKey), protocolVersion: PROTOCOL, keyExpiration: String(now + 1e9) }]

function callback({ recipientId = "3388", eventType = "save", keyExpiration = now + 1e6, expTimeMillis = now + 1e6 } = {}) {
  const signedKey = JSON.stringify({ keyValue: der(intermediate.publicKey), keyExpiration: String(keyExpiration) })
  const signedMessage = JSON.stringify({
    classId: "3388.generic_v1",
    objectId: "3388.wifi-abc",
    eventType,
    expTimeMillis,
    nonce: "n1",
  })
  return {
    protocolVersion: PROTOCOL,
    signedMessage,
    signature: sign("sha256", lengthValue(SENDER_ID, recipientId, PROTOCOL, signedMessage), intermediate.privateKey).toString("base64"),
    intermediateSigningKey: {
      signedKey,
      signatures: [sign("sha256", lengthValue(SENDER_ID, PROTOCOL, signedKey), root.privateKey).toString("base64")],
    },
  }
}

describe("verifyCallback", () => {
  it("accepts a correctly signed message", () => {
    expect(verifyCallback(callback(), { recipientId: "3388", rootKeys, now })).toMatchObject({
      objectId: "3388.wifi-abc",
      eventType: "save",
    })
  })

  it("rejects a message signed for another issuer", () => {
    expect(verifyCallback(callback({ recipientId: "9999" }), { recipientId: "3388", rootKeys, now })).toBeNull()
  })

  it("rejects a tampered message", () => {
    const body = callback()
    body.signedMessage = body.signedMessage.replace("save", "del")
    expect(verifyCallback(body, { recipientId: "3388", rootKeys, now })).toBeNull()
  })

  it("rejects an intermediate key not signed by a root key", () => {
    const other = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
    const keys = [{ ...rootKeys[0], keyValue: der(other.publicKey) }]
    expect(verifyCallback(callback(), { recipientId: "3388", rootKeys: keys, now })).toBeNull()
  })

  it("rejects expired keys and messages", () => {
    expect(verifyCallback(callback({ keyExpiration: now - 1 }), { recipientId: "3388", rootKeys, now })).toBeNull()
    expect(verifyCallback(callback({ expTimeMillis: now - 1 }), { recipientId: "3388", rootKeys, now })).toBeNull()
  })
})
