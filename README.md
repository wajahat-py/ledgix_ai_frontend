# Ledgix — Frontend

Next.js 16 frontend for Ledgix, an AI-powered invoice processing platform. Handles authentication, real-time invoice status updates, approval workflows, and accounting system exports.

## Stack

| | |
|---|---|
| **Framework** | Next.js 16.2 (App Router, standalone output) |
| **Language** | TypeScript 5, strict mode |
| **Runtime** | React 19 |
| **Auth** | NextAuth.js 4 — JWT strategy, Google OAuth + credentials |
| **Styling** | Tailwind CSS 4 via PostCSS |
| **Animation** | Framer Motion 12 |
| **HTTP** | Axios with JWT interceptor and auto-refresh |
| **Real-time** | Native WebSocket (shared connection via context) |
| **Exports** | jsPDF, jspdf-autotable, XLSX |
| **Notifications** | Sonner |
| **Billing** | Stripe.js |

## Prerequisites

- Node.js 20+
- A running instance of the backend API (see `ledgix_ai_backend`)

## Local Setup

```bash
npm install
cp .env.local.example .env.local  # then fill in values
npm run dev
```

The dev server starts on `http://localhost:3000`. Builds use webpack (`--webpack` is set in `package.json`).

## Environment Variables

Create `.env.local` at the project root. None of these have defaults that work out of the box.

```bash
# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000   # used in the browser
BACKEND_INTERNAL_URL=http://localhost:8000      # server-side only (media proxy)

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000     # omit in production
NEXTAUTH_SECRET=                                # openssl rand -base64 32

# Google OAuth (sign-in — separate credentials from the Gmail integration)
GOOGLE_CLIENT_ID_AUTH=
GOOGLE_CLIENT_SECRET_AUTH=

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENABLE_WS=true

# Stripe (required if billing is enabled)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Demo account (optional)
NEXT_PUBLIC_DEMO_EMAIL=
NEXT_PUBLIC_DEMO_PASSWORD=
```

> **`NEXTAUTH_URL` vs `NEXTAUTH_URL_INTERNAL`** — In production behind a reverse proxy, set `NEXTAUTH_URL` to the public-facing URL and omit `NEXTAUTH_URL_INTERNAL`. Locally they should be the same value.

> **Google credentials** — `GOOGLE_CLIENT_ID_AUTH` / `GOOGLE_CLIENT_SECRET_AUTH` are sign-in credentials. They are separate from the Gmail OAuth client configured on the backend, which requires different scopes. If you're setting up from scratch, you need two OAuth clients in Google Cloud Console.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   └── media-proxy/          # Same-origin proxy for invoice files (PDFs/images)
│   │
│   ├── invoices/
│   │   ├── page.tsx              # Invoice list with status filtering
│   │   ├── [id]/page.tsx         # Detail: side-by-side file preview + extracted fields
│   │   └── approval-queue/       # Pending approvals
│   │
│   ├── upload/                   # Drag-and-drop / file picker intake
│   ├── email/                    # Gmail integration management
│   ├── dashboard/                # Spending trends and metrics
│   ├── billing/                  # Stripe checkout and post-payment confirmation
│   ├── settings/
│   │   ├── workspace/            # Plan info, billing portal link
│   │   └── team/                 # Member list, role management, invitations
│   │
│   └── (auth routes)             # Login, register, password reset, email verify, invite
│
├── components/
│   ├── Providers.tsx             # Root context wrapper (auth, org, socket)
│   ├── SocketProvider.tsx        # Singleton WebSocket — one connection per session
│   ├── Sidebar.tsx / AppHeader.tsx
│   └── PaymentGuard.tsx          # Blocks actions when usage limit is reached
│
├── hooks/
│   ├── useInvoiceSocket.ts       # Invoice status updates over WebSocket
│   ├── useNotifications.ts       # Notification feed
│   └── useUsage.ts               # Monthly invoice quota
│
├── lib/
│   ├── auth.ts                   # NextAuth configuration: providers, JWT callbacks, refresh
│   ├── org-context.tsx           # Organization state and role-derived permissions
│   ├── invoice-export.ts         # Export: CSV, Excel, PDF, QuickBooks IIF, Xero CSV
│   └── token-store.ts / org-store.ts   # In-memory stores (avoids localStorage XSS surface)
│
├── services/
│   └── api.ts                    # Axios instance: base URL, auth headers, 401 refresh
│
└── types/                        # Shared TypeScript interfaces
```

## Auth

Authentication is managed by NextAuth with a **JWT session strategy** — no server-side session database. Two providers are configured:

- **Google OAuth** — Exchanges the Google ID token with the backend (`POST /api/auth/google/`) to receive a Django JWT pair. The backend is the source of truth for user accounts.
- **Credentials** — Email/password against `POST /api/auth/login/`.

Tokens live in NextAuth's encrypted cookie. The `jwt()` callback handles proactive refresh: access tokens are renewed 5 minutes before expiry via `POST /api/auth/token/refresh/`. If refresh fails, `token.error = "RefreshAccessTokenError"` is propagated to the client so it can force a sign-out.

Route protection is in `src/proxy.ts` (Next.js middleware). Protected paths: `/dashboard`, `/invoices`, `/upload`, `/email`, `/profile`, `/settings`. Unauthenticated requests redirect to `/login?callbackUrl=...`. Already-authenticated users hitting auth pages are redirected to `/dashboard`.

## Media Proxy

Invoice files are served through `/api/media-proxy` rather than directly from the backend. This keeps file requests same-origin, letting the browser render PDFs in `<iframe>` without CORS or mixed-content issues. The proxy also supports `Range` requests for partial downloads.

It validates that the target URL belongs to a whitelisted backend origin and that the path starts with `/media/`. It is not a general-purpose proxy.

On mobile browsers (which cannot render PDFs inside iframes), the file preview component detects touch-primary devices via `matchMedia("(pointer: coarse)")` and renders a tap-to-open button instead.

## WebSocket

A single persistent WebSocket connection is established per authenticated session via `SocketProvider` and shared across the app. Components subscribe through `useAppSocket` or the higher-level `useInvoiceSocket`.

Messages use a `_type` discriminator (`"invoice"` or `"notification"`). The connection reconnects with exponential backoff up to 30 seconds. Close code `4001` is treated as intentional server-side termination and suppresses reconnection.

## Building for Production

```bash
npm run build   # outputs to .next/standalone
npm start
```

`output: "standalone"` in `next.config.ts` produces a self-contained server bundle. To containerize:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Linting

```bash
npm run lint
```

> TypeScript build errors are currently non-fatal (`ignoreBuildErrors: true` in `next.config.ts`). This should be removed before the project goes to production.
