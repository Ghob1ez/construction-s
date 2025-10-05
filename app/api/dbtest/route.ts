import { NextResponse } from 'next/server'
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // Fast no-op query to test connectivity
    const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() AS now;`
    return NextResponse.json({ ok: true, now: now[0]?.now })
  } catch (err) {
    console.error('GET /api/dbtest error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
