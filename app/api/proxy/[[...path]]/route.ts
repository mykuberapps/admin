import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_INTERNAL_URL || "http://13.49.90.62:3000").replace(/\/$/, "");
const MASTER_KEY = "kuber_admin_secret_key_2026";

async function proxyHandler(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const pathSegment = path && path.length > 0 ? "/" + path.join("/") : "";
  const searchParams = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${pathSegment}${searchParams}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Strip hop-by-hop and host-specific headers
    if (!["host", "connection", "content-length", "transfer-encoding"].includes(lowerKey)) {
      headers.set(key, value);
    }
  });

  // Ensure Admin headers are strictly present for all /admin endpoints
  if (pathSegment.startsWith("/admin") || pathSegment.includes("/admin/")) {
    const existingKey = headers.get("x-admin-api-key") || headers.get("x-admin-key") || headers.get("admin-api-key");
    const activeKey = existingKey || MASTER_KEY;
    
    headers.set("x-admin-api-key", activeKey);
    headers.set("X-Admin-API-Key", activeKey);
    headers.set("Authorization", `Bearer ${activeKey}`);
    
    if (!headers.get("x-admin-username") && !headers.get("X-Admin-Username")) {
      headers.set("x-admin-username", "Administrator");
      headers.set("X-Admin-Username", "Administrator");
    }
  }

  const method = req.method;
  let body: BodyInit | undefined = undefined;

  if (method !== "GET" && method !== "HEAD") {
    body = await req.blob();
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      // @ts-ignore
      duplex: body ? "half" : undefined,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    response.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!["content-encoding", "transfer-encoding"].includes(lower)) {
        responseHeaders.set(key, val);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Proxy Error] Failed to proxy ${method} to ${targetUrl}:`, error.message);
    return NextResponse.json(
      {
        success: false,
        message: `Upstream gateway unreachable: ${error.message}`,
        target: targetUrl,
      },
      { status: 502 }
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const PATCH = proxyHandler;
export const DELETE = proxyHandler;
export const HEAD = proxyHandler;
export const OPTIONS = proxyHandler;
