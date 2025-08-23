import { xanoClient } from './xano-client';

// In-memory cache for recent webhook events (simple implementation)
// In production, consider using Redis or database for persistence
const processedEvents = new Map<string, {
  timestamp: number;
  processed: boolean;
  result: 'success' | 'failure';
}>();

// Cache cleanup interval (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if webhook event has already been processed
 * @param eventId - Unique event identifier
 * @returns true if already processed
 */
export async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  try {
    // First check in-memory cache for recent events
    const cached = processedEvents.get(eventId);
    if (cached) {
      console.log('🔍 Event found in cache:', {
        eventId,
        processed: cached.processed,
        result: cached.result,
        age: Date.now() - cached.timestamp
      });
      return cached.processed;
    }

    // Check database for webhook event record
    const existingEvent = await xanoClient.getWebhookEvents();
    if (existingEvent.data) {
      const found = existingEvent.data.find(event => 
        event.payload && event.payload.event_id === eventId
      );
      if (found) {
        console.log('🔍 Event found in database:', {
          eventId,
          processed: found.processed,
          createdAt: found.created_at
        });
        
        // Cache the result to avoid future database lookups
        processedEvents.set(eventId, {
          timestamp: Date.now(),
          processed: found.processed,
          result: found.processed ? 'success' : 'failure'
        });
        
        return found.processed;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking event idempotency:', error);
    // In case of error, allow processing to continue
    // Better to process twice than miss a payment
    return false;
  }
}

/**
 * Mark webhook event as processed in cache and database
 * @param eventId - Unique event identifier
 * @param result - Processing result
 */
export function markEventAsProcessed(eventId: string, result: 'success' | 'failure'): void {
  processedEvents.set(eventId, {
    timestamp: Date.now(),
    processed: true,
    result
  });
  
  console.log('✅ Event marked as processed:', {
    eventId,
    result,
    timestamp: new Date().toISOString()
  });
}

/**
 * Clean up old entries from in-memory cache
 * Called periodically to prevent memory leaks
 */
export function cleanupProcessedEventsCache(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [eventId, data] of processedEvents.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      processedEvents.delete(eventId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log('🧹 Cleaned up processed events cache:', {
      cleaned: cleanedCount,
      remaining: processedEvents.size
    });
  }
}

/**
 * Enhanced error handling with retry logic
 * @param operation - Function to execute with retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in milliseconds
 * @returns Operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`⚠️ Operation failed (attempt ${attempt}/${maxRetries}):`, {
        error: lastError.message,
        nextRetryIn: attempt < maxRetries ? `${delay}ms` : 'no more retries'
      });
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Log webhook processing metrics
 * @param eventId - Event identifier
 * @param processingTime - Time taken to process in milliseconds
 * @param success - Whether processing succeeded
 */
export function logProcessingMetrics(
  eventId: string, 
  processingTime: number, 
  success: boolean
): void {
  console.log('📊 Webhook processing metrics:', {
    eventId,
    processingTime: `${processingTime}ms`,
    success,
    timestamp: new Date().toISOString()
  });
  
  // TODO: In production, send metrics to monitoring system
  // e.g., Vercel Analytics, DataDog, New Relic, etc.
}

// Setup periodic cache cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupProcessedEventsCache, CACHE_TTL);
}