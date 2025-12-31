import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all companies (for MVP, no auth)
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            geocoded: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST - Create a new company
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, domainWhitelist = [] } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug exists, append number if needed
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.company.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug: finalSlug,
        domainWhitelist: Array.isArray(domainWhitelist) ? domainWhitelist : [],
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
