import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const lot = await prisma.lot.create({
      data: {
        address: "123 Test Street",
        council: "Sydney",
        zoneCode: "R2",
        maxHeightM: 9.5,
        fsr: 0.5,
        minLotSizeSqm: 600,
      },
    });

    return NextResponse.json(lot, { status: 200 });
  } catch (err: any) {
    console.error("Test lot insert failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}