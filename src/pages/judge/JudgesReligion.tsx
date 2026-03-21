import React, { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchProgram } from "../../store/slices/programSlice";
import { fetchCeremonyInfo, type Judge } from "../../store/slices/swearingPreferenceSlice";
import Cover from "../../assets/Cover.png";

/* =====================================================
    FLIPBOOK PAGE COMPONENT
===================================================== */
const Page = React.forwardRef<HTMLDivElement, { number: number; children: React.ReactNode; isCover?: boolean }>((props, ref) => {
  return (
    <div 
      className={`w-full h-full flex flex-col relative overflow-hidden ${props.isCover ? 'bg-white shadow-xl' : 'bg-[#fdfbf7]'}`} 
      ref={ref}
      style={!props.isCover ? {
        background: "linear-gradient(to right, #fdfbf7 0%, #ffffff 5%, #ffffff 95%, #fdfbf7 100%)",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.05)"
      } : {}}
    >
      <div className={`flex-1 relative z-0 ${!props.isCover ? 'm-2 sm:m-4 border border-[#355E3B]/10 p-3 sm:p-6 rounded-sm' : ''}`}>
        {props.children}
        {!props.isCover && props.number > 1 && (
          <div className="absolute bottom-2 right-4 text-[7px] font-black text-slate-300 tracking-widest uppercase">
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative bg-white w-full max-w-5xl rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-500 max-h-[95vh] flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 z-[60] p-2.5 bg-black/40 hover:bg-[#355E3B] text-white rounded-full transition-all border border-white/20">
          <X size={20} />
        </button>
        <div className="relative w-full md:w-[45%] bg-slate-200 shrink-0 h-[45vh] md:h-auto overflow-hidden">
          <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover object-top" alt={data.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e1d] via-[#1a2e1d]/20 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 w-full p-8">
            <h3 className="font-serif font-bold text-2xl text-white">{data.name}</h3>
            <p className="text-[#C5A059] font-black text-[10px] uppercase tracking-widest">{data.title}</p>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          <div className="text-slate-600 leading-relaxed font-serif italic whitespace-pre-line">
            {data.description || "Official records are currently being updated by the Secretariat."}
          </div>
        </div>
      </div>
    </div>
  );
};

const JudgesReligion = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { program } = useSelector((state: RootState) => state.program);
  const { judges, presentations } = useSelector((state: RootState) => state.ceremony);
  const [activeTab, setActiveTab] = useState("PROGRAM");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  
  // COUNTDOWN LOGIC
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    dispatch(fetchCeremonyInfo());
    dispatch(fetchProgram());

    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 59, 999); // Set to 11:59:59 PM today

      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        setIsLocked(false);
        clearInterval(timer);
      } else {
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        setTimeLeft({ h, m, s });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch]);

  const tabs = [
    { id: "PROGRAM", label: "Program", icon: <BookOpen size={14} /> },
    { id: "BIO", label: "Bio", icon: <User size={14} /> },
    { id: "PRESENTATION", label: "Presentations", icon: <PresentationIcon size={14} /> },
  ];

  const programPages = useMemo(() => {
    if (!program?.schedule || program.schedule.length === 0) return [];
    const pages = [];

    // 1. Cover Page
    pages.push(
      <Page key="cover" number={1} isCover={true}>
        <div className="absolute inset-0 w-full h-full bg-white">
          <img src={Cover} alt="Cover" className="w-full h-full object-fill" />
        </div>
      </Page>
    );

    // 2. Schedule Pages
    program.schedule.forEach((day, index) => {
      pages.push(
        <Page key={day._id || `day-${index}`} number={index + 2}>
          <div className="flex flex-col h-full">
            <header className="border-b-2 border-[#355E3B]/20 pb-3 mb-6">
              <h2 className="text-[#355E3B] font-serif text-base font-bold uppercase">Day {day.day}</h2>
              <p className="text-[#C5A059] text-[8px] font-black uppercase tracking-widest">
                {day.date ? new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
              {day.activities?.map((act, i) => (
                <div key={i} className="flex gap-4 border-b border-slate-100 pb-3 items-start">
                  <span className="text-[#C5A059] font-mono text-[9px] font-bold shrink-0 mt-1">{act.time}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-serif font-bold text-slate-800 leading-tight uppercase">{act.activity}</p>
                    {act.facilitator && <p className="text-[9px] text-[#355E3B] mt-1 italic">{act.facilitator}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Page>
      );
    });
    return pages;
  }, [program]);

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
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner">
            {tabs.map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id ? "bg-white text-[#355E3B] shadow-lg" : "text-slate-500 hover:text-slate-800"}`}
              >
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-12 bg-[#F8FAFC]/30 custom-scrollbar relative">
        {activeTab === "PROGRAM" && (
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            {/* Countdown Lock Overlay */}
            {isLocked ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/80 backdrop-blur-sm rounded-[3rem] border border-slate-100 shadow-xl animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-[#355E3B] rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-[#355E3B]/20">
                  <Lock size={32} />
                </div>
                <h2 className="text-[#355E3B] font-serif text-2xl font-bold uppercase tracking-tight mb-2">Under Review</h2>
                
                <div className="flex gap-4">
                  {timeLeft && [
                    { val: timeLeft.h, label: "Hrs" },
                    { val: timeLeft.m, label: "Min" },
                    { val: timeLeft.s, label: "Sec" }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="bg-slate-900 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mb-1">
                        {unit.val.toString().padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : programPages.length > 0 ? (
              /* @ts-ignore */
              <HTMLFlipBook 
                width={450} height={630} size="stretch" 
                minWidth={300} maxWidth={900} 
                minHeight={450} maxHeight={1200} 
                drawShadow={true} usePortrait={true} 
                mobileScrollSupport={true} 
                className="book-container shadow-2xl"
              >
                {programPages}
              </HTMLFlipBook>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-serif italic">Loading Conference Program...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "BIO" && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {judges.map((judge) => (
              <div key={judge._id} onClick={() => setSelectedJudge(judge)} className="cursor-pointer bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-5 hover:border-[#C5A059] transition-all shadow-sm group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                  <img src={judge.imageUrl} className="w-full h-full object-cover" alt={judge.name} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-serif font-bold text-[#355E3B] truncate">{judge.name}</h3>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase mt-0.5">{judge.title}</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-[#355E3B]" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "PRESENTATION" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {presentations.map((pres, idx) => (
              <div key={pres._id || idx} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#355E3B]/5 rounded-2xl text-[#355E3B]">
                    <PresentationIcon size={24} />
                  </div>
                  <a href={pres.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase text-[#C5A059] hover:text-[#355E3B]">
                    View File <Download size={14} />
                  </a>
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-800 leading-tight mb-2 uppercase">{pres.title}</h3>
                <p className="text-xs text-slate-500 italic">
                  Presenter: {(pres as any).author || (pres as any).facilitator || (pres as any).presenter || "Judicial Secretariat"}
                </p>
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