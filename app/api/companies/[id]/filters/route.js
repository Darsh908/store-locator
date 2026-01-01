import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get all filters for a company
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const filters = await prisma.filter.findMany({
      where: { companyId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(filters);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}

// POST - Create a new filter
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fieldName, displayName, filterType, options, order, isActive } =
      body;

    if (!fieldName || !displayName || !filterType) {
      return NextResponse.json(
        { error: "fieldName, displayName, and filterType are required" },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const filter = await prisma.filter.create({
      data: {
        companyId: id,
        fieldName,
        displayName,
        filterType,
        options: options || null,
        order: order ?? 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(filter, { status: 201 });
  } catch (error) {
    console.error("Error creating filter:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A filter with this field name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create filter" },
      { status: 500 }
    );
  }
}

