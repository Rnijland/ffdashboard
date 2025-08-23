/**
 * Thirdweb Client Configuration
 * Provides client setup for both frontend and backend usage
 */

import { createThirdwebClient } from "thirdweb";

// Frontend client (only uses public client ID)
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Backend client (uses secret key for server operations)
export const thirdwebServerClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID) {
  throw new Error("NEXT_PUBLIC_THIRDWEB_CLIENT_ID is required");
}

// Server-only validation
if (typeof window === "undefined" && !process.env.THIRDWEB_SECRET_KEY) {
  throw new Error("THIRDWEB_SECRET_KEY is required for server operations");
}