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
  Video,
  Image as ImageIcon,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchProgram } from "../../store/slices/programSlice";
import { fetchCeremonyInfo, type Judge } from "../../store/slices/swearingPreferenceSlice";
import { fetchPresentations, type Presentation } from "../../store/slices/presentationSlice";

import CoverP from "../../assets/CoverP.png";

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
            <h3 className="font-serif font-bold text-2xl text-white">{data.name}</h3>
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
  
  // SELECTORS
  const { program, loading: programLoading, isInitialLoading } = useSelector((state: RootState) => state.program);
  const { judges } = useSelector((state: RootState) => state.ceremony);
  const { items: presentations, loading: presLoading } = useSelector((state: RootState) => state.presentations);

  const [activeTab, setActiveTab] = useState("PROGRAM");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [bookSize, setBookSize] = useState({ width: 450, height: 630 });
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  // 1. Responsive Book Sizing
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        const w = window.innerWidth - 32;
        setBookSize({ width: w, height: w * 1.45 });
      } else {
        setBookSize({ width: 480, height: 680 }); // Slightly larger base size
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 2. Initial Data Loading
  useEffect(() => {
    if (isInitialMount.current) {
      dispatch(fetchCeremonyInfo());
      dispatch(fetchProgram());
      dispatch(fetchPresentations());
      isInitialMount.current = false;
    }
  }, [dispatch]);

  // 3. Dynamic Timer Logic (FIXED DEPENDENCY ARRAY)
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

  // 4. Page Rendering Logic (UPDATED FONT SIZES & GAPS)
  const programPages = useMemo(() => {
    if (!program?.schedule || program.schedule.length === 0) return [];

    const pages: JSX.Element[] = [];
    let pageCounter = 1;

    pages.push(
      <Page key="cover" number={pageCounter++} isCover={true}>
        <div className="absolute inset-0 w-full h-full">
          <img src={CoverP} alt="Cover" className="w-full h-full object-cover" />
        </div>
      </Page>
    );

    const MAX_PAGE_WEIGHT = 950; // Higher weight to allow larger spacing
    const MIN_ITEMS_PER_PAGE = 4; // Ensure each page has at least 4 items

    program.schedule.forEach((day, dayIdx) => {
      let currentPageActivities: any[] = [];
      let currentWeight = 0;

      day.activities?.forEach((act: any) => {
        const itemWeight = (act.activity?.length || 0) + (act.facilitator?.length || 0) + 120;
        
        if (currentWeight + itemWeight > MAX_PAGE_WEIGHT && currentPageActivities.length >= MIN_ITEMS_PER_PAGE) {
          pages.push(renderSchedulePage(day, currentPageActivities, pageCounter++, true, dayIdx));
          currentPageActivities = [];
          currentWeight = 0;
        }
        currentPageActivities.push(act);
        currentWeight += itemWeight;
      });

      if (currentPageActivities.length > 0) {
        const isActuallyContinuation = day.activities && currentPageActivities[0] !== day.activities[0];
        pages.push(renderSchedulePage(day, currentPageActivities, pageCounter++, isActuallyContinuation, dayIdx));
      }
    });

    return pages;
  }, [program]);

  function renderSchedulePage(day: any, activities: any[], pageNum: number, isContinuation: boolean, dayIdx: number) {
    return (
      <Page key={`day-${dayIdx}-page-${pageNum}`} number={pageNum}>
        <div className="flex flex-col h-full">
          <header className="border-b-2 border-[#355E3B]/20 pb-3 mb-6 shrink-0">
            <h2 className="text-[#355E3B] font-serif text-base sm:text-lg font-bold uppercase tracking-tight">
              Day {day.day} {isContinuation && <span className="text-[#C5A059] ml-2 text-[10px] italic">(Cont.)</span>}
            </h2>
            <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.2em]">
              {day.date ? new Date(day.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </header>
          
          <div className="flex-1 flex flex-col space-y-6">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-5 border-b border-slate-100/60 pb-4 last:border-0 items-start">
                <span className="text-[#355E3B] font-mono text-[10px] sm:text-[12px] font-bold shrink-0 mt-1 bg-slate-100/50 px-2 py-0.5 rounded">
                  {act.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-[13px] font-serif font-bold text-slate-900 leading-snug uppercase break-words tracking-tight">
                    {act.activity}
                  </p>
                  {act.facilitator && (
                    <p className="text-[9px] sm:text-[11px] text-[#355E3B] mt-1.5 italic font-medium leading-relaxed">
                      {act.facilitator}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Page>
    );
  }

  const tabs = [
    { id: "PROGRAM", label: "Program", icon: <BookOpen size={14} /> },
    { id: "BIO", label: "Bio", icon: <User size={14} /> },
    { id: "PRESENTATION", label: "Presentations", icon: <PresentationIcon size={14} /> },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "video": return <Video size={24} />;
      case "image": return <ImageIcon size={24} />;
      default: return <FileText size={24} />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
            {tabs.map((tab) => (
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
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            {isInitialLoading && !program ? (
               <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#355E3B]" size={32} />
                <p className="mt-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">Validating Program Access...</p>
               </div>
            ) : program?.isLocked ? (
              <div className="w-full max-w-md flex flex-col items-center justify-center py-12 px-6 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-[#355E3B] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-[#355E3B]/20">
                  <Lock size={32} />
                </div>
                <h2 className="text-[#355E3B] font-serif text-xl font-bold uppercase tracking-tight mb-6">Under Review</h2>
                <div className="flex gap-4">
                  {[
                    { val: timeLeft.h, label: "Hrs" },
                    { val: timeLeft.m, label: "Min" },
                    { val: timeLeft.s, label: "Sec" }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-1">
                        {unit.val.toString().padStart(2, '0')}
                      </div>
                      <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : programPages.length > 0 ? (
              <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                {programLoading && (
                  <div className="absolute -top-8 right-0 flex items-center gap-2">
                    <Loader2 className="animate-spin text-[#355E3B]" size={12} />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Updating...</span>
                  </div>
                )}
                {/* @ts-ignore */}
                <HTMLFlipBook 
                  width={bookSize.width} height={bookSize.height}
                  size="fixed" drawShadow={true} usePortrait={true} 
                  mobileScrollSupport={true} className="book-container shadow-2xl"
                >
                  {programPages}
                </HTMLFlipBook>
                <p className="mt-4 text-center text-[10px] text-slate-400 font-serif italic">Swipe or tap corners to flip pages</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-serif italic">The program is currently being finalized.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "BIO" && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-10">
            {judges.map((judge) => (
              <div key={judge._id} onClick={() => setSelectedJudge(judge)} className="cursor-pointer bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-5 hover:border-[#C5A059] transition-all shadow-sm group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                  <img src={judge.imageUrl} className="w-full h-full object-cover" alt={judge.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-serif font-bold text-[#355E3B] truncate">{judge.name}</h3>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase mt-0.5">{judge.title}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#355E3B]" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "PRESENTATION" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto pb-10">
            {presLoading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="animate-spin text-[#355E3B]" size={32} />
              </div>
            ) : presentations.length > 0 ? (
              presentations.map((pres: Presentation) => (
                <div key={pres._id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-[#355E3B]/5 rounded-2xl text-[#355E3B]">{getFileIcon(pres.fileType)}</div>
                    <a href={pres.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase text-[#C5A059] hover:text-[#355E3B]">
                      Download <Download size={14} />
                    </a>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-slate-800 leading-tight mb-1 uppercase line-clamp-2">{pres.title}</h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-black text-[#355E3B]/60 uppercase tracking-widest">{pres.fileType}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{formatSize(pres.fileSize)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-slate-400 font-serif italic">
                <PresentationIcon size={48} className="mx-auto mb-4 opacity-10" />
                <p>No conference materials available at this time.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <BioModal isOpen={!!selectedJudge} onClose={() => setSelectedJudge(null)} data={selectedJudge} />
    </div>
  );
};

export default JudgesReligion;