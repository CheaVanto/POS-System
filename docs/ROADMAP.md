# Delivery Roadmap

The spec covers 40 modules — a multi-quarter product. We build it in runnable phases; every phase
compiles, migrates, and serves real requests. Nothing ships as a stub.

## Phase 1 — Core POS vertical  ← current
- [x] Monorepo + Docker (Postgres, Redis)
- [x] Multi-tenant Prisma schema (company → branch → store → terminal)
- [x] RBAC data model (roles, permissions, user-roles)
- [x] Auth: register, login, JWT access + rotating refresh, logout, `/me`
- [x] Guards: JwtAuthGuard (global) + RolesGuard + `@Public` / `@Roles` / `@Permissions`
- [x] Catalog: categories, brands, units, products + variants
- [x] Inventory: warehouses, stock levels, stock adjustments, transaction ledger
- [x] Customers
- [x] Sales: cart → order → stock decrement → payment → receipt totals (the POS transaction)
- [x] Payments: cash / card / QR split payments, change calc
- [x] Audit log + soft delete + global exception filter
- [x] OpenAPI/Swagger at `/api/docs`
- [ ] Seed data

## Phase 1b — Cashier POS + Admin (Nuxt 3)
Touchscreen cashier grid, cart, split-pay modal, receipt; admin CRUD for catalog/inventory; Pinia stores; PWA shell.

## Phase 2 — Operations depth
Purchase orders & suppliers · stock transfers/receiving/cycle count · promotions/coupons/gift cards ·
loyalty & wallet · realtime dashboard (Socket.io) · BullMQ jobs · reports & analytics.

## Phase 3 — Finance & people
Accounting (COA, journal, ledger, statements) · expenses · HR/payroll · commissions.

## Phase 4 — Reach & intelligence
Offline sync (IndexedDB + conflict resolution) · mobile POS · customer & supplier portals ·
CRM/marketing · AI (forecasting, reorder, recommendations, OCR) · integrations (Stripe/ABA/KHQR/QuickBooks).

## Cross-cutting (hardened continuously)
Testing (unit/integration/e2e) · CI/CD (GitHub Actions) · security review · perf · i18n · multi-currency.
