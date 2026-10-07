# Sample Order Service

A deliberately small order service, used only to exercise the PR QA review skills in this repository. It has no external dependencies.

```bash
cd sample-app
npm test     # node --test
npm start    # http://localhost:3000
```

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Liveness check |
| POST | `/api/login` | none | `{ "username": "sam" \| "maria" \| "ada" }` → `{ token }` (demo only) |
| GET | `/api/orders/:id` | any user | Order with `subtotal`, `discount`, `tax`, `total` (dollars) |
| POST | `/api/orders/:id/discount` | sales, manager, admin | `{ "discountPct": 0-50 }` |
| POST | `/api/orders/:id/checkout` | any user | Marks an open order paid |

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DATA_FILE` | `:memory:` | JSON data file path |
| `TAX_RATE` | `0.07` | Sales tax rate |
| `AUTH_SECRET` | `dev-only-secret` | Token signing secret |
