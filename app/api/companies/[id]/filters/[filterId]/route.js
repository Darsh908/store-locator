import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - Update a filter
export async function PATCH(request, { params }) {
  try {
    const { id, filterId } = await params;
    const body = await request.json();
    const { fieldName, displayName, filterType, options, order, isActive } =
      body;

    const updateData = {};
    if (fieldName !== undefined) updateData.fieldName = fieldName;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (filterType !== undefined) updateData.filterType = filterType;
    if (options !== undefined) updateData.options = options;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const filter = await prisma.filter.update({
      where: {
        id: filterId,
        companyId: id, // Ensure filter belongs to company
      },
      data: updateData,
    });

    return NextResponse.json(filter);
  } catch (error) {
    console.error("Error updating filter:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update filter" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a filter
export async function DELETE(request, { params }) {
  try {
    const { id, filterId } = await params;

    await prisma.filter.delete({
      where: {
        id: filterId,
        companyId: id, // Ensure filter belongs to company
      },
    });

    return NextResponse.json({ message: "Filter deleted successfully" });
  } catch (error) {
    console.error("Error deleting filter:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete filter" },
      { status: 500 }
    );
  }
}

