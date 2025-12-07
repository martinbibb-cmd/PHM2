# Project Hail Mary (PHM)

A modern, production-ready **heating industry CRM and surveying platform** built with TypeScript, React, and Hono.js.

## Features

- 🔐 Secure JWT authentication with refresh tokens
- 👥 Customer management with comprehensive profiles
- 📈 Lead pipeline and tracking
- 💰 Quote builder with line items and pricing
- 📦 Product catalog management
- 📅 Appointment scheduling
- 🎙️ Voice-powered surveying (Phase 2)
- 🏗️ Multi-trade support (heating, heat pumps, solar, EV chargers)
- 🔄 Real-time sync and offline support
- 🐳 Docker-ready deployment

## Tech Stack

### Backend
- **Hono.js** - Ultra-fast web framework
- **PostgreSQL 17** - Reliable database
- **Drizzle ORM** - Type-safe database access
- **JWT** - Secure authentication
- **Zod** - Runtime validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Data fetching & caching
- **Radix UI** - Accessible components
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management

### Infrastructure
- **Docker** - Containerization
- **PostgreSQL** - Database
- **Nginx** - Web server

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (for containerized deployment)

### Development Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd PHM2
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required environment variables:**
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)

4. **Start PostgreSQL**

```bash
docker run -d \
  --name phm-postgres \
  -e POSTGRES_DB=phm \
  -e POSTGRES_USER=phm \
  -e POSTGRES_PASSWORD=your-password \
  -p 5432:5432 \
  postgres:17-alpine
```

5. **Run database migrations**

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

6. **Start development servers**

```bash
npm run dev
```

This will start:
- API server at http://localhost:3001
- Web app at http://localhost:5173

7. **Login to the app**

Default credentials (from seed):
- Email: `admin@phm.local`
- Password: `Admin123!@#` (change immediately!)

### Docker Deployment

1. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with production values
```

2. **Build and start all services**

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- API server (http://localhost:3001)
- Web app (http://localhost:3000)

3. **Check service health**

```bash
docker-compose ps
docker-compose logs -f
```

4. **Stop services**

```bash
docker-compose down
```

## Project Structure

```
PHM2/
├── packages/
│   ├── shared/          # Shared types and validation schemas
│   │   ├── src/
│   │   │   ├── types/
│   │   │   └── validation/
│   │   └── package.json
│   │
│   ├── api/             # Backend API
│   │   ├── src/
│   │   │   ├── db/          # Database schema and connection
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── middleware/  # Auth, validation, error handling
│   │   │   ├── lib/         # JWT utilities
│   │   │   ├── utils/       # Logging, errors
│   │   │   └── index.ts     # Server entry point
│   │   ├── drizzle/         # Database migrations
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/             # Frontend React app
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── routes/      # Page routes
│       │   ├── lib/         # API client, utilities
│       │   ├── stores/      # Zustand stores
│       │   └── main.tsx     # App entry point
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
│
├── docker-compose.yml   # Docker orchestration
├── tsconfig.json        # TypeScript config (root)
├── .env.example         # Environment template
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Customers
- `GET /api/customers` - List customers (paginated, filterable)
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Products
- `GET /api/products` - List products
- `GET /api/products/search` - Quick search
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Create quote
- `GET /api/quotes/:id` - Get quote with lines
- `PUT /api/quotes/:id` - Update quote
- `DELETE /api/quotes/:id` - Delete quote
- `POST /api/quotes/:id/send` - Send quote to customer
- `POST /api/quotes/:id/accept` - Accept quote
- `POST /api/quotes/:id/reject` - Reject quote
- `POST /api/quotes/:id/duplicate` - Clone quote

## Database Management

### Generate migration

```bash
npm run db:generate
```

### Run migrations

```bash
npm run db:migrate
```

### Open Drizzle Studio

```bash
npm run db:studio
```

### Seed database

```bash
cd packages/api
npm run db:seed
```

## Development Commands

```bash
# Install all dependencies
npm install

# Run both API and web in dev mode
npm run dev

# Build all packages
npm run build

# Type check all packages
npm run type-check

# Clean all build artifacts
npm run clean

# Database commands
npm run db:generate    # Generate migration from schema changes
npm run db:migrate     # Run pending migrations
npm run db:studio      # Open Drizzle Studio (database GUI)
```

## Environment Variables

See `.env.example` for all available environment variables.

### Required

- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT access token secret (32+ chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (32+ chars)

### Optional

- `PORT` - Web server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin
- `VITE_API_URL` - API URL for frontend
- `INITIAL_ADMIN_EMAIL` - Default admin email
- `INITIAL_ADMIN_PASSWORD` - Default admin password

## Security Best Practices

1. **Change default passwords** immediately after first login
2. **Use strong JWT secrets** (32+ characters, random)
3. **Enable HTTPS** in production (use Caddy or nginx with Let's Encrypt)
4. **Set secure CORS origins** (not `*`)
5. **Regular database backups**
6. **Keep dependencies updated**

## Roadmap

### Phase 1: Core Platform ✅ (Current)
- [x] Database schema with Drizzle ORM
- [x] Authentication system (JWT)
- [x] CRUD APIs (customers, leads, products, quotes)
- [x] Basic React frontend
- [x] Docker deployment

### Phase 2: Survey System (Next)
- [ ] Voice recording and transcription
- [ ] AI observation extraction
- [ ] Survey modules (property, heating, heat pump)
- [ ] Photo upload and annotation
- [ ] Survey report generation

### Phase 3: Advanced Features
- [ ] Appointment calendar
- [ ] Boiler specification database
- [ ] Product recommendation engine
- [ ] Email notifications
- [ ] Dashboard analytics
- [ ] User roles and permissions

### Phase 4: Polish & Scale
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Offline support (PWA)
- [ ] Integration APIs (Xero, QuickBooks)
- [ ] Export/import functionality

### Phase 5: Visual Surveyor (Future)
- [ ] LiDAR room scanning
- [ ] Thermal imaging
- [ ] GPS tracking
- [ ] Additional trade modules

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
