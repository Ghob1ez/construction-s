// lib/zoningService.ts
export type ZoningPayload = {
  zoneCode?: string;
  council?: string;
  maxHeightM?: number;
  fsr?: number;
  minLotSizeSqm?: number;
};

export async function fetchZoningByAddress(_address: string): Promise<ZoningPayload> {
  // Replace with your real provider later
  return {
    zoneCode: "R2",
    council: "Example Shire",
    maxHeightM: 8.5,
    fsr: 0.5,
    minLotSizeSqm: 450,
  };
}
