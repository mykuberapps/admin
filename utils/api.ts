/**
 * Centralized API & Authentication Utilities
 * Ensures consistent routing through Next.js proxy (/api/proxy) and robust session handling.
 */

export function getApiUrl(): string {
  // If explicitly configured, respect NEXT_PUBLIC_API_URL
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()) {
    return process.env.NEXT_PUBLIC_API_URL.trim();
  }
  // In the browser, always use the Next.js relative rewrite proxy to avoid CORS and mixed content
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }
  // On the server side (SSR / Node), use BACKEND_INTERNAL_URL or fallback to the EC2 backend
  return process.env.BACKEND_INTERNAL_URL || "http://13.49.90.62:3000";
}

export function getAdminKey(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("admin_api_key");
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  return process.env.NEXT_PUBLIC_ADMIN_API_KEY || "kuber_admin_secret_key_2026";
}

export function getAdminUsername(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("admin_api_username");
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  return "Administrator";
}

export function getAdminHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const key = getAdminKey();
  const username = getAdminUsername();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Admin-API-Key": key,
    "x-admin-api-key": key,
    "Authorization": `Bearer ${key}`,
    "X-Admin-Username": username,
    ...(extraHeaders || {})
  };

  return headers;
}
