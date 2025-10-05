// lib/lotSync.ts
import { prisma } from "./prisma";
import { fetchZoningByAddress } from "./zoningService";

export async function syncLotForProject(params: { projectId: string; address: string }) {
  const { projectId, address } = params;

  // 1) get zoning (stub ok)
  const zoning = await fetchZoningByAddress(address);

  // 2) find/create Lot by address (works even without @unique)
  const existing = await prisma.lot.findFirst({ where: { address } });

  const lot = existing
    ? await prisma.lot.update({
        where: { id: existing.id },
        data: { address, ...zoning },
      })
    : await prisma.lot.create({
        data: { address, ...zoning },
      });

  // 3) link Project → Lot
  await prisma.project.update({
    where: { id: projectId },
    data: { lotId: lot.id },
  });

  return lot;
}
