# Enterprise POS System

A modular, multi-tenant, cloud-ready Point of Sale platform (Square / Shopify POS / Loyverse class),
built to scale from a single shop to enterprise retail chains.

> **Status:** Phase 1 — core POS vertical (auth · RBAC · multi-tenant · catalog · inventory · sales · payments).
> This is a real, runnable foundation. Subsequent phases extend it module by module. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Monorepo layout

```
pos-system/
├─ apps/
│  ├─ api/            # NestJS + Prisma backend (REST, JWT, RBAC, multi-tenant)
│  └─ web/            # Nuxt 3 admin + cashier POS (added in Phase 1b)
├─ docs/              # Architecture, ERD, roadmap, API notes
├─ docker-compose.yml # Postgres + Redis + API (local dev / staging)
└─ .env.example
```

## Tech stack

| Layer      | Choice                                                    |
|------------|-----------------------------------------------------------|
| Backend    | Node 20 · NestJS 10 · TypeScript · Prisma 5               |
| Database   | PostgreSQL 16 (multi-tenant, row-level `companyId`)       |
| Auth       | JWT access + rotating refresh tokens · RBAC (role/perm)   |
| Cache/Queue| Redis 7 · BullMQ (jobs, added Phase 2)                    |
| Realtime   | Socket.io (added Phase 2)                                 |
| Frontend   | Nuxt 3 · Vue 3 · Pinia · Tailwind · PWA/offline (Phase 1b)|
| Infra      | Docker · Docker Compose · NGINX · GitHub Actions          |

## Quick start (backend)

```bash
cd pos-system
cp .env.example .env
docker compose up -d postgres redis      # start datastores
cd apps/api
npm install
npx prisma migrate dev --name init        # create schema
npm run seed                              # demo company, admin, products
npm run start:dev                         # http://localhost:4000/api, docs at /api/docs
```

> API runs on **:4000** and the web app on **:3001** (port 3000 is intentionally avoided to prevent
> collisions with other local Nuxt dev servers).

Default seeded login: `admin@demo.pos` / `Admin123!`

## Design principles

- **Clean Architecture / DDD-lite** — modules own their domain; controllers are thin, services hold logic, Prisma is the repository boundary.
- **Multi-tenant by construction** — every business row carries `companyId`; queries are tenant-scoped via the authenticated principal.
- **Secure by default** — Helmet, CORS allowlist, validation pipe, bcrypt, JWT rotation, RBAC guard, audit log.
- **Everything that ships, runs** — no stub modules; each phase is end-to-end functional.
