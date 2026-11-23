// A reading window for a view-only document.
//
// The pages arrive from the server as pictures with the reader's name already stamped across them, and are
// painted onto canvases here (there is no <img> to save, and no file to download). While it is open the window
// also blocks the usual ways of copying: right-click, drag, print, save, copy, and it hides the page whenever
// the browser window loses focus (which is what happens when a snipping tool starts).
//
// A website cannot stop a phone photo or a screen recording. The stamp on every page is what makes a leak traceable.

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Lock, X } from "lucide-react";
import { api } from "../../api/axios";

export interface ViewDoc {
  id: string;
  title: string;
  description?: string;
  pageCount: number;
}

const GREEN = "#1B3A2A";
const GOLD = "#C9A24A";

/** One page: fetched as a picture, painted onto a canvas. */
const PageCanvas = ({ docId, pageNo, active, onMissing }: { docId: string; pageNo: number; active: boolean; onMissing: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "failed">("idle");
  const [near, setNear] = useState(pageNo <= 2);

  // Start loading a page a little before it scrolls into view
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || !active || state !== "idle") return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setState("loading");
      try {
        const res = await api.get(`/view-docs/${docId}/pages/${pageNo}`, { responseType: "blob", timeout: 90000 });
        const bitmap = await createImageBitmap(res.data as Blob);
        if (cancelled) return bitmap.close();
        const canvas = canvasRef.current;
        if (!canvas) return bitmap.close();
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
        bitmap.close();
        setState("done");
      } catch {
        if (!cancelled) {
          setState("failed");
          onMissing();
        }
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [near, active, state, docId, pageNo, onMissing]);

  return (
    <div ref={holderRef} className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-sm bg-white shadow-lg" style={{ minHeight: state === "done" ? undefined : 520 }}>
      <canvas ref={canvasRef} className="block h-auto w-full" style={{ display: state === "done" ? "block" : "none" }} />
      {state !== "done" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          {state === "failed" ? (
            <>
              <p className="text-xs font-semibold">Page {pageNo} could not be loaded.</p>
              <button onClick={() => setState("idle")} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50">Try again</button>
            </>
          ) : (
            <>
              <Loader2 className="animate-spin" size={22} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Page {pageNo}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ViewOnlyViewer = ({ doc, onClose }: { doc: ViewDoc; onClose: () => void }) => {
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState(false);
  const noop = useCallback(() => {}, []);

  // Printing prints nothing but a notice
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@media print { body * { visibility: hidden !important; } body::before { content: "Printing is not allowed for this document."; visibility: visible !important; position: fixed; top: 40%; left: 0; right: 0; text-align: center; font: 700 20px sans-serif; } }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const hide = () => setPaused(true);
    const onVisibility = () => document.hidden && hide();

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === "Escape") return onClose();
      if (e.key === "PrintScreen" || k === "printscreen") {
        navigator.clipboard?.writeText?.("").catch(() => undefined);
        setFlash(true);
        setTimeout(() => setFlash(false), 1800);
        e.preventDefault();
        return;
      }
      // save, print, copy, select all, view source, developer tools
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a", "u", "x"].includes(k)) e.preventDefault();
      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c", "s"].includes(k))) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText?.("").catch(() => undefined);
        setFlash(true);
        setTimeout(() => setFlash(false), 1800);
      }
    };

    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKeyUp, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const block = (e: React.SyntheticEvent) => e.preventDefault();
  const pages = Array.from({ length: doc.pageCount }, (_, i) => i + 1);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-slate-900/95 select-none"
      style={{ WebkitTouchCallout: "none", userSelect: "none" }}
      onContextMenu={block}
      onDragStart={block}
      onCopy={block}
      onCut={block}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white md:px-8" style={{ background: GREEN }}>
        <div className="min-w-0">
          <p className="truncate font-serif text-base font-bold md:text-lg">{doc.title}</p>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            <Lock size={11} /> View only · {doc.pageCount} page{doc.pageCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {/* Pages */}
      <div className="relative flex-1 overflow-y-auto px-3 py-6 md:px-8" onContextMenu={block}>
        <div className="space-y-5" style={{ pointerEvents: paused ? "none" : "auto", filter: paused || flash ? "blur(28px)" : "none", transition: "filter 120ms" }}>
          {pages.map((n) => (
            <PageCanvas key={n} docId={doc.id} pageNo={n} active={!paused} onMissing={noop} />
          ))}
          <p className="pb-6 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">End of document</p>
        </div>

        {(paused || flash) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 p-6 text-center">
            <div className="max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
              <Lock className="mx-auto mb-3" size={28} style={{ color: GREEN }} />
              <p className="font-serif text-lg font-bold" style={{ color: GREEN }}>
                {flash ? "Screenshots are not permitted" : "Reading paused"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {flash
                  ? "This document is for viewing only. Every page carries your name and the time."
                  : "The document is hidden while this window is not in focus."}
              </p>
              {!flash && (
                <button
                  onClick={() => setPaused(false)}
                  className="mt-5 rounded-xl px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white"
                  style={{ background: GREEN }}
                >
                  Continue reading
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOnlyViewer;
