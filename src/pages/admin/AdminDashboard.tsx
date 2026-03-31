import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { Link } from "react-router-dom";

// Icons
import {
  Users,
  Calendar,
  Download,
  Filter,
  FileText,
  TrendingUp,
  AlertCircle,
  MapPin,
  MessageSquare,
  Lock,
  Unlock,
  Clock,
} from "lucide-react";

// Thunks
import { fetchUsers } from "../../store/slices/adminUserSlice";
import { fetchEvents } from "../../store/slices/eventSlice";
import { fetchStats, fetchAllMessages } from "../../store/slices/adminMessageSlice";
import { fetchNotices } from "../../store/slices/noticeSlice";
import { fetchProgram, fetchAllProgramsForAdmin } from "../../store/slices/programSlice";

// Types
import type { AudienceRole } from "../../store/slices/programSlice";
import type { IUser } from "../../store/slices/adminUserSlice";
import type { IEvent } from "../../store/slices/eventSlice";
import type { INotice } from "../../store/slices/noticeSlice";

// --- Audience filter options for the admin toggle ---
const AUDIENCE_OPTIONS: { label: string; value: AudienceRole }[] = [
  { label: "All",    value: "all"   },
  { label: "Judges", value: "judge" },
  { label: "DR",     value: "dr"    },
];

const AdminDashboard = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const { users = [] }                           = useAppSelector((s) => s.users);
  const { events = [], loading: eventsLoading }  = useAppSelector((s) => s.events);
  const { notices = [], loading: noticesLoading }= useAppSelector((s) => s.notices);
  const { stats: chatStats }                     = useAppSelector((s) => s.adminChat);
  const { program, allPrograms, loading: programLoading } = useAppSelector((s) => s.program);

  // Local state
  const [programCountdown, setProgramCountdown]         = useState("");
  const [selectedAudience, setSelectedAudience]         = useState<AudienceRole>("all");

  // --- Derived audience counts from grouped admin view ---
  const audienceCounts: Record<AudienceRole, number> = {
    all:   allPrograms?.grouped?.all?.length   ?? 0,
    judge: allPrograms?.grouped?.judge?.length ?? 0,
    dr:    allPrograms?.grouped?.dr?.length    ?? 0,
  };

  // 1. Fetch all data on mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchEvents({ filter: "UPCOMING" }));
    dispatch(fetchStats());
    dispatch(fetchNotices());
    dispatch(fetchProgram("all"));          // admin sees "all" by default
    dispatch(fetchAllProgramsForAdmin());   // populate grouped overview
    dispatch(fetchAllMessages({ limit: 5 }));
  }, [dispatch]);

  // 2. Re-fetch single program view when admin switches audience tab
  useEffect(() => {
    dispatch(fetchProgram(selectedAudience));
  }, [selectedAudience, dispatch]);

  // 3. Stats
  const totalJudges        = users?.filter((u: IUser) => u?.role === "judge").length ?? 0;
  const upcomingEventsCount = events?.filter((e: IEvent) =>
    e?.status === "SCHEDULED" || e?.status === "ONGOING"
  ).length ?? 0;
  const activeNoticesCount = notices?.filter((n) => n.isActive).length ?? 0;

  // 4. Program countdown
  useEffect(() => {
    if (!program?.isLocked || !program?.scheduledRelease) {
      setProgramCountdown("");
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date(program.scheduledRelease).getTime() - Date.now();
      if (diff <= 0) {
        dispatch(fetchProgram(selectedAudience));
        clearInterval(interval);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setProgramCountdown(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [program, selectedAudience, dispatch]);

  // --- Helpers ---
  const formatDateTime = (iso: string) => {
    if (!iso) return { date: "N/A", time: "" };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      time: d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  const programIsLocked   = !!program?.isLocked;
  const programStatusLabel = programIsLocked ? "Locked" : "Active";
  const ProgramIcon        = programIsLocked ? Lock : Unlock;

  const audienceBadgeStyle: Record<AudienceRole, string> = {
    all:   "bg-slate-100 text-slate-600 border-slate-200",
    judge: "bg-blue-50 text-blue-700 border-blue-100",
    dr:    "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20",
  };

  const stats = [
    { label: "Total Judges",    value: totalJudges,                   icon: Users,        color: "text-blue-600",       bg: "bg-blue-50"          },
    { label: "Scheduled Events",value: upcomingEventsCount,           icon: Calendar,     color: "text-[#355E3B]",      bg: "bg-[#355E3B]/10"     },
    { label: "Active Notices",  value: activeNoticesCount,            icon: FileText,     color: "text-[#C5A059]",      bg: "bg-[#C5A059]/10"     },
    { label: "Sent Messages",   value: chatStats?.totalMessages ?? 0, icon: MessageSquare,color: "text-purple-600",     bg: "bg-purple-50"        },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-[#355E3B] font-serif text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          <TrendingUp size={14} /> System Analytics
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-2xl font-serif font-black text-[#355E3B] mt-1">
              {eventsLoading || noticesLoading
                ? <div className="h-8 w-12 bg-slate-100 animate-pulse rounded" />
                : stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* PROGRAM STATUS CARD */}
      <div className="bg-[#355E3B] p-6 rounded-2xl shadow-sm overflow-hidden relative group min-h-[120px]">
        {programLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-32 bg-white/20 rounded" />
            <div className="h-8 w-48 bg-white/20 rounded" />
          </div>
        ) : (
          <>
            {/* Top row: status + actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Program Status</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-3xl font-serif font-black text-white">{programStatusLabel}</h3>
                  {programIsLocked && (
                    <span className="text-[#C5A059] font-mono text-lg font-bold animate-pulse">
                      {programCountdown}
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                  <Clock size={12} />
                  {programIsLocked
                    ? "Under Review"
                    : `Visible to: ${program?.targetAudience?.toUpperCase() ?? "ALL"}`}
                </p>
              </div>
              <div className="flex gap-3 relative z-10">
                <Link
                  to="/admin/documents"
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white transition-all backdrop-blur-sm"
                >
                  Manage Program
                </Link>
              </div>
            </div>

            {/* Audience filter tabs */}
            <div className="flex items-center gap-2 mt-5 relative z-10 flex-wrap">
              <span className="text-white/40 text-[9px] font-black uppercase tracking-widest mr-1">
                Preview audience:
              </span>
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedAudience(opt.value)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                    selectedAudience === opt.value
                      ? "bg-white text-[#355E3B] border-white"
                      : "bg-white/10 text-white/60 border-white/20 hover:bg-white/20"
                  }`}
                >
                  {opt.label}
                  {/* Show count badge from grouped admin data */}
                  {audienceCounts[opt.value] > 0 && (
                    <span className="ml-1.5 opacity-70">({audienceCounts[opt.value]})</span>
                  )}
                </button>
              ))}

              {/* Current program's audience badge */}
              {program?.targetAudience && (
                <span className={`ml-auto px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${audienceBadgeStyle[program.targetAudience]}`}>
                  Current: {program.targetAudience}
                </span>
              )}
            </div>
          </>
        )}
        <ProgramIcon className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
      </div>

      {/* PROGRAM AUDIENCE BREAKDOWN */}
      {allPrograms && (
        <div className="grid grid-cols-3 gap-4">
          {AUDIENCE_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`bg-white border rounded-2xl p-5 shadow-sm flex items-center justify-between ${
                selectedAudience === opt.value ? "ring-2 ring-[#355E3B]/30" : "border-slate-200"
              }`}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {opt.label}
                </p>
                <h4 className="text-2xl font-serif font-black text-[#355E3B] mt-0.5">
                  {audienceCounts[opt.value]}
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">programs</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${audienceBadgeStyle[opt.value]}`}>
                {opt.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* UPCOMING EVENTS */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[#355E3B] text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} /> Upcoming Events
            </h3>
            <Link to="/admin/event" className="text-slate-400 hover:text-[#355E3B]">
              <Filter size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.slice(0, 5).map((event: IEvent) => {
                  const start = formatDateTime(event.startDate);
                  return (
                    <tr key={event._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#355E3B] text-sm">{event.title}</span>
                          {event.isMandatory && (
                            <span className="text-[8px] text-red-500 font-black uppercase mt-0.5 tracking-tighter italic">
                              Mandatory Appearance
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#C5A059]" />
                          {event.location || "Judiciary Grounds"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700">{start.date}</span>
                          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">{start.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border
                          ${event.status === "SCHEDULED" ? "bg-blue-50 text-blue-700 border-blue-100" :
                            event.status === "ONGOING"   ? "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse" :
                            "bg-slate-50 text-slate-600 border-slate-100"}`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* LATEST NOTICES */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[#355E3B] text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} /> Latest Notices
            </h3>
            <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded uppercase">
              {notices.length} Total
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {notices.slice(0, 6).map((doc: INotice) => (
              <div key={doc._id} className="p-4 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${doc.priority === "URGENT" ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"}`}>
                    {doc.priority === "URGENT" ? <AlertCircle size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-[#355E3B]">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${doc.priority === "URGENT" ? "text-red-600" : "text-[#C5A059]"}`}>
                        {doc.targetAudience}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                        <Download size={10} /> {doc.stats?.downloads ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <Link to="/admin/notice" className="text-[10px] font-black uppercase tracking-widest text-[#355E3B] hover:underline">
              Manage All Notices
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;