# Architecture

## Tenancy model

```
Company (tenant root, currency/timezone/tax)
  └─ Branch (a physical location / outlet)
       └─ Store (a sales area within a branch; owns terminals & default warehouse)
            └─ Terminal (a POS register/device)
Warehouse ── stock lives here; a Store points at a default Warehouse for sales fulfilment.
```

Every business entity carries `companyId`. The authenticated principal (`req.user`) supplies the
active `companyId`; services scope all reads/writes to it. This keeps isolation simple and enforceable
without Postgres RLS in Phase 1 (RLS can be layered in Phase 3 for defence-in-depth).

## Request lifecycle

```
HTTP → Helmet/CORS → ValidationPipe → JwtAuthGuard (global, unless @Public)
     → RolesGuard (@Roles/@Permissions) → Controller → Service (domain logic, tx)
     → PrismaService (repository boundary) → PostgreSQL
Errors → AllExceptionsFilter (uniform JSON envelope + audit for mutations)
```

## The sales transaction (heart of the POS)

`SalesService.checkout()` runs inside a single Prisma `$transaction`:

1. Load & lock the order (or build from an incoming cart) scoped to `companyId`.
2. For each line: resolve product/variant, snapshot price, compute line total, tax, discount.
3. Decrement inventory for the fulfilling warehouse; write a `StockTransaction` (kind=`SALE`).
4. Compute order totals (subtotal, discount, tax, service charge, tip, grand total).
5. Apply payments (one or many — split pay); compute change/balance; set order status.
6. Emit an audit log entry. Return the receipt-ready order.

Everything commits together or rolls back — no oversold stock, no orphan payments.

## Money

All monetary values are stored as **integer minor units** (e.g. cents) in `BigInt`/`Int` columns to
avoid float drift. Currency is per-company. A `Money` helper centralises rounding.

## Auth

- Access token: short-lived JWT (`sub`, `companyId`, `roles`).
- Refresh token: opaque, hashed at rest, rotated on every use, revocable per-session (device mgmt).
- Passwords: bcrypt (cost 12). Password policy enforced at DTO validation.
