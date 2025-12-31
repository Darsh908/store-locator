# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up PostgreSQL Database

You can use:

- **Local PostgreSQL**: Install and run locally
- **Cloud Database**: Use services like Supabase, Neon, or Railway (free tiers available)
- **Docker**: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

### 3. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/storelocator?schema=public"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-api-key-here"
GOOGLE_MAPS_API_KEY="your-api-key-here"
```

**Get Google Maps API Key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps JavaScript API** and **Geocoding API**
4. Create credentials (API Key)
5. (Optional) Restrict API key to your domain for production

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database schema
npx prisma migrate dev --name init
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and navigate to `/admin`

## Testing the MVP

1. **Create a Company:**

   - Go to `/admin`
   - Click "Create Company"
   - Enter name: "Test Company"
   - Add allowed domain (optional): `localhost:3000` or your test domain
   - Click "Create Company"

2. **Import Stores:**

   - Click "Manage" on your company
   - Click "+ Import Stores"
   - Use the provided `sample-stores.csv` file
   - Wait for geocoding to complete

3. **View Store Locator:**

   - Copy the public URL from the company card
   - Or visit `/locator/[your-company-slug]`
   - You should see stores on the map

4. **Test iframe Embedding:**
   - Copy the iframe code from the company management page
   - Create a test HTML file with the iframe
   - Open it in a browser (make sure domain matches whitelist)

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists: `CREATE DATABASE storelocator;`

### Google Maps Not Loading

- Verify API key is set in `.env`
- Check browser console for API errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- **IMPORTANT**: If you see `ApiTargetBlockedMapError`:
  - Your API key has restrictions that block the current domain
  - **Solution for Development (localhost)**:
    1. Go to Google Cloud Console → APIs & Services → Credentials
    2. Click on your API key
    3. Under "Application restrictions", select "HTTP referrers (web sites)"
    4. Add these referrers:
       - `localhost:3000/*`
       - `127.0.0.1:3000/*`
       - `localhost/*` (for any port)
    5. Under "API restrictions", ensure "Maps JavaScript API" is enabled
    6. Save and wait 1-2 minutes for changes to propagate
  - **Solution for Production**:
    1. Add your production domain: `yourdomain.com/*`
    2. Add `https://yourdomain.com/*` if using HTTPS
    3. Ensure billing is enabled on your Google Cloud project

### Geocoding Fails

- Check GOOGLE_MAPS_API_KEY is set (not just NEXT_PUBLIC version)
- Verify Geocoding API is enabled
- Check API key has proper permissions
- **IMPORTANT**: If you see "API keys with referer restrictions cannot be used with this API":
  - Your API key has HTTP referrer restrictions, which don't work for server-side API calls
  - **Solution**: Create a separate API key for server-side use:
    1. Go to Google Cloud Console → APIs & Services → Credentials
    2. Create a new API key
    3. Under "API restrictions", select "Restrict key" and choose "Geocoding API"
    4. Under "Application restrictions", choose "IP addresses" (for production) or "None" (for development)
    5. **DO NOT** use "HTTP referrers" restriction for server-side API keys
    6. Update your `.env` file with the new key: `GOOGLE_MAPS_API_KEY="your-server-side-key"`

### Domain Whitelist Not Working

- For local testing, use `localhost:3000` (without http://)
- Check browser console for CORS/referer issues
- In MVP, direct access (no referer) is allowed for testing

## Next Steps After MVP Works

1. Add authentication (NextAuth.js or similar)
2. Add user management (multiple users per company)
3. Implement dynamic filters
4. Add store search functionality
5. Add analytics
6. Optimize for production (caching, rate limiting, etc.)
