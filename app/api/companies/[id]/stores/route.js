import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";

// GET - Get all stores for a company
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const stores = await prisma.store.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

// POST - Create stores (with geocoding)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stores } = body;

    if (!Array.isArray(stores) || stores.length === 0) {
      return NextResponse.json(
        { error: "Stores array is required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Process stores with geocoding (only if lat/lng not provided)
    const processedStores = await Promise.all(
      stores.map(async (store) => {
        const {
          name,
          address,
          latitude: providedLatitude,
          longitude: providedLongitude,
          phone,
          email,
          website,
          description,
          customData,
        } = store;

        if (!name || !address) {
          return null;
        }

        let latitude = null;
        let longitude = null;
        let geocoded = false;

        // Check if valid coordinates are provided
        const hasValidCoordinates =
          providedLatitude != null &&
          providedLongitude != null &&
          !isNaN(parseFloat(providedLatitude)) &&
          !isNaN(parseFloat(providedLongitude)) &&
          parseFloat(providedLatitude) >= -90 &&
          parseFloat(providedLatitude) <= 90 &&
          parseFloat(providedLongitude) >= -180 &&
          parseFloat(providedLongitude) <= 180;

        if (hasValidCoordinates) {
          // Use provided coordinates, skip geocoding
          latitude = parseFloat(providedLatitude);
          longitude = parseFloat(providedLongitude);
          geocoded = true;
        } else {
          // Geocode address if coordinates not provided or invalid
          try {
            const geocodeResponse = await axios.get(
              "https://maps.googleapis.com/maps/api/geocode/json",
              {
                params: {
                  address: address,
                  key: apiKey,
                },
              }
            );

            // Check for API errors
            if (geocodeResponse.data.status === "REQUEST_DENIED") {
              const errorMsg =
                geocodeResponse.data.error_message ||
                "Geocoding API request denied";
              console.error("Geocoding API error:", errorMsg);

              // Check if it's a referrer restriction issue
              if (errorMsg.includes("referer restrictions")) {
                console.error(
                  "ERROR: Your Google Maps API key has HTTP referrer restrictions. " +
                    "Server-side API calls cannot use keys with referrer restrictions. " +
                    "Please create a separate API key without referrer restrictions for server-side use, " +
                    "or use IP address restrictions instead."
                );
              }
              // Don't throw - continue without geocoding for this address
            } else if (
              geocodeResponse.data.status === "OK" &&
              geocodeResponse.data.results.length > 0
            ) {
              const location =
                geocodeResponse.data.results[0].geometry.location;
              latitude = location.lat;
              longitude = location.lng;
              geocoded = true;
            } else {
              console.warn(
                `Geocoding failed for address "${address}": ${geocodeResponse.data.status}`
              );
            }
          } catch (error) {
            console.error("Geocoding error for address:", address, error);
          }
        }

        return {
          companyId: id,
          name,
          address,
          latitude,
          longitude,
          phone: phone || null,
          email: email || null,
          website: website || null,
          description: description || null,
          customData: customData || null,
          geocoded,
        };
      })
    );

    // Filter out null values and create stores
    const validStores = processedStores.filter((store) => store !== null);

    if (validStores.length === 0) {
      return NextResponse.json(
        { error: "No valid stores to create" },
        { status: 400 }
      );
    }

    const createdStores = await prisma.store.createMany({
      data: validStores,
    });

    return NextResponse.json(
      {
        message: `Created ${createdStores.count} stores`,
        count: createdStores.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stores:", error);
    return NextResponse.json(
      { error: "Failed to create stores" },
      { status: 500 }
    );
  }
}
