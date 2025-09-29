"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

type Project = {
  id: string;
  siteAddress?: string | null;
  projectType?: string | null;
  sizeStoreys?: number | null;
  budgetBand?: string | null;
  targetTimeline?: string | null;
  createdAt: string;
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
        // try to surface a helpful message no matter what the server returns
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
      const created = (await res.json()) as Project;
      console.log("Created project:", created);

      // reset form
      setSiteAddress("");
      setProjectType("");
      setSizeStoreys("");
      setBudgetBand("");
      setTargetTimeline("");

      // refresh list
      await refresh();
    } catch (err) {
      console.error("Create project threw:", err);
      alert("Could not create project. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <section className="rounded-2xl border p-4">
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
            className="rounded-xl border px-4 py-2 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Projects</h2>
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border p-3">
              <div className="font-medium">
                {p.siteAddress ?? "(no address yet)"}
              </div>
              {p.projectType && (
                <div className="text-sm opacity-80">{p.projectType}</div>
              )}
              {p.sizeStoreys != null && (
                <div className="text-sm opacity-80">
                  Storeys: {p.sizeStoreys}
                </div>
              )}
              {p.budgetBand && (
                <div className="text-sm opacity-80">{p.budgetBand}</div>
              )}
              <div className="text-xs opacity-60">
                Created {new Date(p.createdAt).toLocaleString()}
                {p.targetTimeline && (
                  <> · Target {new Date(p.targetTimeline).toLocaleDateString()}</>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
