# GO Mission

A bilingual Arabic/English classroom communication game. A host runs timed missions while two teams join with three complementary roles.

## Features
- Host dashboard, player roles, team scores and timed rounds.
- Curated bilingual missions with three difficulty levels.
- Developer profile links and responsive interface.

## Run locally
Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. No AI API key is required.

## Validation
```sh
npm run lint
npm run build
```

## Deployment
The frontend and Express API deploy together on Vercel. Shared game state is stored in Upstash Redis, with atomic write locking and request-scoped state. The round clock uses an absolute deadline, so it survives function cold starts.

Connect the free Upstash for Redis integration to the Vercel project. It supplies `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. Disable automatic plan upgrades. Local development can use in-memory state; production requires Redis and returns a clear error if storage is missing.

The current prototype has one shared classroom game. A host controls the public game; separate rooms and host authentication are not implemented. Game state expires after 24 hours of inactivity.

Developer: [Gheid Abdulkarim](https://github.com/iamghaid).

## Interface and gameplay
The landing page explains the observer, messenger and performer roles and offers direct entry to the host dashboard, player join view and class display. Players choose one of six team slots. The host chooses a difficulty level, creates a mission, starts timed turns and tracks scores. Technical missions include a shared drawing stream and a solution grid; physical missions can be scored by the host.

The interface supports Arabic and English, responsive phone and classroom layouts, locally hosted sound effects, and saved light/dark preferences. All game panels follow the selected theme. The transparent logo adapts its colors in dark mode. Subtle entry, card and role-flow animations respect reduced-motion preferences.

## Stack and live links
- React, TypeScript, Tailwind CSS and Lucide icons.
- Node.js and Express for the API; Upstash Redis for shared production state.
- Vite and esbuild for builds; GitHub and Vercel for source and deployment.
- Live: https://go-mission.vercel.app/
- Source: https://github.com/iamghaid/GO-mission-game-

## Reliability checks
Run `node --import tsx --test tests/migration.test.ts` to check concurrent role updates, deadline expiration, invalid grid/scoring requests and storage failures. Live storage writes and reads were also verified after connecting Redis.

New visitors start in English with dark mode. Language and theme changes are saved locally for subsequent visits.
