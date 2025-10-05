"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

type Lot = {
  id: string;
  address: string;
  zoneCode?: string | null;
  council?: string | null;
  maxHeightM?: string | number | null; // Prisma Decimal -> string in JSON
  fsr?: string | number | null;        // Prisma Decimal -> string in JSON
  minLotSizeSqm?: number | null;
  createdAt: string;
};

type Project = {
  id: string;
  siteAddress?: string | null;
  projectType?: string | null;
  sizeStoreys?: number | null;
  budgetBand?: string | null;
  targetTimeline?: string | null;
  createdAt: string;
  lotId?: string | null;
  lot?: Lot | null; // include related Lot
};

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);

  // form state (real fields)
  const [siteAddress, setSiteAddress] = useState("");
  const [projectType, setProjectType] = useState("");
  const [sizeStoreys, setSizeStoreys] = useState<string>(""); // keep as string for input
  const [budgetBand, setBudgetBand] = useState("");
  const [targetTimeline, setTargetTimeline] = useState(""); // yyyy-mm-dd

  const [submitting, setSubmitting] = useState(false);

  // fetch list
  async function refresh() {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch /api/projects failed:", e);
      setItems([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function onText(setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setter(e.target.value);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      // Build payload and normalize values
      const payload: Record<string, unknown> = {
        siteAddress: siteAddress.trim() || null,
        projectType: projectType.trim() || null,
        budgetBand: budgetBand.trim() || null,
        targetTimeline: targetTimeline.trim() || null, // server parses to Date
      };

      if (sizeStoreys.trim()) {
        const n = Number(sizeStoreys);
        payload.sizeStoreys = Number.isInteger(n) ? n : null;
      } else {
        payload.sizeStoreys = null;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = `Create failed (HTTP ${res.status})`;
        try {
          const data = await res.clone().json();
          message = (data as any)?.error || (data as any)?.message || message;
        } catch {
          try {
            const txt = await res.text();
            if (txt) message = txt;
          } catch {}
        }
        console.error("Create project failed:", { status: res.status, payload });
        alert(message);
        return;
      }

      // success
      await res.json(); // ignore body; we re-fetch list
      setSiteAddress("");
      setProjectType("");
      setSizeStoreys("");
      setBudgetBand("");
      setTargetTimeline("");

      await refresh();
    } catch (err) {
      console.error("Create project threw:", err);
      alert("Could not create project. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  }

  // helper to display Decimals as numbers
  const n = (v: unknown) =>
    v == null ? null : typeof v === "string" ? Number(v) : (v as number);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="grid gap-6 md:grid-cols-[360px,1fr]">
        {/* LEFT: Create form */}
        <section className="rounded-2xl border bg-white p-4 md:sticky md:top-6 h-fit">
          <h2 className="text-xl font-semibold mb-3">Create a Project</h2>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full border rounded-lg p-2"
              placeholder="Site address *"
              value={siteAddress}
              onChange={onText(setSiteAddress)}
              required
            />
            <input
              className="w-full border rounded-lg p-2"
              placeholder="Project type * (e.g. New Dwelling)"
              value={projectType}
              onChange={onText(setProjectType)}
              required
            />
            <input
              className="w-full border rounded-lg p-2"
              placeholder="Storeys (optional, whole number)"
              inputMode="numeric"
              value={sizeStoreys}
              onChange={onText(setSizeStoreys)}
            />
            <input
              className="w-full border rounded-lg p-2"
              placeholder="Budget band (optional)"
              value={budgetBand}
              onChange={onText(setBudgetBand)}
            />
            <input
              className="w-full border rounded-lg p-2"
              type="date"
              placeholder="Target timeline (optional)"
              value={targetTimeline}
              onChange={onText(setTargetTimeline)}
            />

            <button
              disabled={submitting || !siteAddress.trim() || !projectType.trim()}
              className="w-full rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save project"}
            </button>
          </form>
        </section>

        {/* RIGHT: Projects list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Projects</h2>
            <button
              onClick={refresh}
              className="text-sm rounded-lg border px-3 py-1.5"
              title="Refresh"
            >
              Refresh
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-500">
              No projects yet. Create your first one on the left.
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((p) => {
                const lot = p.lot ?? null;
                const maxHeight = lot ? n(lot.maxHeightM) : null;
                const fsr = lot ? n(lot.fsr) : null;

                return (
                  <li key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-neutral-500">
                          {new Date(p.createdAt).toLocaleString()}
                          {p.targetTimeline && (
                            <> · Target {new Date(p.targetTimeline).toLocaleDateString()}</>
                          )}
                        </div>

                        <h3 className="text-base font-semibold mt-1">
                          {p.projectType ?? "Project"}
                        </h3>

                        <p className="text-sm text-neutral-700">
                          {p.siteAddress ?? "(no address yet)"}
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {p.sizeStoreys != null && (
                          <span className="text-xs rounded-full border px-2 py-0.5">
                            {p.sizeStoreys} storeys
                          </span>
                        )}
                        {p.budgetBand && (
                          <span className="text-xs rounded-full border px-2 py-0.5">
                            {p.budgetBand}
                          </span>
                        )}
                        {lot?.zoneCode && (
                          <span className="text-xs rounded-full border px-2 py-0.5">
                            Zone {lot.zoneCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <hr className="my-4 border-neutral-100" />

                    {/* Zoning / lot block */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="text-neutral-500">Council</div>
                      <div>{lot?.council ?? "—"}</div>

                      <div className="text-neutral-500">Max Height (m)</div>
                      <div>{maxHeight ?? "—"}</div>

                      <div className="text-neutral-500">FSR</div>
                      <div>{fsr ?? "—"}</div>

                      <div className="text-neutral-500">Min Lot Size (m²)</div>
                      <div>{lot?.minLotSizeSqm ?? "—"}</div>

                      {!p.siteAddress && lot?.address && (
                        <>
                          <div className="text-neutral-500">Lot Address</div>
                          <div>{lot.address}</div>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
