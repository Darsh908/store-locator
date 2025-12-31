# Architecture Overview

## System Design

### Tech Stack Rationale

**Next.js 15 (App Router)**
- Server-side rendering and API routes in one framework
- Built-in optimizations for production
- Easy deployment on Vercel or any Node.js platform
- Excellent for MVP with room to scale

**PostgreSQL + Prisma**
- Relational database perfect for companies/stores relationship
- Prisma provides type-safe database access
- Easy migrations and schema management
- Scales well with proper indexing

**Google Maps API**
- Industry standard for maps
- Reliable geocoding service
- Good documentation and support
- Pay-as-you-go pricing suitable for MVP

### Database Schema

```
Company
├── id (CUID)
├── name
├── slug (unique, for public URLs)
├── domainWhitelist (array of allowed domains)
└── stores (one-to-many)

Store
├── id (CUID)
├── companyId (foreign key)
├── name
├── address
├── latitude/longitude (geocoded)
├── phone, email, website, description
├── customData (JSON for future filters)
└── geocoded (boolean flag)
```

### API Architecture

**Admin APIs** (`/api/companies/*`)
- No authentication in MVP (add later)
- CRUD operations for companies
- Store import with batch geocoding
- Returns full data including IDs

**Public API** (`/api/locator/[slug]`)
- Domain whitelist validation
- Checks referer and origin headers
- Returns only geocoded stores
- Lightweight response for iframe embedding

### Security Model

**Domain Whitelisting:**
1. Company admin sets allowed domains
2. Public API checks `referer` and `origin` headers
3. Extracts domain from headers
4. Compares against whitelist (supports subdomains)
5. Returns 403 if not allowed (or allows direct access for MVP testing)

**Iframe Security:**
- `X-Frame-Options: SAMEORIGIN` allows embedding
- `Content-Security-Policy: frame-ancestors *` allows any domain
- Actual domain restriction handled at API level (more flexible)

### Data Flow

**Store Import Flow:**
1. Admin uploads CSV file
2. Frontend parses CSV using PapaParse
3. Sends store data to `/api/companies/[id]/stores`
4. API iterates through stores
5. For each store, calls Google Geocoding API
6. Stores coordinates in database
7. Returns success with count

**Public Store Locator Flow:**
1. User visits `/locator/[slug]` or embeds iframe
2. Frontend calls `/api/locator/[slug]`
3. API validates domain (if whitelist exists)
4. Returns company and geocoded stores
5. Frontend renders Google Map with markers
6. User clicks marker → shows InfoWindow with details
7. "Get Directions" opens Google Maps in new tab

### File Structure

```
app/
├── api/
│   ├── companies/
│   │   ├── route.js (list, create)
│   │   └── [id]/
│   │       ├── route.js (get, update, delete)
│   │       └── stores/route.js (list, import)
│   └── locator/
│       └── [slug]/route.js (public endpoint)
├── admin/
│   ├── page.js (company list)
│   └── companies/[id]/page.js (store management)
├── locator/
│   └── [slug]/page.js (public map view)
├── page.js (home/landing)
└── layout.js (root layout)

lib/
└── prisma.js (database client)

prisma/
└── schema.prisma (database schema)
```

### Scaling Considerations

**Database:**
- Indexes on `slug`, `companyId`, and `(latitude, longitude)`
- Consider read replicas for high traffic
- Partition stores table by company if needed

**API:**
- Add caching layer (Redis) for store data
- Rate limiting on geocoding endpoints
- Batch geocoding for large imports (queue system)
- Connection pooling for database

**Frontend:**
- Client-side caching of store data
- Lazy loading for map markers
- Virtual scrolling for large store lists

**Infrastructure:**
- Deploy API routes on serverless (Vercel, AWS Lambda)
- Use CDN for static assets
- Consider edge functions for public locator endpoint
- Database connection pooling service (PgBouncer)

### Future Enhancements

**Phase 2: Authentication**
- Add User model with NextAuth.js
- Multi-user support per company
- Role-based access control

**Phase 3: Advanced Features**
- Dynamic filters (use `customData` JSON field)
- Store search and filtering
- Custom map styling
- Analytics dashboard
- Export functionality

**Phase 4: Enterprise**
- Multi-tenant architecture
- API rate limiting per company
- Webhook support
- Custom branding per company
- Advanced analytics

### Testing Strategy

**MVP Testing:**
- Manual testing of all flows
- Test domain whitelisting with different referers
- Test CSV import with various formats
- Test iframe embedding on different domains

**Future Testing:**
- Unit tests for API routes
- Integration tests for database operations
- E2E tests for admin and public flows
- Load testing for geocoding endpoints

