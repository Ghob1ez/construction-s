"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
};

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data: Project[] = await res.json();
      setItems(data);
    })();
  }, []);

  const onNameChange = (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value);
  const onDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setDescription(e.target.value);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Create failed");
      setName("");
      setDescription("");
      router.refresh();
      const updated = await fetch("/api/projects", { cache: "no-store" });
      const data: Project[] = await updated.json();
      setItems(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <section className="rounded-2xl border p-4">
        <h2 className="text-xl font-semibold mb-3">Create a Project</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded-lg p-2"
            placeholder="Name *"
            value={name}
            onChange={onNameChange}
          />
          <textarea
            className="w-full border rounded-lg p-2"
            placeholder="Description (optional)"
            value={description}
            onChange={onDescriptionChange}
            rows={3}
          />
          <button
            disabled={submitting || !name.trim()}
            className="rounded-xl border px-4 py-2 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Projects</h2>
        <ul className="space-y-2">
          {items.map((p: Project) => (
            <li key={p.id} className="rounded-xl border p-3">
              <div className="font-medium">{p.name}</div>
              {p.description && <div className="text-sm opacity-80">{p.description}</div>}
              <div className="text-xs opacity-60">
                Created {new Date(p.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
