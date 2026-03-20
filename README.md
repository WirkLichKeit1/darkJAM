# darkJAM

Frontend for an anime streaming platform. Built with Next.js 16 using the App Router, with a custom video player, admin panel, and full watch history tracking.

## Tech stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + CSS variables for theming
- **Axios** for API requests with automatic JWT injection
- **js-cookie** for token storage
- **`proxy.ts`** for edge-level route protection

## Requirements

- Node.js 18+
- npm, yarn, or pnpm
- A running instance of [anime-api](../anime-api) (the backend)

## Environment variables

Create a `.env.local` file in the project root:

```env
# Used server-side only — by Route Handlers and Server Components
# Not bundled into the client
API_URL=http://localhost:8080

# Used client-side by Axios (lib/api.ts)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

In development both variables point to the same address. In production on Vercel, add both as Environment Variables in the project settings. `API_URL` is never exposed to the browser.

## Running locally

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for production

```bash
npm run build
npm run start
```

## Project structure

```
src/
├── app/
│   ├── (admin)/admin/      # Admin panel (Server Component layout with role check)
│   │   ├── layout.tsx      # Auth guard — redirects non-admins server-side
│   │   ├── AdminShell.tsx  # Sidebar and layout shell (client component)
│   │   ├── page.tsx        # Dashboard with stats
│   │   └── animes/         # Anime and episode CRUD
│   ├── (auth)/             # Login and registration pages
│   ├── (main)/             # Public-facing pages
│   │   ├── animes/         # Anime listing, detail, and watch pages
│   │   ├── favorites/      # User favorites
│   │   └── history/        # Watch history
│   └── api/
│       └── stream/[episodeId]/
│           └── route.ts    # Server-side proxy for video streaming
├── components/
│   ├── anime/              # AnimeCard, AnimeFilters
│   ├── layout/             # Navbar, Footer
│   ├── player/             # VideoPlayer
│   └── ui/                 # Button, Input, Badge, Skeleton
├── lib/
│   ├── api.ts              # Axios instance and typed API functions
│   ├── auth.ts             # Cookie-based token storage
│   └── hooks/
│       ├── useAuth.ts      # Login, register, logout
│       └── useWatchProgress.ts  # Periodic progress saving + sendBeacon on unload
├── proxy.ts                # Edge middleware for route protection
└── types/
    └── api.ts              # TypeScript types for all API contracts
```

## Authentication flow

After login, the JWT is stored in a cookie via `js-cookie`. The `proxy.ts` middleware runs at the edge and redirects unauthenticated requests to `/login` based on cookie presence.

Admin route protection happens at two levels:

1. **`proxy.ts`** — fast cookie check at the edge, redirects if no token is found
2. **`src/app/(admin)/admin/layout.tsx`** — Server Component that reads the `user` cookie, parses the role, and calls `redirect()` before rendering anything if the role is not `ADMIN`

This ensures that even if someone manually crafts a cookie with a token, the layout will catch a missing or invalid role on the server before any admin UI is sent to the client.

## Video streaming

Videos are not fetched directly from the backend by the browser. Instead, the player points its `src` to `/api/stream/[episodeId]`, which is a Next.js Route Handler that:

1. Reads the JWT from the server-side cookie
2. Forwards the request to the backend with an `Authorization` header
3. Passes through `Range` headers for seek support
4. Streams the response body directly without buffering it in memory

This keeps the JWT out of client-side JavaScript entirely and allows streaming files of any size without loading them into the browser's memory.

## Watch progress

The `useWatchProgress` hook saves playback progress to the backend every 10 seconds during playback. When the user navigates away or closes the tab, a final save is sent using `navigator.sendBeacon` to ensure the request completes even as the page unloads.

Progress is only saved for authenticated users. Unauthenticated playback works but progress is not persisted.

## Admin panel

The admin panel is accessible at `/admin`. Only users with the `ADMIN` role can access it — others are redirected to the home page.

Features:
- Dashboard with anime and status counts
- Anime CRUD with cover and banner image upload
- Episode CRUD with video and thumbnail upload
- Video status tracking (Processing / Ready / Error)
- Draft and published states for episodes

## Deployment (Vercel)

1. Connect the repository to a Vercel project
2. Add environment variables in **Settings → Environment Variables**:
   - `API_URL` — internal URL of the backend (e.g. `https://your-backend.onrender.com`)
   - `NEXT_PUBLIC_API_URL` — same value, exposed to the browser for Axios
3. Deploy

The `proxy.ts` file is automatically picked up by Next.js 16 as the edge middleware entry point.

## Linting

```bash
npm run lint
```

ESLint is configured with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
