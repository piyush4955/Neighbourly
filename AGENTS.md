# Neighborly — Agent Instructions

## Project
Hyperlocal tool/skill sharing app. No payments. Full spec below.

## Folder structure — do not deviate or invent new top-level folders without asking
src/config, src/controllers, src/docs, src/middlewares, src/models,
src/routes, src/seed, src/services, src/uploads, src/utils

- controllers: thin, parse request + call service, no business logic
- services: business logic lives here (geo queries, state machine, review rules,
  location blurring)
- models: DB schema/ORM models only
- middlewares: auth, validation
- sockets: real-time messaging (create this folder when we reach that step)

## Stack
- Backend: Node.js + Express
- DB: PostgreSQL + PostGIS extension
- Real-time: Socket.io
- Auth: JWT (email/password to start; OAuth optional stretch)
- Frontend: React + Mapbox GL JS (built after backend API is stable)

## Non-negotiable rules
1. Exact user coordinates must NEVER be sent to the client in any API response.
   All location data returned to clients must go through a single blurring
   function in services/location.service.js (rounding or jitter — pick one,
   document the choice in a comment). This must be enforced server-side, not
   hidden in the frontend.
2. Request status transitions (pending -> accepted/declined -> completed) must
   be enforced by a guarded state machine in services/, not by allowing the
   client to set status directly. Reject invalid transitions with a 400.
3. Reviews: one review per completed request per reviewer, enforced with a
   DB-level unique constraint (not just app-level checks). Block self-review
   in the API layer. Reviews only unlock after a request reaches "completed".
4. Every new feature should include basic error handling and input validation
   before being considered done.

## Data model (reference — see full spec for details)
User: id, name, bio, approx_location (lat/lng, rounded), created_at, avg_rating
Listing: id, owner_id, type (tool|skill), title, description, category,
  photo_url, is_active, created_at
Request: id, listing_id, requester_id, status, created_at, updated_at
Review: id, request_id, reviewer_id, reviewee_id, rating, comment, created_at

## Working style
- Use Planning Mode for anything touching the data model, auth, or the three
  non-negotiable rules above. Fast Mode is fine for small isolated fixes.
- After each feature, tell me what you built and how to test it manually
  (curl commands or steps) before marking it done.
- Before writing or modifying any code, always present a full implementation
  plan (files to be created/changed, approach, key decisions) and wait for my
  explicit approval before executing. This applies to every task in this
  project, not just complex ones.
- After each feature, tell me what you built and how to test it manually
  (curl commands or steps) before marking it done.

## Project Status (as of [today's date])
Completed and tested: auth, listings CRUD, geolocation search, request
workflow (state machine), contact-reveal on accepted requests (email only,
no real-time messaging — deferred to post-MVP).
Currently working on: Step 8 — reviews/reputation.
Deferred: real user location input (geocoding) — planned for right before
frontend work (Step 10), not yet started. Users currently have
approxLocation: null.
Not started: privacy audit pass, frontend.