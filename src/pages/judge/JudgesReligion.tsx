import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Presentation as PresentationIcon,
  Calendar,
  ChevronRight,
  X,
  Download,
  PlayCircle,
  Clock,
  FileText,
  Lock,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import {
  fetchCeremonyInfo,
  type Judge,
} from "../../store/slices/swearingPreferenceSlice";

/* =====================================================
    COUNTDOWN TIMER COMPONENT
===================================================== */
const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{
    h: number;
    m: number;
    s: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          h: Math.floor(distance / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft)
    return (
      <p className="text-[#C5A059] text-[10px] font-black uppercase mt-4 animate-pulse">
        Refreshing Official Schedule...
      </p>
    );

  return (
    <div className="flex gap-3 mt-6 justify-center">
      {[
        { label: "HRS", val: timeLeft.h },
        { label: "MIN", val: timeLeft.m },
        { label: "SEC", val: timeLeft.s },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[50px] border border-white/10">
            <span className="text-xl font-bold font-mono text-white">
              {String(unit.val).padStart(2, "0")}
            </span>
          </div>
          <p className="text-[7px] uppercase font-black mt-1 text-[#C5A059] tracking-tighter">
            {unit.label}
          </p>
        </div>
      ))}
    </div>
  );
};

/* =====================================================
    BIO MODAL COMPONENT
===================================================== */
const BioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  data: Judge | null;
}> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-5xl rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all border border-slate-100"
        >
          <X size={20} />
        </button>

        <div className="relative w-full md:w-[35%] bg-slate-100 shrink-0 h-64 md:h-auto">
          <img
            src={data.imageUrl}
            className="absolute inset-0 w-full h-full object-cover object-top"
            alt={data.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#355E3B] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 text-white">
            <h3 className="font-serif font-bold text-lg leading-tight">
              {data.name}
            </h3>
            <p className="text-[#C5A059] font-black text-[9px] uppercase tracking-widest mt-1">
              {data.title}
            </p>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-[#FDFDFD] custom-scrollbar">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4 opacity-40">
              <div className="h-px flex-1 bg-slate-300" />
              <p className="text-[9px] font-black uppercase tracking-[.3em] text-[#355E3B]">
                Profile
              </p>
              <div className="h-px flex-1 bg-slate-300" />
            </div>
            <h2 className="text-[#1a1a1a] text-4xl font-serif italic leading-tight">
              Professional Biography
            </h2>

            {/* UPDATED: Changed .bio to .description to match Schema */}
            <div className="text-slate-600 leading-relaxed text-base font-serif whitespace-pre-line border-l-2 border-[#C5A059]/30 pl-6 italic">
              {data.description ||
                "Detailed judicial profile is currently being updated."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
    MAIN PAGE COMPONENT
===================================================== */
const JudgesReligion = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { judges, presentations, program, loading } = useSelector(
    (state: RootState) => state.ceremony,
  );

  const [activeTab, setActiveTab] = useState("BIO");
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);

  useEffect(() => {
    dispatch(fetchCeremonyInfo());
  }, [dispatch]);

  const tabs = [
    { id: "PROGRAM", label: "Program", icon: <Calendar size={14} /> },
    { id: "BIO", label: "Bio", icon: <User size={14} /> },
    {
      id: "PRESENTATION",
      label: "Presentations",
      icon: <PresentationIcon size={14} />,
    },
  ];

  if (loading && judges.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-[#355E3B] animate-pulse">
        Retrieving Official Records...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
      <header className="p-6 md:p-8 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-[#355E3B] rounded-full" />
            <div>
              <p className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.2em] leading-none">
                Republic of Kenya
              </p>
              <h1 className="text-[#355E3B] font-serif text-xl md:text-2xl font-bold tracking-tight mt-1">
                Office of the Registrar High Court
              </h1>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-white text-[#355E3B] shadow-sm"
                    : "text-slate-500 hover:text-[#355E3B]"
                }`}
              >
                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#F8FAFC]/50 custom-scrollbar">
        {activeTab === "BIO" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {judges.map((judge) => (
                <div
                  key={judge._id}
                  onClick={() => setSelectedJudge(judge)}
                  className="group cursor-pointer bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-md transition-all duration-300 border-b-4 hover:border-b-[#C5A059]"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <img
                      src={judge.imageUrl}
                      className="w-full h-full object-cover"
                      alt={judge.name}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-serif font-bold text-[#355E3B] truncate">
                      {judge.name}
                    </h3>
                    <p className="text-[8px] font-black text-[#C5A059] uppercase tracking-widest mt-0.5">
                      {judge.title}
                    </p>
                    <span className="inline-flex items-center gap-1 text-slate-400 text-[8px] mt-2 font-bold uppercase group-hover:text-[#355E3B] transition-colors">
                      View Profile <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "PRESENTATION" && (
          <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
            {presentations.map((item) => (
              <a
                key={item._id}
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#355E3B] transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-[#355E3B] group-hover:bg-[#355E3B] group-hover:text-white transition-colors">
                    {["mp4", "mpeg", "mov"].includes(
                      item.fileType?.toLowerCase(),
                    ) ? (
                      <PlayCircle size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#355E3B] uppercase tracking-tight">
                      {item.title}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">
                      {item.fileType} Resource
                    </p>
                  </div>
                </div>
                <Download
                  size={18}
                  className="text-slate-300 group-hover:text-[#355E3B]"
                />
              </a>
            ))}
          </div>
        )}

        {activeTab === "PROGRAM" && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            <div
              className={`rounded-3xl p-8 md:p-12 relative overflow-hidden transition-all duration-700 ${
                program?.isLocked
                  ? "bg-[#1e293b] text-white"
                  : "bg-[#355E3B] text-white shadow-xl"
              }`}
            >
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#C5A059]">
                      {program?.isLocked ? "Under Review" : "Official Schedule"}
                    </h2>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">
                      {program?.isLocked
                        ? "Confidential until release"
                        : "Verified Program"}
                    </p>
                  </div>
                  {/* Download PDF button - only visible if not locked */}
                  {program?.programFileUrl && !program?.isLocked && (
                    <a
                      href={program.programFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#C5A059] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>

                {program?.isLocked ? (
                  <div className="py-12 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                      <Lock size={24} className="text-[#C5A059]" />
                    </div>
                    <h3 className="text-xl font-serif italic text-white/90">
                      Awaiting Release
                    </h3>
                    {program.scheduledRelease && (
                      <CountdownTimer targetDate={program.scheduledRelease} />
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {program?.items?.length > 0 ? (
                      program.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-6 p-4 hover:bg-white/5 rounded-xl transition-all border-l border-white/10 group"
                        >
                          <div className="flex items-center gap-2 text-[#C5A059] font-mono text-[10px] w-24 shrink-0 mt-1">
                            <Clock size={12} /> {item.time}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-[15px] font-serif font-bold text-white/95 leading-snug group-hover:text-white">
                              {item.event}
                            </h4>
                            <p className="text-white/30 text-[9px] font-bold uppercase mt-1 tracking-widest">
                              {item.location}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/20 text-center py-10 italic">
                        No items scheduled.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <BioModal
        isOpen={!!selectedJudge}
        onClose={() => setSelectedJudge(null)}
        data={selectedJudge}
      />
    </div>
  );
};

export default JudgesReligion;
