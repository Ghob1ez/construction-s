// app/api/lep/lookup/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ArcGIS service + layer IDs (verify once if NSW updates IDs)
const EPI_BASE =
  "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer";
const LAYERS = { FSR: 1, ZONING: 2, LOT_SIZE: 4, HEIGHT: 5 };

// --- helpers ---
async function queryLayer(layerId: number, x: number, y: number) {
  const url = new URL(`${EPI_BASE}/${layerId}/query`);
  url.searchParams.set("f", "json");
  url.searchParams.set("geometry", JSON.stringify({ x, y }));
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "*");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "construction-s/dev (LEP lookup)" },
  });
  if (!res.ok) throw new Error(`ArcGIS ${layerId} query failed (${res.status})`);
  return res.json();
}

function first<T = any>(...vals: Array<T | null | undefined>) {
  return vals.find(v => v !== undefined && v !== null) ?? null;
}

function normalizeOut(raw: any) {
  const z = raw?.zoning ?? {};
  const h = raw?.height ?? {};
  const f = raw?.fsr ?? {};
  const l = raw?.lotSize ?? {};

  const zoneCode = first(z.ZONE_CODE, z.SYM_CODE);
  const zoneName = first(z.ZONE_NAME, z.MAP_NAME);
  const council  = first(z.LGA_NAME);

  const maxHeightM = Number(first(h.MAX_B_H_M, h.HOB_M, h.MAX_B_H));
  const fsrValRaw  = first(f.FSR_VALUE, f.FSR, f.SYM_CODE, f.LAY_CLASS);
  const fsr = typeof fsrValRaw === "number"
    ? fsrValRaw
    : typeof fsrValRaw === "string"
      ? parseFloat(fsrValRaw.replace(/[^\d.]/g, "")) || null
      : null;

  const minLotSizeSqm = Number(first(l.LOTSIZE_MIN));

  return {
    council,
    zone: { code: zoneCode, name: zoneName },
    controls: {
      maxHeightM: Number.isFinite(maxHeightM) ? maxHeightM : null,
      fsr,
      minLotSizeSqm: Number.isFinite(minLotSizeSqm) ? minLotSizeSqm : null,
    },
  };
}

// --- route ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "Missing address query param" }, { status: 400 });
    }

    // 1) Geocode (Nominatim)
    const nominatimURL = new URL("https://nominatim.openstreetmap.org/search");
    nominatimURL.searchParams.set("q", address);
    nominatimURL.searchParams.set("format", "json");
    nominatimURL.searchParams.set("addressdetails", "1");
    nominatimURL.searchParams.set("limit", "1");

    const geoRes = await fetch(nominatimURL.toString(), {
      headers: { "User-Agent": "construction-s/dev (Nominatim lookup)" },
    });
    if (!geoRes.ok) {
      return NextResponse.json({ error: `Geocode failed (${geoRes.status})` }, { status: 502 });
    }
    const geo = (await geoRes.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!geo.length) {
      return NextResponse.json({ error: "No geocode result for that address" }, { status: 404 });
    }
    const lat = parseFloat(geo[0].lat);
    const lon = parseFloat(geo[0].lon);

    // 2) Query NSW LEP layers at that point
    const [zoning, height, fsr, lotSize] = await Promise.all([
      queryLayer(LAYERS.ZONING, lon, lat),
      queryLayer(LAYERS.HEIGHT, lon, lat),
      queryLayer(LAYERS.FSR, lon, lat),
      queryLayer(LAYERS.LOT_SIZE, lon, lat),
    ]);

    // 3) Pick first feature’s attributes
    const pick = (r: any) => (r?.features?.[0]?.attributes ?? null);
    const out = {
      geocode: { address: geo[0].display_name, lat, lon },
      zoning: pick(zoning),
      height: pick(height),
      fsr: pick(fsr),
      lotSize: pick(lotSize),
    };

    // 4) Add normalized summary
    const normalized = normalizeOut(out);

    return NextResponse.json({ ...out, normalized }, { status: 200 });
  } catch (err: any) {
    console.error("LEP lookup failed:", err);
    return NextResponse.json({ error: err?.message || "LEP lookup failed" }, { status: 500 });
  }
}
