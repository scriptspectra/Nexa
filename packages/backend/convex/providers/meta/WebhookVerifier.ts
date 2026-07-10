import * as crypto from "crypto";

export class WebhookVerifier {
  /**
   * Verifies the SHA-256 signature from Meta webhooks.
   * @param payload The raw request body as a string.
   * @param signature The X-Hub-Signature-256 header (e.g. 'sha256=....')
   * @param appSecret The Meta App Secret
   */
  static verifySignature(payload: string, signature: string, appSecret: string): boolean {
    if (!signature || !signature.startsWith("sha256=")) {
      return false;
    }

    const expectedHash = crypto
      .createHmac("sha256", appSecret)
      .update(payload, "utf8")
      .digest("hex");

    const actualHash = signature.replace("sha256=", "");

    // Secure string comparison to prevent timing attacks
    if (expectedHash.length !== actualHash.length) return false;
    
    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(actualHash));
  }
}
