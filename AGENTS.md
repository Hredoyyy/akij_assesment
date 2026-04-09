<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
## Tech Stack (Mandatory)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + ShadCN UI
- **Authentication**: **iron-session** (cookie-based sessions) + **bcrypt** (password hashing)
- **Database**: PostgreSQL (Local for testing, Neon/Supabase for production)
- **ORM**: Prisma
- **State Management (Client)**: Zustand (UI state, draft forms)
- **State Management (Server)**: React Query (@tanstack/react-query)
- **Forms & Validation**: React Hook Form + Zod
- **API Requests**: Axios

---

## Technical & Business Rules
1. **No Mock APIs**: All data must be persisted in the database.
2. **In-House Authentication**: 
   - Hash passwords with `bcrypt` before storing. 
   - Manage sessions securely using `iron-session` (stateless encrypted HTTP-only cookies).
   - Use Next.js Middleware named `proxy.ts` (instead of `middleware.ts`) to read the iron session and protect route groups `(employer)` and `(candidate)`.
3. **Roles**: `EMPLOYER` and `CANDIDATE`. New sign-ups default to `CANDIDATE`. Employers can be promoted manually in the DB.
4. **Protected Route Groups**: Unauthorized access must redirect properly to `/sign-in`.
5. **No Sidebar**: Top navigation bar only.

---

## Clean Architecture Standards

### 1. Actions Layer (`actions/`)
Business logic and database calls are decoupled from API routes and placed in highly organized domain-specific folders.

**Structure per Action:**
`actions/[Domain]/[ActionName]/logic.ts`
`actions/[Domain]/[ActionName]/schema.ts`

**Rules for `logic.ts`:**
- Connects directly to Prisma.
- **NO `try/catch` blocks inside logic files**. 
- Functions must ALWAYS return a **Result Type Object** rather than throwing raw errors to the handler.
  - Success: `{ success: true, data: T }`
  - Failure: `{ success: false, error: string }`

**Rules for `schema.ts`:**
- Contains the exact Zod schema for the payload or query parameters required by the action.

### 2. API Routes Layer (`app/api/`)
API Route Handlers (`route.ts`) act as thin controllers. 
- They parse inputs using `schema.ts`.
- They execute DB calls by importing `logic.ts`.
- **All `try/catch` error boundaries happen here**.
- Errors must be safely caught. Raw database logs or stack traces must **never** be surfaced to the end user. Return safe `{ error: "Generic custom message" }` JSON payloads on failure.

### 3. Component Structure
Components must be highly reusable and structured by context/page name.
**Format:** `components/[PageOrContextName]/[ComponentName]/[ComponentName].tsx`

*Examples:*
- `components/Dashboard/ExamCard/ExamCard.tsx`
- `components/Dashboard/ExamCard/ExamCard.css` (if needed)

---
<!-- END:nextjs-agent-rules -->
