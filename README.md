# Store Locator MVP

A scalable store locator service that allows users to manage companies, import store data, and embed interactive Google Maps on their websites via iframe.

## Features

- **Company Management**: Create and manage multiple companies
- **Store Import**: Import stores from CSV or Excel files with automatic geocoding
- **Domain Whitelisting**: Secure iframe embedding with domain restrictions
- **Interactive Maps**: Google Maps integration with store markers
- **Store Details**: Click on stores to view details and get directions
- **Public URLs**: Generate shareable store locator links for each company

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Maps**: Google Maps JavaScript API
- **Styling**: Tailwind CSS
- **File Parsing**: PapaParse for CSV import, xlsx for Excel import

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Geocoding API

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/storelocator?schema=public"

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Admin Panel

1. Navigate to `/admin` to access the admin panel
2. Create a new company
3. Add allowed domains for iframe embedding (optional - leave empty for no restrictions)
4. Import stores via CSV or Excel:
   - Supported formats: `.csv`, `.xlsx`, `.xls`
   - Required columns: `name`, `address`
   - Optional columns: `phone`, `email`, `website`, `description`
   - Stores will be automatically geocoded using Google Maps Geocoding API

### Public Store Locator

- Each company gets a public URL: `/locator/[company-slug]`
- This page can be embedded via iframe on whitelisted domains
- Users can click on store markers to view details and get directions

### Embedding

Use the iframe code provided in the admin panel:

```html
<iframe
  src="https://yourdomain.com/locator/company-slug"
  width="100%"
  height="600"
  frameborder="0"
  style="border: 0;"
>
</iframe>
```

## Database Schema

- **Company**: Stores company information, slug, and domain whitelist
- **Store**: Stores location data with geocoded coordinates and custom data

## API Routes

- `GET /api/companies` - List all companies
- `POST /api/companies` - Create a company
- `GET /api/companies/[id]` - Get company details
- `PATCH /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete company
- `GET /api/companies/[id]/stores` - Get stores for a company
- `POST /api/companies/[id]/stores` - Import stores (with geocoding)
- `GET /api/locator/[slug]` - Public store locator endpoint (with domain checking)

## Security

- Domain whitelisting is enforced via referer/origin header checking
- Iframe embedding is controlled per company
- API routes validate domain restrictions before serving store data

## Future Enhancements

- User authentication and authorization
- Dynamic filters based on store custom data
- Store search functionality
- Custom map styling
- Analytics and usage tracking
- Batch geocoding for large imports
- Store categories and tags

## Scaling Considerations

The current stack is designed for scalability:

- **Database**: PostgreSQL with proper indexing for fast queries
- **API**: Next.js API routes can be deployed on serverless platforms
- **Caching**: Consider adding Redis for frequently accessed store data
- **CDN**: Static assets can be served via CDN
- **Rate Limiting**: Add rate limiting for API endpoints
- **Database Connection Pooling**: Use connection pooling for production

## License

MIT
