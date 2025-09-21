// components/WhatsNewModal.tsx
"use client";
import { useEffect, useState } from "react";

type Release = { version: string; date?: string; notes: string };

const OWNER = "xk2800-us";
const REPO = "dumb-dumb";

export default function WhatsNewModal() {
  const [data, setData] = useState<Release | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Try session cache first to reduce rate-limit hits
    const cached = sessionStorage.getItem("latestReleased");
    if (cached) {
      const r: Release = JSON.parse(cached);
      setData(r);
      const seen = localStorage.getItem("seenlastVersion");
      if (r.version && seen !== r.version) setOpen(true);
      return;
    }

    (async () => {
      // Public endpoint for public repos — no token needed
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return; // silently skip if rate-limited or unavailable

      const rel = await res.json();
      const release: Release = {
        version: String(rel.tag_name || "").replace(/^v/i, ""),
        date: rel.published_at?.slice(0, 10),
        notes: rel.body || "",
      };

      sessionStorage.setItem("latestRelease", JSON.stringify(release));
      setData(release);

      const seen = localStorage.getItem("seenlastVersion");
      if (release.version && seen !== release.version) setOpen(true);
    })();
  }, []);

  if (!data || !open) return null;

  const close = () => {
    localStorage.setItem("lastSeenVersion", data.version);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold">
          What’s new in v{data.version}{data.date ? ` — ${data.date}` : ""}
        </h2>
        {/* Render as plain text; keep it simple. Markdown will still read fine. */}
        <div className="mt-3 whitespace-pre-wrap leading-relaxed">
          {data.notes}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={close}
            className="rounded-xl px-4 py-2 bg-neutral-900 text-white"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
