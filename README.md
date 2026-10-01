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
