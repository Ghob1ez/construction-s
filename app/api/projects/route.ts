// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Debug once per process: which DB URL are we using?
(() => {
  try {
    const u = new URL(process.env.DATABASE_URL || "");
    console.log(
      "[DB URL] user =", u.username,
      "host =", u.host,
      "prepared_statements =", u.searchParams.get("prepared_statements")
    );
  } catch {
    console.log("[DB URL] not parsable");
  }
})();

export const runtime = "nodejs";

// Helpers: coerce and sanitize
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function int(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) {
    return parseInt(v, 10);
  }
  return null;
}
function date(v: unknown): Date | null {
  if (typeof v === "string" && v.trim()) {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : new Date(t);
  }
  return null;
}

// --- GET: always return an array ---
export async function GET() {
  try {
    const rows = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (err) {
    console.error("GET /api/projects failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}

// --- POST: coerce and insert ---
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    // support old form fields too (name/description)
    const siteAddress = str(b.siteAddress ?? b.name);
    const projectType = str(b.projectType ?? b.description);

    const created = await prisma.project.create({
      data: {
        siteAddress,
        projectType,
        sizeStoreys: int(b.sizeStoreys),
        budgetBand: str(b.budgetBand),
        targetTimeline: date(b.targetTimeline),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    const message =
      (typeof err?.message === "string" && err.message) ||
      "Failed to create project";

    console.error("POST /api/projects failed:", err);

    return NextResponse.json(
      {
        error: message,
        // include stack only in dev for clarity
        stack: process.env.NODE_ENV !== "production" ? err?.stack ?? null : null,
      },
      { status: 500 }
    );
  }
}
