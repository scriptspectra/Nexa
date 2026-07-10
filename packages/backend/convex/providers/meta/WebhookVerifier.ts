/**
 * Verifies Meta webhook signatures using the Web Crypto API (crypto.subtle).
 * Compatible with the Convex V8 runtime — no Node.js built-ins required.
 */
export class WebhookVerifier {
  /**
   * Verifies the SHA-256 HMAC signature from Meta webhooks.
   * @param payload The raw request body as a string.
   * @param signature The X-Hub-Signature-256 header (e.g. 'sha256=....')
   * @param appSecret The Meta App Secret
   */
  static async verifySignature(
    payload: string,
    signature: string,
    appSecret: string
  ): Promise<boolean> {
    if (!signature || !signature.startsWith("sha256=")) {
      return false;
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(appSecret);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);

    const computedHex = Array.from(new Uint8Array(signatureBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const actualHash = signature.replace("sha256=", "");

    // Constant-time string comparison
    if (computedHex.length !== actualHash.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedHex.length; i++) {
      mismatch |= computedHex.charCodeAt(i) ^ actualHash.charCodeAt(i);
    }
    return mismatch === 0;
  }
}
