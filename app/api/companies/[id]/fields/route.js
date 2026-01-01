import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get available fields from stores (for filter configuration)
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Get all stores for this company
    const stores = await prisma.store.findMany({
      where: { companyId: id },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        customData: true,
      },
    });

    // Collect all unique field names from customData
    const customDataFields = new Set();
    stores.forEach((store) => {
      if (store.customData && typeof store.customData === "object") {
        Object.keys(store.customData).forEach((key) => {
          customDataFields.add(key);
        });
      }
    });

    // Standard fields
    const standardFields = [
      { name: "name", displayName: "Store Name", type: "text" },
      { name: "address", displayName: "Address", type: "text" },
      { name: "phone", displayName: "Phone", type: "text" },
      { name: "email", displayName: "Email", type: "text" },
      { name: "website", displayName: "Website", type: "text" },
      { name: "description", displayName: "Description", type: "text" },
    ];

    // Custom fields from customData
    const customFields = Array.from(customDataFields).map((fieldName) => {
      // Try to determine type from sample values
      const sampleValues = stores
        .map((store) => {
          if (store.customData && store.customData[fieldName]) {
            return store.customData[fieldName];
          }
          return null;
        })
        .filter((v) => v !== null);

      let type = "text";
      if (sampleValues.length > 0) {
        const firstValue = sampleValues[0];
        if (typeof firstValue === "number") {
          type = "number";
        } else if (typeof firstValue === "boolean") {
          type = "boolean";
        } else if (
          typeof firstValue === "string" &&
          sampleValues.length <= 20 &&
          new Set(sampleValues).size <= 10
        ) {
          // Likely a select/multiselect if few unique values
          type = "select";
        }
      }

      return {
        name: fieldName,
        displayName: fieldName
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim(),
        type,
        isCustom: true,
        sampleValues: Array.from(new Set(sampleValues)).slice(0, 10), // Unique sample values
      };
    });

    return NextResponse.json({
      standardFields,
      customFields,
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}

