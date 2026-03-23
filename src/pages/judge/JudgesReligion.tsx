import React, { useEffect, useState, useMemo, useRef, type JSX } from "react";
import { useDispatch, useSelector } from "react-redux";
import HTMLFlipBook from "react-pageflip";
import {
  ChevronRight,
  X,
  Download,
  Loader2,
  FileText,
  Film,
  Image as ImageIcon,
  Play,
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
const formatName = (str: string) => {
  if (!str) return "";
  const upperHonors = ["EBS", "OGW", "PHD", "SC", "SCJ", "CBS", "EGH", "FCI", "ARB"];
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

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getMimeLabel = (mimeType: string): string => {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
    "application/vnd.ms-powerpoint": "PPT",
    "video/mp4": "MP4", "video/webm": "WEBM", "video/quicktime": "MOV",
    "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WEBP",
  };
  return map[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "FILE";
};

/* =====================================================
    PRESENTATION CARD (Updated Cloudinary Fix)
===================================================== */
const PresentationCard: React.FC<{ pres: Presentation }> = ({ pres }) => {
  const isVideo = pres.fileType === "video";

  const getDownloadUrl = (url: string) => {
    if (!url || !url.includes("cloudinary.com")) return url;
    // Fix: Insert fl_attachment without custom text that creates 404s
    // This forces download using the file's native Cloudinary name safely
    return url.replace("/upload/", "/upload/fl_attachment/");
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-[#355E3B]/30 transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="p-3 bg-[#355E3B]/5 rounded-2xl text-[#355E3B]">
          {isVideo ? <Film size={24} /> : pres.fileType === "image" ? <ImageIcon size={24} /> : <FileText size={24} />}
        </div>
        <a
          href={getDownloadUrl(pres.fileUrl)}
          download={pres.fileName}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#C5A059] hover:text-[#355E3B] transition-colors"
        >
          {isVideo ? <>Watch <Play size={13} /></> : <>Download <Download size={13} /></>}
        </a>
      </div>
      <div className="flex-1">
        <h3 className="text-base font-serif font-bold text-slate-800 leading-tight uppercase line-clamp-2">{pres.title}</h3>
        {pres.description && <p className="text-xs text-slate-500 italic line-clamp-2 mt-1.5 leading-relaxed">{pres.description}</p>}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500">{getMimeLabel(pres.mimeType)}</span>
          {pres.fileSize && <span className="text-[9px] text-slate-400 font-medium">{formatFileSize(pres.fileSize)}</span>}
        </div>
        <div className="text-right">
          <p className="text-[7px] text-slate-300 font-bold max-w-[100px] truncate uppercase">{pres.fileName}</p>
          <span className="text-[9px] text-slate-400">{new Date(pres.createdAt).toLocaleDateString("en-KE")}</span>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
    PAGE COMPONENT
===================================================== */
const Page = React.forwardRef<HTMLDivElement, { number: number; children: React.ReactNode; isCover?: boolean }>(
  (props, ref) => (
    <div className={`w-full h-full flex flex-col relative overflow-hidden ${props.isCover ? "bg-white" : "bg-[#fdfbf7]"}`} ref={ref}>
      <div className={`flex-1 flex flex-col relative z-0 ${!props.isCover ? "m-3 sm:m-6 border border-[#355E3B]/10 p-4 sm:p-8 rounded-sm overflow-hidden bg-white" : "h-full w-full"}`}>
        {props.children}
        {!props.isCover && props.number > 1 && (
          <div className="absolute bottom-3 right-6 text-[8px] font-black text-slate-400 tracking-widest uppercase bg-inherit px-1">P. {props.number}</div>
        )}
      </div>
    </div>
  )
);
Page.displayName = "Page";

/* =====================================================
    MAIN COMPONENT
===================================================== */
const JudgesReligion = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isInitialMount = useRef(true);

  const { program, loading: programLoading } = useSelector((state: RootState) => state.program);
  const { judges } = useSelector((state: RootState) => state.ceremony);
  const { items: presentations, loading: presentationsLoading, error: presentationsError } = useSelector((state: RootState) => state.presentations);

  const [activeTab, setActiveTab] = useState("PROGRAM");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [bookSize, setBookSize] = useState({ width: 450, height: 630 });

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
    if (isInitialMount.current) {
      dispatch(fetchCeremonyInfo());
      dispatch(fetchProgram());
      dispatch(fetchPresentations());
      isInitialMount.current = false;
    }
  }, [dispatch]);

  // Stable Key logic: prevents re-mount (flicker) when data is refreshing
  const flipbookKey = useMemo(() => {
    if (!program?.schedule) return "loading";
    return `fb-${program.schedule.length}-${program.isLocked ? "L" : "U"}`;
  }, [program?.schedule?.length, program?.isLocked]);

  const programPages = useMemo(() => {
    const pages: JSX.Element[] = [];
    let pageCounter = 1;

    pages.push(
      <Page key="cover" number={pageCounter++} isCover={true}>
        <img src={CoverP} alt="Cover" className="w-full h-full object-cover" />
      </Page>
    );

    const scheduleArray = program?.schedule || [];
    if (scheduleArray.length > 0) {
      const MAX_PAGE_WEIGHT = 1600;
      scheduleArray.forEach((day: any, dayIdx: number) => {
        let currentPageActivities: any[] = [];
        let currentWeight = 0;
        const activities = day.activities || [];

        activities.forEach((act: any) => {
          const itemWeight = (act.activity?.length || 0) + (act.facilitator?.length || 0) + 250;
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

    pages.push(
      <Page key="back-cover" number={pageCounter++} isCover={true}>
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
              Day {day.day} {isCont && <span className="text-[#C5A059] ml-2 text-[10px] italic">(Cont.)</span>}
            </h2>
            <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-widest">
              {day.date ? new Date(day.date).toLocaleDateString("en-KE", { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
            </p>
          </header>
          <div className="flex-1 space-y-4">
            {activities.map((act: any, i: number) => (
              <div key={i} className="flex gap-4 border-b border-slate-100/60 pb-3 last:border-0 items-start">
                <span className="text-[#355E3B] font-mono text-[10px] font-bold shrink-0 mt-1 bg-slate-100/50 px-2 py-0.5 rounded">{act.time}</span>
                <div className="flex-1">
                  <p className="text-[11px] font-serif font-bold text-slate-900 leading-tight uppercase">{act.activity}</p>
                  {act.facilitator && <p className="text-[9px] text-[#355E3B] italic mt-1">{formatName(act.facilitator)}</p>}
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
              <h1 className="text-[#355E3B] font-serif text-xl sm:text-2xl font-bold uppercase">{program?.event_title || "Conference 2026"}</h1>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner">
            {["PROGRAM", "BIO", "PRESENTATION"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${activeTab === tab ? "bg-white text-[#355E3B] shadow-md" : "text-slate-500"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-12 bg-[#F8FAFC]/30">
        {activeTab === "PROGRAM" && (
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            {programLoading && !program ? (
              <div className="py-20"><Loader2 className="animate-spin text-[#355E3B]" size={32} /></div>
            ) : (
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
        )}

        {/* BIO and PRESENTATION tabs remain the same as your updated version */}
        {activeTab === "BIO" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {judges.map((judge) => (
              <div key={judge._id} onClick={() => setSelectedJudge(judge)} className="cursor-pointer bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-5 hover:border-[#C5A059] transition-all group shadow-sm">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                  <img src={judge.imageUrl} className="w-full h-full object-cover" alt={judge.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-serif font-bold text-[#355E3B] truncate">{formatName(judge.name)}</h3>
                  <p className="text-[9px] font-black text-[#C5A059] uppercase mt-0.5">{judge.title}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#355E3B]" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "PRESENTATION" && (
          <div className="max-w-6xl mx-auto">
            {presentationsLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#355E3B]" size={32} /></div> :
             presentationsError ? <div className="text-center py-20 text-red-500">{presentationsError}</div> :
             presentations.length === 0 ? <div className="text-center py-20 text-slate-400">No materials available yet</div> :
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {presentations.map((pres: Presentation) => <PresentationCard key={pres._id} pres={pres} />)}
             </div>
            }
          </div>
        )}
      </main>

      <BioModal isOpen={!!selectedJudge} onClose={() => setSelectedJudge(null)} data={selectedJudge} />
    </div>
  );
};

/* =====================================================
    BIO MODAL
===================================================== */
const BioModal: React.FC<{ isOpen: boolean; onClose: () => void; data: Judge | null; }> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/95 backdrop-blur-md">
      <div className="relative bg-white w-full max-w-5xl rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[95vh] flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 z-[60] p-2.5 bg-black/40 text-white rounded-full transition-transform active:scale-95"><X size={20} /></button>
        <div className="relative w-full md:w-[45%] bg-slate-200 shrink-0 h-[40vh] md:h-auto">
          <img src={data.imageUrl} className="absolute inset-0 w-full h-full object-cover object-top" alt={data.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e1d] via-[#1a2e1d]/20 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 w-full p-8">
            <h3 className="font-serif font-bold text-2xl text-white">{formatName(data.name)}</h3>
            <p className="text-[#C5A059] font-black text-[10px] uppercase tracking-widest">{data.title}</p>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          <div className="text-slate-600 leading-relaxed font-serif italic whitespace-pre-line text-sm sm:text-base">{data.description || "Official records are currently being updated."}</div>
        </div>
      </div>
    </div>
  );
};

export default JudgesReligion;