import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public store locator endpoint with domain whitelisting
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "50"; // default 50km
    
    const referer = request.headers.get("referer") || "";
    const origin = request.headers.get("origin") || "";

    // Get company by slug
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        filters: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Store locator not found" },
        { status: 404 }
      );
    }

    // Domain whitelist check
    if (company.domainWhitelist && company.domainWhitelist.length > 0) {
      const allowedDomains = company.domainWhitelist;
      let isAllowed = false;

      // Check referer
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const refererDomain = refererUrl.hostname.replace(/^www\./, "");
          isAllowed = allowedDomains.some((domain) => {
            const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
            return (
              refererDomain === cleanDomain ||
              refererDomain.endsWith(`.${cleanDomain}`)
            );
          });
        } catch (e) {
          // Invalid referer URL
        }
      }

      // Check origin
      if (!isAllowed && origin) {
        try {
          const originUrl = new URL(origin);
          const originDomain = originUrl.hostname.replace(/^www\./, "");
          isAllowed = allowedDomains.some((domain) => {
            const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
            return (
              originDomain === cleanDomain ||
              originDomain.endsWith(`.${cleanDomain}`)
            );
          });
        } catch (e) {
          // Invalid origin URL
        }
      }

      // For MVP, allow if no referer/origin (direct access for testing)
      if (!isAllowed && referer && origin) {
        return NextResponse.json(
          {
            error: "Access denied",
            message: "This store locator can only be embedded on authorized domains",
          },
          { status: 403 }
        );
      }
    }

    // Fetch stores
    let stores = [];
    if (lat && lng) {
      // Geospatial query using Haversine formula
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      stores = await prisma.$queryRaw`
        SELECT *, 
          (6371 * acos(
            cos(radians(${latitude})) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians(latitude))
          )) AS distance
        FROM "Store"
        WHERE "companyId" = ${company.id} 
          AND "geocoded" = true
          AND "latitude" IS NOT NULL 
          AND "longitude" IS NOT NULL
          AND (6371 * acos(
            cos(radians(${latitude})) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians(latitude))
          )) <= ${radiusKm}
        ORDER BY distance ASC
      `;
    } else {
      stores = await prisma.store.findMany({
        where: {
          companyId: company.id,
          geocoded: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      });
      // Add distance null for consistency
      stores = stores.map(s => ({ ...s, distance: null }));
    }

    // Return company, stores, and filters data
    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      stores,
      filters: company.filters || [],
    });
  } catch (error) {
    console.error("Error fetching store locator:", error);
    return NextResponse.json(
      { error: "Failed to fetch store locator" },
      { status: 500 }
    );
  }
}
