import React, { useEffect, useState, useMemo, useRef, type JSX } from "react";
import { useDispatch, useSelector } from "react-redux";
import HTMLFlipBook from 'react-pageflip';
import {
  User,
  Presentation as PresentationIcon,
  ChevronRight,
  X,
  Download,
  BookOpen,
  Lock,
  Loader2,
  FileText,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchProgram } from "../../store/slices/programSlice";
import { fetchCeremonyInfo, type Judge } from "../../store/slices/swearingPreferenceSlice";
import { fetchPresentations, type Presentation } from "../../store/slices/presentationSlice";

import CoverP from "../../assets/CoverP.png";
import Back from "../../assets/Back.png";

/* =====================================================
    HELPERS
===================================================== */
/**
 * Formats names to Title Case while preserving specific uppercase honors/titles.
 */
const formatName = (str: string) => {
  if (!str) return "";
  const honors = ["EBS", "OGW", "PHD", "SC", "SCJ", "CBS", "EGH", "FCI", "ARB"];
  
  return str
    .split(" ")
    .map((word) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, "").toUpperCase();
      if (honors.includes(cleanWord)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

/* =====================================================
    FLIPBOOK PAGE COMPONENT
===================================================== */
const Page = React.forwardRef<HTMLDivElement, { number: number; children: React.ReactNode; isCover?: boolean }>((props, ref) => {
  return (
    <div 
      className={`w-full h-full flex flex-col relative overflow-hidden ${props.isCover ? 'bg-white' : 'bg-[#fdfbf7]'}`} 
      ref={ref}
      style={!props.isCover ? {
        background: "linear-gradient(to right, #fdfbf7 0%, #ffffff 5%, #ffffff 95%, #fdfbf7 100%)",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.05)"
      } : {}}
    >
      <div className={`flex-1 flex flex-col relative z-0 ${!props.isCover ? 'm-3 sm:m-6 border border-[#355E3B]/10 p-4 sm:p-8 rounded-sm overflow-hidden' : 'h-full w-full'}`}>
        {props.children}
        {!props.isCover && props.number > 1 && (
          <div className="absolute bottom-3 right-6 text-[8px] font-black text-slate-400 tracking-widest uppercase bg-inherit px-1">
            P. {props.number}
          </div>
        )}
      </div>
    </div>
  );
});
Page.displayName = "Page";

/* =====================================================
    BIO MODAL
===================================================== */
const BioModal: React.FC<{ isOpen: boolean; onClose: () => void; data: Judge | null }> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/95 backdrop-blur-md">
      <div className="relative bg-white w-full max-w-5xl rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[95vh] flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 z-[60] p-2.5 bg-black/40 text-white rounded-full transition-transform active:scale-95">
          <X size={20} />
        </button>
        <div className="relative w-full md:w-[45%] bg-slate-200 shrink-0 h-[40vh] md:h-auto">
          <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover object-top" alt={data.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e1d] via-[#1a2e1d]/20 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 w-full p-8">
            <h3 className="font-serif font-bold text-2xl text-white">{formatName(data.name)}</h3>
            <p className="text-[#C5A059] font-black text-[10px] uppercase tracking-widest">{data.title}</p>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          <div className="text-slate-600 leading-relaxed font-serif italic whitespace-pre-line text-sm sm:text-base">
            {data.description || "Official records are currently being updated by the Secretariat."}
          </div>
        </div>
      </div>
    </div>
  );
};

const JudgesReligion = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isInitialMount = useRef(true);
  
  const { program, isInitialLoading } = useSelector((state: RootState) => state.program);
  const { judges } = useSelector((state: RootState) => state.ceremony);
  const { items: presentations } = useSelector((state: RootState) => state.presentations);

  const [activeTab, setActiveTab] = useState("PROGRAM");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [bookSize, setBookSize] = useState({ width: 450, height: 630 });
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        const w = window.innerWidth - 32;
        setBookSize({ width: w, height: w * 1.45 });
      } else {
        setBookSize({ width: 480, height: 680 });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      dispatch(fetchCeremonyInfo());
      dispatch(fetchProgram());
      dispatch(fetchPresentations());
      isInitialMount.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    const releaseTime = program?.scheduledRelease;
    const isLocked = program?.isLocked;
    if (!releaseTime || !isLocked) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const target = new Date(releaseTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        dispatch(fetchProgram());
        clearInterval(timer);
      } else {
        setTimeLeft({
          h: Math.floor((diff / (1000 * 60 * 60))),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [program?.scheduledRelease, program?.isLocked, dispatch]);

  const flipbookKey = useMemo(() => {
    return `fb-${activeTab}-${program?.schedule?.length || 0}-${program?.isLocked ? 'L' : 'U'}`;
  }, [activeTab, program]);

  const programPages = useMemo(() => {
    const pages: JSX.Element[] = [];
    let pageCounter = 1;

    pages.push(
      <Page key="cover" number={pageCounter++} isCover={true}>
        <div className="absolute inset-0 w-full h-full">
          <img src={CoverP} alt="Cover" className="w-full h-full object-cover" />
        </div>
      </Page>
    );

    const scheduleArray = program?.schedule || (Array.isArray(program) ? program : []);
    
    if (scheduleArray.length === 0) {
      pages.push(
        <Page key="placeholder" number={pageCounter++}>
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <BookOpen className="w-12 h-12 text-[#355E3B] opacity-10 mb-4" />
            <h2 className="font-serif text-lg text-[#355E3B] uppercase tracking-tighter font-bold">Conference Programme</h2>
            <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">Awaiting Synchronization...</p>
          </div>
        </Page>
      );
    } else {
      const MAX_PAGE_WEIGHT = 900;
      const MIN_ITEMS_PER_PAGE = 2;

      scheduleArray.forEach((day: any, dayIdx: number) => {
        let currentPageActivities: any[] = [];
        let currentWeight = 0;
        const activities = day.activities || [];

        activities.forEach((act: any) => {
          const itemWeight = (act.activity?.length || 0) + (act.facilitator?.length || 0) + 150;
          if (currentWeight + itemWeight > MAX_PAGE_WEIGHT && currentPageActivities.length >= MIN_ITEMS_PER_PAGE) {
            pages.push(renderSchedulePage(day, currentPageActivities, pageCounter++, true, dayIdx));
            currentPageActivities = [];
            currentWeight = 0;
          }
          currentPageActivities.push(act);
          currentWeight += itemWeight;
        });

        if (currentPageActivities.length > 0) {
          const isContinuation = activities.length > 0 && currentPageActivities[0] !== activities[0];
          pages.push(renderSchedulePage(day, currentPageActivities, pageCounter++, isContinuation, dayIdx));
        }
      });
    }

    if (pages.length % 2 !== 0) {
        pages.push(
          <Page key={`filler-${pageCounter}`} number={pageCounter++}>
             <div className="flex items-center justify-center h-full opacity-5 font-serif text-[10px]">End of Program</div>
          </Page>
        );
    }

    pages.push(
      <Page key="back-cover" number={pageCounter++} isCover={true}>
        <div className="absolute inset-0 w-full h-full">
          <img src={Back} alt="Back Cover" className="w-full h-full object-cover" />
        </div>
      </Page>
    );

    return pages;
  }, [program]);

  function renderSchedulePage(day: any, activities: any[], pageNum: number, isContinuation: boolean, dayIdx: number) {
    return (
      <Page key={`day-${dayIdx}-page-${pageNum}`} number={pageNum}>
        <div className="flex flex-col h-full">
          <header className="border-b-2 border-[#355E3B]/20 pb-3 mb-4 shrink-0">
            <h2 className="text-[#355E3B] font-serif text-base sm:text-lg font-bold uppercase tracking-tight">
              Day {day.day} {isContinuation && <span className="text-[#C5A059] ml-2 text-[10px] italic">(Cont.)</span>}
            </h2>
            <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.2em]">
              {day.date ? new Date(day.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </header>

          {!isContinuation && day.session_chairs && day.session_chairs.length > 0 && (
            <div className="mb-6 bg-[#355E3B]/5 p-3 rounded-xl border border-[#355E3B]/10">
              <h4 className="text-[9px] font-black text-[#355E3B] uppercase tracking-widest mb-2 opacity-70">Session Chairs</h4>
              <ul className="space-y-1">
                {day.session_chairs.map((chair: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-[10px] font-serif font-bold text-slate-700">
                    <div className="w-1 h-1 bg-[#C5A059] rounded-full" />
                    {formatName(chair)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex-1 flex flex-col space-y-5">
            {activities.map((act: any, i: number) => (
              <div key={i} className="flex gap-4 border-b border-slate-100/60 pb-4 last:border-0 items-start">
                <span className="text-[#355E3B] font-mono text-[10px] sm:text-[11px] font-bold shrink-0 mt-1 bg-slate-100/50 px-2 py-0.5 rounded">
                  {act.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-[12px] font-serif font-bold text-slate-900 leading-snug break-words tracking-tight uppercase">
                    {act.activity}
                  </p>
                  
                  {act.facilitator && (
                    <ul className="mt-2.5 space-y-1.5">
                      {act.facilitator.split(/\n|•/).map((name: string, idx: number) => {
                        const trimmedName = name.trim();
                        if (!trimmedName) return null;
                        return (
                          <li key={idx} className="flex items-start gap-2 text-[9px] sm:text-[10px] text-[#355E3B] italic font-medium leading-tight">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-[#C5A059]/60 shrink-0" />
                            <span>{formatName(trimmedName)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <div className="flex flex-col min-h-screen sm:h-[calc(100vh-140px)] max-w-7xl mx-auto bg-white sm:border border-slate-200 sm:rounded-[2.5rem] overflow-hidden shadow-sm">
      <header className="p-4 sm:p-8 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-50 sm:relative">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#355E3B] rounded-full" />
            <div>
              <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.3em]">Republic of Kenya</p>
              <h1 className="text-[#355E3B] font-serif text-xl sm:text-2xl font-bold uppercase tracking-tight">Office of the Registrar High Court</h1>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner overflow-x-auto no-scrollbar">
            {[
              { id: "PROGRAM", label: "Program", icon: <BookOpen size={14} /> },
              { id: "BIO", label: "Bio", icon: <User size={14} /> },
              { id: "PRESENTATION", label: "Presentations", icon: <PresentationIcon size={14} /> },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === tab.id ? "bg-white text-[#355E3B] shadow-md" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-12 bg-[#F8FAFC]/30">
        {activeTab === "PROGRAM" && (
          <div key="program-container" className="max-w-5xl mx-auto flex flex-col items-center">
            {isInitialLoading && !program ? (
               <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#355E3B]" size={32} />
               </div>
            ) : program?.isLocked ? (
              <div className="w-full max-w-md flex flex-col items-center justify-center py-12 px-6 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-[#355E3B] rounded-full flex items-center justify-center text-white mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-[#355E3B] font-serif text-xl font-bold uppercase mb-6">Under Review</h2>
                <div className="flex gap-4">
                  {[{ val: timeLeft.h, label: "Hrs" }, { val: timeLeft.m, label: "Min" }, { val: timeLeft.s, label: "Sec" }].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-1">{unit.val.toString().padStart(2, '0')}</div>
                      <span className="text-[9px] font-black text-[#C5A059] uppercase">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={flipbookKey} className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* @ts-ignore */}
                <HTMLFlipBook 
                  width={bookSize.width} height={bookSize.height}
                  size="fixed" drawShadow={true} usePortrait={true} 
                  mobileScrollSupport={true} className="book-container shadow-2xl"
                  startPage={0}
                >
                  {programPages}
                </HTMLFlipBook>
                <p className="mt-4 text-center text-[10px] text-slate-400 font-serif italic">Swipe or tap corners to flip pages</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "BIO" && (
           <div key="bio-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-10">
            {judges.map((judge) => (
              <div key={judge._id} onClick={() => setSelectedJudge(judge)} className="cursor-pointer bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-5 hover:border-[#C5A059] transition-all group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                  <img src={judge.imageUrl} className="w-full h-full object-cover" alt={judge.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-serif font-bold text-[#355E3B] truncate">{formatName(judge.name)}</h3>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase mt-0.5">{judge.title}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#355E3B]" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "PRESENTATION" && (
          <div key="presentation-container" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto pb-10">
            {presentations.map((pres: Presentation) => (
              <div key={pres._id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#355E3B]/5 rounded-2xl text-[#355E3B]"><FileText size={24} /></div>
                  <a href={pres.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase text-[#C5A059]">
                    Download <Download size={14} />
                  </a>
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-800 leading-tight mb-1 uppercase line-clamp-2">{pres.title}</h3>
              </div>
            ))}
          </div>
        )}
      </main>
      <BioModal isOpen={!!selectedJudge} onClose={() => setSelectedJudge(null)} data={selectedJudge} />
    </div>
  );
};

export default JudgesReligion;