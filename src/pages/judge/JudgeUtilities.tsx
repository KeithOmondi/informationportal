// A judge adds their utility bills here instead of emailing them to the Registry, and follows each one
// until it is paid. A bill can be corrected or withdrawn only until the Registry starts on it.
import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { FileText, Loader2, Paperclip, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import { api } from "../../api/axios";

interface Bill {
  id: string;
  utilityType: string;
  amount: number;
  billMonth: string;
  dateReceived: string | null;
  stage: "Sent" | "Received" | "With approval" | "Approved" | "Paid" | "Returned";
  acknowledgedAt: string | null;
  billUrl: string | null;
  sentByYou: boolean;
  /** The staff member who entered the bill, when the judge did not. */
  addedBy?: string | null;
  editable: boolean;
}

interface Listing {
  registered: boolean;
  message?: string;
  name?: string;
  pj?: string;
  types: string[];
  data: Bill[];
}

const STAGE_STYLE: Record<Bill["stage"], string> = {
  Sent: "bg-slate-100 text-slate-600",
  Received: "bg-teal-50 text-teal-700",
  "With approval": "bg-amber-50 text-amber-700",
  Approved: "bg-blue-50 text-blue-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Returned: "bg-red-50 text-red-700",
};

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const money = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const errorOf = (err: unknown, fallback: string) =>
  err instanceof AxiosError ? (err.response?.data?.message ?? fallback) : fallback;

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#355E3B] focus:outline-none focus:ring-1 focus:ring-[#355E3B]";

export default function JudgeUtilities() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [type, setType] = useState("Electricity");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(thisMonth());
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Listing>("/utilities");
      setListing(data);
    } catch (err) {
      toast.error(errorOf(err, "Could not load your bills."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const reset = () => {
    setEditing(null);
    setAmount("");
    setFile(null);
    setMonth(thisMonth());
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (b: Bill) => {
    setEditing(b);
    setType(b.utilityType);
    setAmount(String(b.amount));
    const parsed = new Date(`1 ${b.billMonth}`);
    if (!Number.isNaN(parsed.getTime())) {
      setMonth(`${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`);
    }
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("amount", amount);
    form.append("bill_month", month);
    if (file) form.append("bill", file);
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/utilities/${editing.id}`, form);
        toast.success("Bill updated.");
      } else {
        form.append("utility_type", type);
        await api.post("/utilities", form);
        toast.success("Bill sent to the orhc helpdesk.");
      }
      reset();
      await load();
    } catch (err) {
      toast.error(errorOf(err, "Could not save your bill."));
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (b: Bill) => {
    if (!window.confirm(`Withdraw the ${b.utilityType} bill for ${b.billMonth} (${money(b.amount)})?`)) return;
    try {
      await api.delete(`/utilities/${b.id}`);
      toast.success("Bill withdrawn.");
      if (editing?.id === b.id) reset();
      await load();
    } catch (err) {
      toast.error(errorOf(err, "Could not withdraw the bill."));
      await load();
    }
  };

  if (loading || !listing) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      <header className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#355E3B]/10 text-[#355E3B]">
          <Zap size={22} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#355E3B]">My Utilities</h1>
          <p className="text-sm text-slate-500">
            Add your utility bills here instead of emailing them to the Registry.
            {listing.name ? ` ${listing.name}${listing.pj ? ` · PJ ${listing.pj}` : ""}` : ""}
          </p>
        </div>
      </header>

      {!listing.registered ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{listing.message}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-slate-800">
              {editing ? `Correct your ${editing.utilityType} bill` : "Add a bill"}
            </h2>
            {editing && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
                <X size={14} /> Cancel
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Type of bill</span>
              <select className={input} value={type} onChange={(e) => setType(e.target.value)} disabled={!!editing}>
                {listing.types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Amount (KES)</span>
              <input className={input} inputMode="decimal" placeholder="e.g. 4,250.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Bill is for (month)</span>
              <input className={input} type="month" max={thisMonth()} value={month} onChange={(e) => setMonth(e.target.value)} required />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Copy of the bill {editing ? "(leave empty to keep the current one)" : "(PDF or photo, recommended)"}
            </span>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-[#355E3B]">
              <Paperclip size={16} />
              <span className="truncate">{file ? file.name : "Click to attach the bill"}</span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#355E3B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2b4d30] disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? <Pencil size={16} /> : <Plus size={16} />}
            {editing ? "Save changes" : "Send to the Registry"}
          </button>
        </form>
      )}

      {listing.registered && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-5 py-4 font-serif text-lg font-bold text-slate-800">Your bills</h2>
          {listing.data.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No bills yet. Add your first one above.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {listing.data.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">
                      {b.utilityType} · {b.billMonth}
                    </p>
                    <p className="text-sm text-slate-600">{money(b.amount)}</p>
                    <p className="text-xs text-slate-400">
                      {b.acknowledgedAt ? `Received by the Registry ${new Date(b.acknowledgedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : b.dateReceived ? `Sent ${new Date(b.dateReceived).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                      {b.sentByYou ? "" : ` · added by ${b.addedBy ?? "the Registry"}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STAGE_STYLE[b.stage]}`}>{b.stage}</span>
                    {b.billUrl && (
                      <a href={b.billUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#355E3B]" title="View the bill">
                        <FileText size={17} />
                      </a>
                    )}
                    {b.editable && (
                      <>
                        <button type="button" onClick={() => startEdit(b)} className="text-slate-400 hover:text-[#355E3B]" title="Correct this bill">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => void withdraw(b)} className="text-slate-400 hover:text-red-600" title="Withdraw this bill">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
