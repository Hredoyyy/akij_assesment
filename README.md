# Online Assessment Platform

A full-stack online assessment platform with two role-based panels:
- Employer Panel
- Candidate Panel

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma + PostgreSQL, Zustand, React Hook Form + Zod, and Axios.
Repository structure: `src/app` (routes/pages), `src/actions` (domain logic), `src/components` (UI), `src/stores` (Zustand state).
Shared contracts/utilities: `src/types` (grouped types), `src/lib` (reusable helpers), `prisma` (schema + migrations).

## Live Demo And Recording

- Live Demo: https://akij-assesment.vercel.app/
- Video Walkthrough: [Video Demo](https://www.loom.com/share/d1541247337b42a39f8a161ad511c09f)

## Repository Highlights

- In-house authentication with hashed passwords and session cookies (iron-session)
- Employer-side exam creation with multi-step flow and question-set management
- Candidate-side timed exam runtime with manual submit and auto-submit on timeout
- Behavior tracking with violations and forced submission at 3 violations
- Offline-friendly answer drafts (local storage), then sync on submit
- Employer candidate ranking + text-answer grading workflow

## Extra Features Added Beyond Core Prompt

These are additional enhancements implemented on top of the baseline requirements:

- Candidate exam UI redesigned to match a cohesive visual design language
- Final review screen redesigned to match answering screen style
- Robust forced-submit flow that saves current answers before terminal statuses
- Employer ranking dialog upgraded with:
	- Submission method column (manual / timeout / violation)
	- Violation count column
	- Grade text answers action
	- Graded/Ungraded/All filters
	- Graded action state with disabled green check button
- Candidate start confirmation modal explaining violation policy before exam begins
- Fullscreen gate during exam runtime (required to continue), with fullscreen exit tracked as violation

## Requirement Coverage

### Employer Panel

1. Login Page
- Implemented with email/password
- Session-backed auth and role-aware redirect

2. Dashboard (Online Tests List)
- Exam cards include:
	- Exam Name
	- Candidates
	- Question Sets
	- Exam Slots
	- View Candidates button

3. Create Online Test (Multi-Step Form)
- Step 1 (Basic Info)
	- Title
	- Total Candidates
	- Total Slots
	- Duration
	- Negative marking
	- Slot Start/End
- Step 2 (Question Sets)
	- Add/Edit/Delete questions
	- Question types: Checkbox, Radio, Text
	- Option-level correctness for objective questions

### Candidate Panel

1. Login Page
- Implemented with email/password and session-based auth

2. Dashboard
- Exam cards include:
	- Duration
	- Questions
	- Negative marking
	- Start/Resume action
- Slot times display both start and end date-time

3. Exam Screen
- Question rendering for Checkbox / Radio / Text
- Countdown timer
- Auto-submit on timeout
- Manual submit
- Behavioral tracking:
	- Tab/app switch
	- Window blur
	- Fullscreen exit
- Violation policy:
	- 3 violations => forced termination and submission

## Tech Stack Mapping

- Framework: Next.js + React
- State Management: Zustand (exam creation flow)
- Forms: React Hook Form
- Validation: Zod
- UI/Styling: Tailwind CSS + reusable UI primitives
- API Handling: Axios
- Backend/API (bonus): Implemented with Next.js route handlers + Prisma + PostgreSQL

## Architecture Notes

- Clean architecture style:
	- `actions/Domain/ActionName/logic.ts`
	- `actions/Domain/ActionName/schema.ts`
- API routes are thin controllers with `try/catch`
- Business logic in actions returns structured result objects
- Prisma transaction usage for complex writes (exam + slots + questions)

## Setup Instructions

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables in `.env`

Required:
- `DATABASE_URL`
- `SESSION_PASSWORD` (minimum 32 characters)

3. Run Prisma migrations

```bash
pnpm db:migrate
```

4. Generate Prisma client

```bash
pnpm db:generate
```

5. Start development server

```bash
pnpm dev
```

## Useful Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm check
pnpm db:migrate
pnpm db:generate
pnpm db:studio
```

## Deployment (Vercel)

The project is configured for Vercel deployment with Prisma:

- `vercel-build` runs:
	- `prisma migrate deploy`
	- `prisma generate`
	- `next build`
- `postinstall` runs `prisma generate`

Ensure production environment includes:
- `DATABASE_URL`
- `SESSION_PASSWORD`

## Additional Questions

### 1. MCP Integration

I have not directly used MCP in this app yet.

How MCP can be used here:
- Figma MCP: sync spacing/typography/tokens from design files into implementation tasks
- Chrome DevTools MCP: automate visual regression checks on candidate runtime and dialog workflows
- Supabase/DB MCP: inspect attempt/answer records during QA for grading and violation flows

### 2. AI Tools For Development

Tools/processes used:
- GitHub Copilot for in-editor code completion and refactoring (Opus4.6 and GPT 5.3 Codex)
- Chat-based AI assistants for architecture planning and debugging race conditions
- Prompt-driven test checklist generation for critical paths (timeout/violation/forced submit)

Workflow:
- Generate scaffold and repetitive boilerplate with AI
- Manually verify business rules and edge cases
- Run lint/typecheck and execute scenario testing after each major change

### 3. Offline Mode Strategy

If a candidate loses internet during an exam:

- Keep an in-memory + local-storage answer draft cache keyed by attempt ID
- Continue allowing local answer edits while offline
- Prevent final submission while offline and show clear status message
- On reconnect:
	- Sync draft answers to server (batch save)
	- Allow final submit after successful sync
- Keep server as source of truth for timer/termination status

## Notes For Reviewer

- This submission includes backend/API integration (bonus scope)
- Candidate and employer flows are both implemented with role-based protection
