import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify Thirdweb webhook signature using HMAC-SHA256
 * @param payload - Raw webhook payload string
 * @param signature - Signature from x-signature header
 * @param secret - Webhook secret from environment
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Generate expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(cleanSignature, 'hex');
    
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Check if webhook timestamp is within acceptable range (5 minutes)
 * @param timestamp - ISO timestamp from webhook
 * @returns boolean indicating if timestamp is valid
 */
export function isValidWebhookTimestamp(timestamp: string): boolean {
  try {
    const webhookTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return Math.abs(currentTime - webhookTime) <= fiveMinutes;
  } catch (error) {
    console.error('Timestamp validation error:', error);
    return false;
  }
}

/**
 * Log security events for monitoring
 * @param event - Security event type
 * @param details - Additional details
 */
export function logSecurityEvent(event: string, details: Record<string, any>) {
  console.log(`🔒 Security Event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
}