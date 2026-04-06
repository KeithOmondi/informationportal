import React, { useEffect, useState, useMemo, useRef, type JSX } from "react";
import { useDispatch, useSelector } from "react-redux";
import HTMLFlipBook from "react-pageflip";
import {
  ChevronRight, X, Download, Loader2, FileText,
  Film, Image as ImageIcon, Play, Lock, Clock
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchProgram } from "../../store/slices/programSlice";
import type { AudienceRole } from "../../store/slices/programSlice";
import { fetchCeremonyInfo, type Judge } from "../../store/slices/swearingPreferenceSlice";
import { fetchPresentations, type Presentation } from "../../store/slices/presentationSlice";

import CoverP from "../../assets/CoverP.png";
import Back from "../../assets/Back.png";

/* =====================================================
    HELPERS
===================================================== */
const formatName = (str: string) => {
  if (!str) return "";
  const upperHonors = ["EBS", "OGW", "PHD", "SC", "SCJ", "CBS", "EGH", "FCI", "ARB", "JSC"];
  const mixedHonors: Record<string, string> = {
    DR: "Dr.", "DR.": "Dr.", RTD: "Rtd", "RTD.": "Rtd.", "H.E": "H.E.", "H.E.": "H.E.",
  };
  return str
    .split(" ")
    .map((word) => {
      const cleanWord = word.toUpperCase().replace(/[^A-Z.]/g, "").replace(/\.$/, "");
      if (upperHonors.includes(cleanWord)) return word.toUpperCase();
      if (mixedHonors[cleanWord] || cleanWord === "RTD") return word.replace(/rtd/i, "Rtd");
      if (cleanWord === "DR") return "Dr.";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

/* =====================================================
    COUNTDOWN COMPONENT
===================================================== */
const ReleaseCountdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0, expired: false
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft(prev => ({ ...prev, expired: true }));
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          expired: false
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center px-4">
      <span className="text-3xl sm:text-5xl font-serif font-bold text-[#355E3B]">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-slate-100 rounded-[2rem] shadow-xl max-w-md mx-auto animate-in zoom-in duration-500">
      <div className="p-4 bg-[#355E3B]/5 rounded-full mb-6">
        <Lock className="text-[#355E3B]" size={32} />
      </div>
      <h2 className="text-[#355E3B] font-serif text-xl font-bold uppercase mb-2 text-center">Program Locked</h2>
      <p className="text-slate-500 text-xs text-center mb-8 font-medium">The Program will be available in:</p>
      
      <div className="flex divide-x divide-slate-100">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>

      <div className="mt-10 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
        <Clock size={14} className="text-[#C5A059]" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          Release: {new Date(targetDate).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>
    </div>
  );
};

/* =====================================================
    PRESENTATION CARD
===================================================== */
const PresentationCard: React.FC<{ pres: Presentation }> = ({ pres }) => {
  const isVideo = pres.fileType === "video";
  const handleDownload = () => window.open(pres.downloadUrl, "_blank");

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-[#355E3B]/30 transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="p-3 bg-[#355E3B]/5 rounded-2xl text-[#355E3B]">
          {isVideo ? <Film size={24} /> : pres.fileType === "image" ? <ImageIcon size={24} /> : <FileText size={24} />}
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#C5A059] hover:text-[#355E3B] transition-colors"
        >
          {isVideo ? <>Watch <Play size={13} /></> : <>Download <Download size={13} /></>}
        </button>
      </div>
      <div className="flex-1">
        <h3 className="text-base font-serif font-bold text-slate-800 leading-tight uppercase line-clamp-2">
          {pres.title}
        </h3>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500">
          {pres.fileType?.toUpperCase() || "DOCUMENT"}
        </span>
        <span className="text-[9px] text-slate-400">
          {new Date(pres.createdAt).toLocaleDateString("en-KE")}
        </span>
      </div>
    </div>
  );
};

/* =====================================================
    PAGE COMPONENT (FLIPBOOK)
===================================================== */
interface PageProps {
  number: number;
  children: React.ReactNode;
  isCover?: boolean;
}

const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => (
  <div
    className={`w-full h-full flex flex-col relative overflow-hidden ${
      props.isCover ? "bg-white" : "bg-[#fdfbf7]"
    }`}
    ref={ref}
  >
    <div
      className={`flex-1 flex flex-col relative z-0 ${
        !props.isCover
          ? "m-3 sm:m-6 border border-[#355E3B]/10 p-4 sm:p-8 rounded-sm overflow-hidden bg-white"
          : "h-full w-full"
      }`}
    >
      {props.children}
      {!props.isCover && props.number > 1 && (
        <div className="absolute bottom-3 right-6 text-[8px] font-black text-slate-400 tracking-widest uppercase bg-inherit px-1">
          P. {props.number}
        </div>
      )}
    </div>
  </div>
));
Page.displayName = "Page";

/* =====================================================
    MAIN COMPONENT
===================================================== */
const JudgesReligion = () => {
  const dispatch = useDispatch<AppDispatch>();

  const userRole = useSelector((state: RootState) => state.auth.user?.role as AudienceRole | undefined);
  const { program, loading: programLoading } = useSelector((state: RootState) => state.program);
  const { judges, loading: ceremonyLoading } = useSelector((state: RootState) => state.ceremony);
  const { items: presentations, loading: presLoading } = useSelector((state: RootState) => state.presentations);

  const [activeTab, setActiveTab] = useState("PROGRAM");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [bookSize, setBookSize] = useState({ width: 450, height: 630 });

  const fetchedRef = useRef(false);

  const showProgramLoading  = programLoading  && !program;
  const showCeremonyLoading = ceremonyLoading && judges.length === 0;
  const showPresLoading     = presLoading     && presentations.length === 0;

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth < 640 ? window.innerWidth - 32 : 480;
      setBookSize({ width: w, height: w * 1.45 });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (userRole === undefined || fetchedRef.current) return;
    fetchedRef.current = true;

    dispatch(fetchCeremonyInfo(userRole));
    dispatch(fetchProgram(userRole));
    dispatch(fetchPresentations());
  }, [dispatch, userRole]);

  const flipbookKey = useMemo(() => {
    if (!program?.schedule) return "loading";
    return `fb-${program.schedule.length}-${program.isLocked ? "L" : "U"}-${program.targetAudience}`;
  }, [program?.schedule?.length, program?.isLocked, program?.targetAudience]);

  const programPages = useMemo(() => {
    const pages: JSX.Element[] = [];
    let pageCounter = 1;

    // Cover
    pages.push(
      <Page key="cover" number={pageCounter++} isCover>
        <img src={CoverP} alt="Cover" className="w-full h-full object-cover" />
      </Page>
    );

    const scheduleArray = program?.schedule || [];
    if (scheduleArray.length > 0) {
      const MAX_PAGE_WEIGHT = 1500;
      scheduleArray.forEach((day: any, dayIdx: number) => {
        let currentPageActivities: any[] = [];
        let currentWeight = 0;
        const activities = day.activities || [];

        activities.forEach((act: any) => {
          const itemWeight = (act.activity?.length || 0) + (act.facilitator?.length || 0) + 280;
          if (currentWeight + itemWeight > MAX_PAGE_WEIGHT && currentPageActivities.length > 0) {
            pages.push(renderSchedulePage(day, currentPageActivities, pageCounter++, true, dayIdx));
            currentPageActivities = [];
            currentWeight = 0;
          }
          currentPageActivities.push(act);
          currentWeight += itemWeight;
        });

        if (currentPageActivities.length > 0) {
          const isCont = activities.length > 0 && currentPageActivities[0] !== activities[0];
          pages.push(renderSchedulePage(day, currentPageActivities, pageCounter++, isCont, dayIdx));
        }
      });
    }

    // Back Cover
    pages.push(
      <Page key="back-cover" number={pageCounter++} isCover>
        <img src={Back} alt="Back" className="w-full h-full object-cover" />
      </Page>
    );

    return pages;
  }, [program]);

  function renderSchedulePage(day: any, activities: any[], pageNum: number, isCont: boolean, dayIdx: number) {
    return (
      <Page key={`day-${dayIdx}-p-${pageNum}`} number={pageNum}>
        <div className="flex flex-col h-full">
          <header className="border-b-2 border-[#355E3B]/20 pb-3 mb-4 shrink-0">
            <h2 className="text-[#355E3B] font-serif text-base font-bold uppercase">
              Day {day.day}{isCont && <span className="text-[#C5A059] ml-2 text-[10px] italic">(Cont.)</span>}
            </h2>
            <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-widest">
              {day.date ? new Date(day.date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : ""}
            </p>
          </header>
          <div className="flex-1 space-y-4">
            {activities.map((act: any, i: number) => (
              <div key={i} className="flex gap-4 border-b border-slate-100/60 pb-3 last:border-0 items-start">
                <span className="text-[#355E3B] font-mono text-[10px] font-bold shrink-0 mt-1 bg-slate-100/50 px-2 py-0.5 rounded">
                  {act.time}
                </span>
                <div className="flex-1">
                  <p className="text-[11px] font-serif font-bold text-slate-900 leading-tight uppercase">{act.activity}</p>
                  {act.facilitator && (
                    <div className="mt-1 space-y-0.5">
                      {act.facilitator.split("\n").map((name: string, idx: number) => (
                        <p key={idx} className="text-[9px] text-[#355E3B] italic flex items-start gap-1">
                          <span className="text-[#C5A059]">•</span> {formatName(name.trim())}
                        </p>
                      ))}
                    </div>
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
              <h1 className="text-[#355E3B] font-serif text-xl sm:text-2xl font-bold uppercase">
                {program?.event_title || "Conference Portal"}
              </h1>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner">
            {["PROGRAM", "BIO", "PRESENTATION"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                  activeTab === tab ? "bg-white text-[#355E3B] shadow-md" : "text-slate-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-12 bg-[#F8FAFC]/30">

        {/* ── PROGRAM TAB ── */}
        <div className={activeTab === "PROGRAM" ? "block" : "hidden"}>
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            {showProgramLoading ? (
              <div className="py-20"><Loader2 className="animate-spin text-[#355E3B]" size={32} /></div>
            ) : !program ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText size={24} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold text-sm">Program not available</p>
              </div>
            ) : program.isLocked ? (
              /* ✅ SHOW COUNTDOWN IF LOCKED (NO COVERS) */
              <div className="py-12 w-full">
                <ReleaseCountdown targetDate={program.scheduledRelease} />
              </div>
            ) : (
              /* ✅ SHOW FLIPBOOK IF UNLOCKED */
              <div key={flipbookKey} className="relative animate-in fade-in duration-700">
                {/* @ts-ignore */}
                <HTMLFlipBook
                  width={bookSize.width}
                  height={bookSize.height}
                  size="fixed"
                  drawShadow={true}
                  usePortrait={true}
                  mobileScrollSupport={true}
                  className="book-container shadow-2xl"
                  startPage={0}
                >
                  {programPages}
                </HTMLFlipBook>
              </div>
            )}
          </div>
        </div>

        {/* ── BIO TAB ── */}
        <div className={activeTab === "BIO" ? "block" : "hidden"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {showCeremonyLoading && (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="animate-spin text-[#355E3B]" size={32} />
              </div>
            )}
            {!showCeremonyLoading && judges.map((judge) => (
              <div
                key={judge._id}
                onClick={() => setSelectedJudge(judge)}
                className="cursor-pointer bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-5 hover:border-[#C5A059] transition-all group shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                  <img src={judge.imageUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-serif font-bold text-[#355E3B] truncate">{formatName(judge.name)}</h3>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase mt-0.5">{judge.title}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#355E3B]" />
              </div>
            ))}
          </div>
        </div>

        {/* ── PRESENTATION TAB ── */}
        <div className={activeTab === "PRESENTATION" ? "block" : "hidden"}>
          <div className="max-w-6xl mx-auto">
            {showPresLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[#355E3B]" size={32} />
              </div>
            ) : presentations.length === 0 ? (
              <div className="text-center py-20 text-slate-400">No materials available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {presentations.map((pres) => (
                  <PresentationCard key={pres._id} pres={pres} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BioModal isOpen={!!selectedJudge} onClose={() => setSelectedJudge(null)} data={selectedJudge} />
    </div>
  );
};

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
          <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover object-top" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e1d] via-[#1a2e1d]/20 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 w-full p-8">
            <h3 className="font-serif font-bold text-2xl text-white">{formatName(data.name)}</h3>
            <p className="text-[#C5A059] font-black text-[10px] uppercase tracking-widest">{data.title}</p>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          <div className="text-slate-600 leading-relaxed font-serif italic whitespace-pre-line text-sm sm:text-base">
            {data.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgesReligion;