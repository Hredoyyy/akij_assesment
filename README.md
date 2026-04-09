# Online Assessment Platform

Next.js 16 + TypeScript + Tailwind CSS v4 + Prisma 7 blueprint with clean architecture and in-house auth.

## Milestones

1. Foundation and Auth Backend
- Prisma 7 schema + adapter-ready client setup
- Auth actions and API routes (`sign-up`, `sign-in`, `sign-out`)
- Session utilities using iron-session
- Route protection baseline via `proxy.ts`

2. Auth UI and Shared Layout
- Sign-in/sign-up pages with React Hook Form + Zod
- Shared top navigation (no sidebar)
- Role-aware redirects after sign-in

3. Employer Exam Creation
- Multi-step exam creation UI
- Zustand draft state
- Transactional persistence for exam + slots + questions + options

4. Candidate Exam Runtime
- Start attempt and progressive answer persistence
- Server-backed timer with timeout submit
- Behavior tracking and violation termination
- Offline local queue + reconnect sync

5. Hardening and Delivery
- E2E and integration tests
- Error telemetry, loading states, and UX polish
- Deployment configuration for Neon/Supabase

## Current Status

- Milestone 1 completed.
- Milestone 2 in progress (auth forms + role-aware redirect baseline added).

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment template and configure values:

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
pnpm db:generate
```

4. Run migrations:

```bash
pnpm db:migrate
```

5. Start app:

```bash
pnpm dev
```
