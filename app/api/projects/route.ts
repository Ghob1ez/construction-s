// app/api/projects/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const project = await prisma.project.create({
      data: {
        id: body.id, // or use cuid() if you want Prisma to auto-generate
        siteAddress: body.siteAddress,
        projectType: body.projectType,
        sizeStoreys: body.sizeStoreys,
        budgetBand: body.budgetBand,
        targetTimeline: new Date(body.targetTimeline),
        // createdAt will be auto-set by default(now()) in schema
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    console.error('POST /api/projects error:', err)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}