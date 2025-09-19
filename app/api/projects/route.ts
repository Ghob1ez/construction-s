// app/api/projects/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/Prisma.ts'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(projects)
  } catch (err) {
    console.error('GET /api/projects error:', err)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
