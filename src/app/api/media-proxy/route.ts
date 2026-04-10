import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backendSources = [
  process.env.BACKEND_INTERNAL_URL,
  process.env.NEXT_PUBLIC_BACKEND_URL,
].filter(Boolean) as string[];

const safeOrigins = new Set<string>();

for (const source of backendSources) {
  try {
    const parsed = new URL(source);
    safeOrigins.add(parsed.origin);
    if (parsed.hostname === "localhost") {
      safeOrigins.add(`${parsed.protocol}//127.0.0.1${parsed.port ? `:${parsed.port}` : ""}`);
    }
    if (parsed.hostname === "127.0.0.1") {
      safeOrigins.add(`${parsed.protocol}//localhost${parsed.port ? `:${parsed.port}` : ""}`);
    }
  } catch {
    // Ignore invalid URLs.
  }
}

if (!safeOrigins.size) {
  safeOrigins.add("http://localhost:8000");
}

function isAllowedOrigin(origin: string) {
  return safeOrigins.has(origin);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ detail: "url query parameter is required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ detail: "Invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return NextResponse.json({ detail: "Only http/https sources are allowed" }, { status: 400 });
  }

  if (!target.pathname.startsWith("/media/")) {
    return NextResponse.json({ detail: "Only media files can be proxied" }, { status: 400 });
  }

  if (!isAllowedOrigin(target.origin)) {
    return NextResponse.json({ detail: "Origin not allowed", status: 403 }, { status: 403 });
  }

  const range = request.headers.get("range");
  const fetchHeaders: Record<string, string> = {};
  if (range) {
    fetchHeaders["Range"] = range;
  }

  const response = await fetch(target.toString(), { headers: fetchHeaders });
  if (!response.ok || !response.body) {
    return NextResponse.json(
      { detail: `Remote file download failed (${response.status})` },
      { status: response.status },
    );
  }

  const forwarded = new Headers();
  for (const header of ["content-type", "content-length", "content-range"]) {
    const value = response.headers.get(header);
    if (value) {
      forwarded.set(header, value);
    }
  }
  forwarded.set("Cache-Control", "public, max-age=60");

  return new Response(response.body, {
    status: response.status,
    headers: forwarded,
  });
}
