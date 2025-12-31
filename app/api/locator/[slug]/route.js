import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public store locator endpoint with domain whitelisting
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const referer = request.headers.get("referer") || "";
    const origin = request.headers.get("origin") || "";

    // Get company by slug
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        stores: {
          where: {
            geocoded: true, // Only return geocoded stores
            latitude: { not: null },
            longitude: { not: null },
          },
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
      // In production, you might want to be stricter
      if (!isAllowed && referer && origin) {
        return NextResponse.json(
          {
            error: "Access denied",
            message:
              "This store locator can only be embedded on authorized domains",
          },
          { status: 403 }
        );
      }
    }

    // Return company and stores data
    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
      stores: company.stores,
    });
  } catch (error) {
    console.error("Error fetching store locator:", error);
    return NextResponse.json(
      { error: "Failed to fetch store locator" },
      { status: 500 }
    );
  }
}
