import type { NextRequest } from "next/server";

const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new Response("Missing url parameter", { status: 400 });
    }

    // Only allow proxying files that come from our own backend.
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return new Response("Invalid url", { status: 400 });
    }

    const backendOrigin = new URL(BACKEND_ORIGIN).origin;
    if (parsed.origin !== backendOrigin) {
        return new Response("Forbidden: url must point to the backend", { status: 403 });
    }

    let upstream: Response;
    try {
        upstream = await fetch(url);
    } catch {
        return new Response("Failed to fetch file from backend", { status: 502 });
    }

    if (!upstream.ok) {
        return new Response("File not found", { status: upstream.status });
    }

    // Forward content-type and content-length, but strip headers that would
    // block the browser from rendering the file inside an iframe.
    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("content-length", contentLength);

    // Allow iframes from same origin (the Next.js app itself).
    headers.set("x-frame-options", "SAMEORIGIN");
    // Instruct the browser not to cache sensitive invoice files.
    headers.set("cache-control", "private, no-store");

    return new Response(upstream.body, { status: 200, headers });
}
