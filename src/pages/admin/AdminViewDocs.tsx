// Admin: add and manage the view-only documents (PDF only). Judges and deputy registrars read them in the
// Confidential Correspondence; nobody can download them.

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Eye, FileText, Loader2, Lock, Trash2, Upload, X } from "lucide-react";
import { api } from "../../api/axios";
import ViewOnlyViewer, { type ViewDoc } from "../../components/viewonly/ViewOnlyViewer";

interface AdminDoc extends ViewDoc {
  createdAt: string;
  fileSize?: number;
  targetAudience: string[];
  readers: number;
  uploadedByName?: string;
}

const GREEN = "#1B3A2A";
const GOLD = "#C9A24A";

const audienceLabel = (a: string[]) => (a.includes("all") || a.length === 0 ? "Judges and DRs" : a.map((x) => (x === "judge" ? "Judges" : "DRs")).join(" and "));
const size = (b?: number) => (b ? (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : "");
const errOf = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;

const AdminViewDocs = () => {
  const [docs, setDocs] = useState<AdminDoc[] | null>(null);
  const [open, setOpen] = useState<AdminDoc | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<"all" | "judge" | "dr">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/view-docs", { timeout: 30000 });
      setDocs(res.data.data as AdminDoc[]);
    } catch {
      toast.error("Could not load the documents.");
      setDocs((cur) => cur ?? []);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setAudience("all");
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Choose a PDF first.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return toast.error("Only PDF files can be added.");
    const body = new FormData();
    body.append("file", file);
    body.append("title", title.trim() || file.name.replace(/\.pdf$/i, ""));
    body.append("description", description.trim());
    body.append("targetAudience", JSON.stringify([audience]));
    setSaving(true);
    try {
      await api.post("/view-docs", body, { headers: { "Content-Type": "multipart/form-data" }, timeout: 180000 });
      toast.success("Document added. It shows as NEW to everyone it is shared with.");
      reset();
      setShowForm(false);
      void load();
    } catch (err) {
      toast.error(errOf(err, "Could not add the document."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: AdminDoc) => {
    if (!window.confirm(`Take "${d.title}" down? Nobody will be able to read it any more.`)) return;
    try {
      await api.delete(`/view-docs/${d.id}`);
      toast.success("Document taken down.");
      void load();
    } catch (err) {
      toast.error(errOf(err, "Could not remove the document."));
    }
  };

  const changeAudience = async (d: AdminDoc, value: "all" | "judge" | "dr") => {
    try {
      await api.put(`/view-docs/${d.id}`, { targetAudience: [value] });
      toast.success("Sharing updated.");
      void load();
    } catch (err) {
      toast.error(errOf(err, "Could not change who it is shared with."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: GREEN }}>Confidential Correspondence</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Lock size={14} style={{ color: GOLD }} /> PDFs that can be read but not downloaded. Every page carries the reader&apos;s name.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg md:self-auto"
          style={{ background: GREEN }}
        >
          {showForm ? <X size={16} /> : <Upload size={16} />} {showForm ? "Close" : "Add document"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={upload} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">PDF file *</label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !title) setTitle(f.name.replace(/\.pdf$/i, ""));
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#1B3A2A] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
              />
              <p className="mt-1 text-[11px] text-slate-400">PDF only, up to 30 MB. Password-protected files are not accepted.</p>
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Shared with</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as "all" | "judge" | "dr")}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
              >
                <option value="all">Judges and Deputy Registrars</option>
                <option value="judge">Judges only</option>
                <option value="dr">Deputy Registrars only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Short description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { reset(); setShowForm(false); }} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:opacity-60" style={{ background: GREEN }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {saving ? "Uploading…" : "Add document"}
            </button>
          </div>
        </form>
      )}

      {docs === null ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
          <FileText className="mx-auto text-slate-300" size={44} />
          <p className="mt-3 text-sm font-semibold text-slate-500">No view-only documents yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {docs.map((d) => (
            <div key={d.id} className="flex flex-col gap-3 border-b border-slate-100 p-5 last:border-0 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="rounded-xl p-3" style={{ background: "#e9efe9" }}>
                  <FileText size={22} style={{ color: GREEN }} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-bold" style={{ color: GREEN }}>{d.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {d.pageCount} page{d.pageCount !== 1 ? "s" : ""}{d.fileSize ? ` · ${size(d.fileSize)}` : ""} · added {new Date(d.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {d.uploadedByName ? ` by ${d.uploadedByName}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    Read by {d.readers} {d.readers === 1 ? "person" : "people"} · shared with {audienceLabel(d.targetAudience)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <select
                  value={d.targetAudience.includes("judge") && !d.targetAudience.includes("all") ? "judge" : d.targetAudience.includes("dr") && !d.targetAudience.includes("all") ? "dr" : "all"}
                  onChange={(e) => void changeAudience(d, e.target.value as "all" | "judge" | "dr")}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                  aria-label="Shared with"
                >
                  <option value="all">Judges and DRs</option>
                  <option value="judge">Judges only</option>
                  <option value="dr">DRs only</option>
                </select>
                <button onClick={() => setOpen(d)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Eye size={14} /> Preview
                </button>
                <button onClick={() => void remove(d)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                  <Trash2 size={14} /> Take down
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <ViewOnlyViewer doc={open} onClose={() => setOpen(null)} />}
    </div>
  );
};

export default AdminViewDocs;
