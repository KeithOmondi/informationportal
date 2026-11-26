// A judge's air tickets, uploaded by the Help Desk. The judge downloads each one here instead of
// receiving it on WhatsApp. New tickets (not yet downloaded) are marked.
import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Download, FileText, Loader2, Plane } from "lucide-react";
import { api } from "../../api/axios";

interface Ticket {
  id: string;
  trip: string | null;
  travelDate: string | null;
  ticketRef: string | null;
  note: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sentAt: string;
  opened: boolean;
}

const errorOf = (err: unknown, fallback: string) =>
  err instanceof AxiosError ? (err.response?.data?.message ?? fallback) : fallback;

const longDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "";

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function JudgeTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Ticket[] }>("/my-tickets");
      setTickets(data.data ?? []);
    } catch (err) {
      toast.error(errorOf(err, "Could not load your tickets"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const download = async (t: Ticket) => {
    setBusy(t.id);
    try {
      const { data } = await api.get<{ url: string }>(`/my-tickets/${t.id}/download`);
      const a = document.createElement("a");
      a.href = data.url;
      a.rel = "noopener";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTickets((list) => list.map((x) => (x.id === t.id ? { ...x, opened: true } : x)));
    } catch (err) {
      toast.error(errorOf(err, "Could not open the ticket"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-xl font-bold text-[#355E3B]"><Plane size={20} /> My Air Tickets</h1>
        <p className="mt-1 text-sm text-slate-500">Your air tickets, uploaded by the Help Desk. Download them here.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No tickets yet. When the Help Desk sends your ticket, it will appear here.
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-base font-bold text-slate-800">{t.trip || "Air ticket"}</span>
                  {!t.opened && <span className="rounded-full bg-[#C9A24A] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#14301f]">New</span>}
                </div>
                {(t.travelDate || t.ticketRef) && (
                  <p className="mt-0.5 text-sm text-slate-600">{[longDate(t.travelDate), t.ticketRef].filter(Boolean).join(" · ")}</p>
                )}
                {t.note && <p className="mt-1 text-sm text-slate-600">{t.note}</p>}
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><FileText size={12} /> <span className="break-all">{t.fileName}</span> · {size(t.sizeBytes)}</p>
              </div>
              <button
                type="button"
                onClick={() => void download(t)}
                disabled={busy === t.id}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#355E3B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2b4d31] disabled:opacity-60"
              >
                {busy === t.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
