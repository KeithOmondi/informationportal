// The view-only documents a judge or deputy registrar can read. A document wears a "NEW" label across its top
// until the person opens it for the first time.

import { useState } from "react";
import { BookOpen, FileText, Lock } from "lucide-react";
import ViewOnlyViewer from "./ViewOnlyViewer";
import { useViewDocs, type LibraryDoc } from "./useViewDocs";

const GREEN = "#1B3A2A";
const GOLD = "#C9A24A";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const ViewOnlyLibrary = () => {
  const { docs, error, reload } = useViewDocs();
  const [open, setOpen] = useState<LibraryDoc | null>(null);
  const [search, setSearch] = useState("");

  const shown = (docs ?? []).filter((d) => !search.trim() || `${d.title} ${d.description ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const newCount = (docs ?? []).filter((d) => d.isNew).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: GREEN }}>Confidential Correspondence</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Lock size={13} style={{ color: GOLD }} /> These documents can only be read here. They cannot be downloaded.
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Restricted viewing for authorised users only. Downloading, printing and external sharing are disabled.
          </p>
        </div>
        {newCount > 0 && (
          <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#14301f]" style={{ background: GOLD }}>
            {newCount} new
          </span>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search documents…"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A24A] focus:ring-4 focus:ring-[#C9A24A]/15 md:max-w-md"
      />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => void reload()} className="font-bold underline">Try again</button>
        </div>
      )}

      {docs === null ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
          <BookOpen className="mx-auto text-slate-300" size={44} />
          <p className="mt-3 text-sm font-semibold text-slate-500">{search ? "Nothing matches your search." : "No documents have been shared with you yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((d) => (
            <button
              key={d.id}
              onClick={() => setOpen(d)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* "NEW" across the top of the card */}
              {d.isNew && (
                <div className="flex items-center justify-center gap-2 py-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[#14301f]" style={{ background: GOLD }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14301f]" /> New
                </div>
              )}
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl p-3" style={{ background: "#e9efe9" }}>
                    <FileText size={26} style={{ color: GREEN }} />
                  </div>
                </div>
                <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug" style={{ color: GREEN }}>{d.title}</h3>
                {d.description && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{d.description}</p>}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>{d.pageCount} page{d.pageCount !== 1 ? "s" : ""} · {when(d.createdAt)}</span>
                  <span className="transition group-hover:translate-x-0.5" style={{ color: GOLD }}>Read →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <ViewOnlyViewer
          doc={open}
          onClose={() => {
            setOpen(null);
            // the "NEW" label clears once it has been opened, here and in the menu
            window.dispatchEvent(new Event("viewdocs:changed"));
          }}
        />
      )}
    </div>
  );
};

export default ViewOnlyLibrary;
