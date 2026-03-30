# Elite Finance Backend

Backend API server untuk **Elite Finance Tracker** — personal finance management app.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js v5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod
- **Auth**: Session-based (cookie + bearer token)
- **Docs**: Swagger UI (`/api-docs`)
- **Build**: esbuild
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL instance

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and PORT

# Push database schema
pnpm run db:push

# Build
pnpm run build

# Run
pnpm run start
```

### Development

```bash
pnpm run build && pnpm run dev
```

### API Documentation

Setelah server berjalan, buka **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)** untuk Swagger UI.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/healthz` | ❌ | Health check |
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/user` | ❌ | Get current user |
| GET | `/api/transactions` | ✅ | List transactions |
| POST | `/api/transactions` | ✅ | Create transaction |
| GET | `/api/transactions/:id` | ✅ | Get transaction |
| PATCH | `/api/transactions/:id` | ✅ | Update transaction |
| DELETE | `/api/transactions/:id` | ✅ | Delete transaction |
| GET | `/api/categories` | ✅ | List categories |
| POST | `/api/categories` | ✅ | Create category |
| PATCH | `/api/categories/:id` | ✅ | Update category |
| DELETE | `/api/categories/:id` | ✅ | Delete category |
| GET | `/api/analytics/monthly-summary` | ✅ | Monthly summary |
| GET | `/api/analytics/spending-by-category` | ✅ | Spending breakdown |
| GET | `/api/analytics/monthly-trend` | ✅ | Monthly trend |
| GET | `/api/assets` | ✅ | List assets |
| POST | `/api/assets` | ✅ | Create asset |
| PATCH | `/api/assets/:id` | ✅ | Update asset |
| DELETE | `/api/assets/:id` | ✅ | Delete asset |
| GET | `/api/assets/net-worth-history` | ✅ | Net worth history |
| POST | `/api/import/parse` | ✅ | Parse CSV/text |
| POST | `/api/import/confirm` | ✅ | Confirm import |
| POST | `/api/receipt/scan` | ✅ | Scan receipt (WIP) |
| POST | `/api/receipt/confirm` | ✅ | Confirm receipt (WIP) |

## Project Structure

```
elite-finance-backend/
├── src/
│   ├── app.ts                  # Express app setup
│   ├── index.ts                # Server entry point
│   ├── swagger.ts              # Swagger UI config
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   ├── repositories/           # Database queries
│   ├── routes/                 # Route definitions
│   ├── middlewares/            # Auth middleware
│   ├── lib/                    # Auth helpers, logger
│   ├── db/                     # Drizzle connection & schema
│   ├── validation/             # Zod schemas (generated)
│   └── integrations/openai/    # OpenAI integration
├── test/                       # Unit tests
├── build.mjs                   # esbuild config
├── drizzle.config.ts           # Drizzle Kit config
├── tsconfig.json
├── package.json
└── .env.example
```
