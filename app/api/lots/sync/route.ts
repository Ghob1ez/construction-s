// app/api/lots/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // adjust if your path differs

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { projectId, address } = (await req.json()) as {
      projectId?: string;
      address?: string;
    };
    if (!projectId || !address) {
      return NextResponse.json(
        { error: "projectId and address are required" },
        { status: 400 }
      );
    }

    // 1) Call the LEP lookup you built
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = new URL("/api/lep/lookup", base);
    url.searchParams.set("address", address);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "construction-s/dev (lots-sync)" },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `LEP lookup failed (${res.status}) ${t}` },
        { status: 502 }
      );
    }
    const data = await res.json();

    const n = data?.normalized ?? {};
    const g = data?.geocode ?? {};
    const lat =
      typeof g.lat === "number" ? g.lat : null;
    const lng =
      typeof g.lon === "number" ? g.lon : null;

    // 2) Create Lot (Decimal fields can be string or number)
    const lot = await prisma.lot.create({
      data: {
        address: g.address || address,
        council: n.council ?? null,
        zoneCode: n.zone?.code ?? null,
        lat: lat,
        lng: lng,
        maxHeightM: n.controls?.maxHeightM ?? null, // ok as number or string
        fsr: n.controls?.fsr ?? null,               // ok as number or string
        minLotSizeSqm: n.controls?.minLotSizeSqm ?? null,
      },
    });

    // 3) Link Project → Lot
    await prisma.project.update({
      where: { id: projectId },
      data: { lotId: lot.id },
    });

    return NextResponse.json({ ok: true, lot, projectId }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/lots/sync failed:", err);
    return NextResponse.json(
      { error: err?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
