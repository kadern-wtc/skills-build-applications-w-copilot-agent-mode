# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use the shared API client and relative `/api` paths. Keep views responsible for rendering API data and accessible loading, empty, and error states; keep business rules in the backend.
- Logic tier decision: Keep HTTP input validation and response codes in Express routes, and put persistence and domain behavior in the service layer. Return deliberate 4xx responses for invalid input and missing users rather than exposing database cast errors.
- Data tier decision: Use Mongoose schemas to enforce required fields and model references. Keep seed data representative of all four capabilities and safe to run repeatedly.
- Activity tracking approach: Validate activity fields and verify that the supplied user and team IDs are well-formed and refer to existing records. Store the activity with server-computed points and an occurrence time.
- Team management approach: Require a team name and mascot, default members to an empty array, and support creating and listing teams with their members.
- Leaderboard approach: Sum activity points by team, order teams from highest total to lowest, and return each team's name, total points, and 1-based rank.
- Workout suggestions approach: Find the user by email and use their goal or recent activity to choose a relevant suggestion. Include a reason for the first suggestion and return a deliberate 4xx response when no user matches.

## Test plan

Run the focused contract tests in dependency order, then run both builds. A failing contract test indicates a mismatch with the documented behavior; a failing build indicates a compile, type, or bundling problem.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks model validation, references, and seed behavior. Failures point to missing schema constraints or seed regressions.
- Logic tier: `npm run test:api --prefix octofit-tracker/backend` checks request validation, persistence, leaderboard totals and ranks, and user-specific workout suggestions. Failures point to route or service behavior that violates the API contract.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` checks API-driven rendering, workout requests, and accessible loading, empty, and error states. Failures point to view behavior or API-client integration.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript compilation; failures indicate backend type or compile errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript and the Vite production bundle; failures indicate type or bundling errors.

Baseline before implementation: the data suite had 4 failures and 1 passing seed test, the API suite had 4 failures, and the frontend suite had 15 failures. The builds have not been run as part of this baseline.
