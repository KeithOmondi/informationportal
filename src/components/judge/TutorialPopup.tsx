// src/components/judge/TutorialPopup.tsx
//
// The tutorial video, shown as a pop-up the first time a judge signs in. It keeps coming back at each sign-in
// until the judge has watched it to the end or chosen "Don't show again". The judge can always open it again
// from the menu ("Tutorial").

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayCircle, X } from "lucide-react";
import { api } from "../../api/axios";

interface Tutorial {
  id: string;
  title: string;
  url: string;
  seen: boolean;
}

export const OPEN_TUTORIAL_EVENT = "open-tutorial";

const TutorialPopup = () => {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchCurrent = useCallback(async (): Promise<Tutorial | null> => {
    try {
      const { data } = await api.get("/tutorial/current");
      return (data.tutorial as Tutorial | null) ?? null;
    } catch {
      return null; // the tutorial must never get in the way of signing in
    }
  }, []);

  // First: on sign-in, show it if this judge has not seen it (and has not closed it already in this visit)
  useEffect(() => {
    let live = true;
    void fetchCurrent().then((t) => {
      if (!live || !t) return;
      setTutorial(t);
      let closedThisVisit = false;
      try { closedThisVisit = sessionStorage.getItem(`tutorial-closed-${t.id}`) === "1"; } catch { /* private window */ }
      if (!t.seen && !closedThisVisit) setOpen(true);
    });
    return () => { live = false; };
  }, [fetchCurrent]);

  // Opened again from the menu
  useEffect(() => {
    const onOpen = async () => {
      const t = tutorial ?? (await fetchCurrent());
      if (t) { setTutorial(t); setOpen(true); }
    };
    window.addEventListener(OPEN_TUTORIAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TUTORIAL_EVENT, onOpen);
  }, [tutorial, fetchCurrent]);

  const markSeen = useCallback(() => {
    void api.post("/tutorial/current/seen").catch(() => { /* try again at the next sign-in */ });
    setTutorial((t) => (t ? { ...t, seen: true } : t));
  }, []);

  const close = useCallback(() => {
    videoRef.current?.pause();
    if (tutorial) { try { sessionStorage.setItem(`tutorial-closed-${tutorial.id}`, "1"); } catch { /* ignore */ } }
    setOpen(false);
  }, [tutorial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !tutorial) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={tutorial.title}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 bg-[#355E3B] px-5 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <PlayCircle size={20} className="shrink-0 text-[#C5A059]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Welcome</p>
              <h2 className="truncate font-serif text-base font-bold">{tutorial.title}</h2>
            </div>
          </div>
          <button onClick={close} className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="bg-black">
          <video
            ref={videoRef}
            src={tutorial.url}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            className="max-h-[62vh] w-full"
            onEnded={markSeen}
          />
        </div>

        <div className="flex flex-col-reverse items-stretch gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">You can watch this again any time from the menu, under Tutorial.</p>
          <div className="flex gap-2">
            <button onClick={close} className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none">
              Close
            </button>
            <button
              onClick={() => { markSeen(); close(); }}
              className="flex-1 rounded-lg bg-[#355E3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b4d31] sm:flex-none"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPopup;
