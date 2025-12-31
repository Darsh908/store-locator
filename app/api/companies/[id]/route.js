import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get company by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        stores: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PATCH - Update company
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, domainWhitelist } = body;

    const updateData = {};
    if (name) updateData.name = name;
    if (domainWhitelist !== undefined) {
      updateData.domainWhitelist = Array.isArray(domainWhitelist)
        ? domainWhitelist
        : [];
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE - Delete company
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
