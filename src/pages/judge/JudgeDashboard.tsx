import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchNotices } from "../../store/slices/noticeSlice";
import { fetchEvents } from "../../store/slices/eventSlice";
import { fetchUserGroups, fetchUserMessages } from "../../store/slices/userChatSlice";
import { fetchCeremonyInfo } from "../../store/slices/swearingPreferenceSlice";

import {
  FileText,
  Calendar,
  MapPin,
  Loader2,
  Activity,
  ArrowRight,
  Clock,
  Lock,
  ShieldCheck,
  History,
  Unlock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { type INotice } from "../../store/slices/noticeSlice";

/* --- Institutional Theme Stat Card --- */
const StatCard = ({
  title,
  value,
  subtext,
  loading,
  urgent = false,
  locked = false,
}: {
  title: string;
  value: string | number;
  subtext: string;
  loading?: boolean;
  urgent?: boolean;
  locked?: boolean;
}) => (
  <div className={`bg-white border-l-4 ${locked ? 'border-l-slate-300' : urgent ? 'border-l-[#C5A059]' : 'border-l-[#355E3B]'} border border-slate-200 p-6 rounded-sm relative overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-md h-full`}>
    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.15em] mb-4 flex justify-between items-center">
      {title}
      {locked ? <Lock size={10} className="text-slate-400" /> : !locked && title === "Programme" ? <Unlock size={10} className="text-[#C5A059]" /> : null}
    </p>
    <div className="flex items-baseline gap-2">
      {loading ? (
        <Loader2 className="animate-spin text-[#355E3B]" size={24} />
      ) : (
        /* Reduced from 5xl to 3xl to prevent overlap for text values like 'LOCKED' */
        <h3 className={`text-[#355E3B] text-3xl font-serif font-black transition-colors duration-300 ${locked ? 'text-slate-300' : urgent ? 'text-[#C5A059]' : ''}`}>
          {value}
        </h3>
      )}
    </div>
    <p className={`text-[10px] mt-2 font-bold uppercase tracking-tight truncate transition-colors ${locked ? 'text-slate-300' : urgent && !loading ? 'text-[#C5A059]' : 'text-slate-400'}`}>
      {subtext}
    </p>
  </div>
);

const JudgeDashboardPage = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const { user } = useAppSelector((state) => state.auth);
  const { notices, loading: noticesLoading } = useAppSelector((state) => state.notices);
  const { events, loading: eventsLoading } = useAppSelector((state) => state.events);
  const { groups, loading: chatLoading } = useAppSelector((state) => state.userChat);
  const { program, loading: ceremonyLoading } = useAppSelector((state) => state.ceremony);

  /* -------------------- DATA FETCHING -------------------- */
  useEffect(() => {
    if (notices.length === 0) dispatch(fetchNotices(undefined));
    if (events.length === 0) dispatch(fetchEvents({ filter: "ALL" }));
    if (groups.length === 0) {
      dispatch(fetchUserGroups());
      dispatch(fetchUserMessages({}));
    }
    
    dispatch(fetchCeremonyInfo());

    const refreshInterval = setInterval(() => {
      dispatch(fetchCeremonyInfo());
    }, 60000); 

    return () => clearInterval(refreshInterval);
  }, [dispatch, notices.length, events.length, groups.length]);

  /* -------------------- LOGIC -------------------- */
  
  const lastLoginFormatted = useMemo(() => {
    if (!user?.lastLogin) return "First session";
    return new Date(user.lastLogin).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }, [user?.lastLogin]);

  const activeNotices = useMemo(() => {
    const now = new Date();
    return notices.filter((notice: INotice) => {
      if (!notice.expiryDate) return notice.isActive;
      return notice.isActive && new Date(notice.expiryDate) >= now;
    });
  }, [notices]);

  const urgentNoticesCount = useMemo(() => {
    return activeNotices.filter((n) => n.priority === "URGENT").length;
  }, [activeNotices]);

  const sortedNotices = useMemo(() => {
    return [...activeNotices]
      .sort((a, b) => {
        if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
        if (a.priority !== "URGENT" && b.priority === "URGENT") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [activeNotices]);

  const messageStats = useMemo(() => {
    const unread = groups.reduce((acc, group) => acc + (group.unreadCount || 0), 0);
    return { unread, totalChannels: groups.length };
  }, [groups]);

  const displayEvent = useMemo(() => {
    if (!events || events.length === 0) return null;
    const ongoing = events.find(e => e.status === "ONGOING");
    if (ongoing) return ongoing;

    const now = new Date();
    const upcoming = [...events]
      .filter(e => new Date(e.startDate) >= new Date(now.setHours(0,0,0,0)))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return upcoming.find(e => e.isMandatory) || upcoming[0];
  }, [events]);

  const isOngoing = displayEvent?.status === "ONGOING";
  const displayName = user?.name || "Justice";
  const startDate = displayEvent ? new Date(displayEvent.startDate) : null;
  const endDate = displayEvent ? new Date(displayEvent.endDate) : null;
  const isMultiDay = startDate && endDate && startDate.toDateString() !== endDate.toDateString();

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif text-[#355E3B] font-black">
              Welcome, <span className="capitalize">Judge {displayName}</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  <ShieldCheck size={12} className="text-[#355E3B]" />
                  Secure Session
               </div>
               <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  <History size={12} className="text-[#C5A059]" />
                  Last Activity: <span className="text-slate-700">{lastLoginFormatted}</span>
               </div>
            </div>
          </div>
          
          <div className="text-left hidden md:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Current Session</p>
            <p className="text-sm font-serif font-bold text-[#355E3B]">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Link to="/judge/notices">
            <StatCard
              title="Notices"
              value={activeNotices.length}
              subtext={urgentNoticesCount > 0 ? `${urgentNoticesCount} Priority Action` : "Registry Overview"}
              loading={noticesLoading && notices.length === 0}
              urgent={urgentNoticesCount > 0}
            />
          </Link>

          <Link to="/judge/messages">
            <StatCard
              title="Messages"
              value={messageStats.unread}
              subtext={messageStats.unread > 0 ? `${messageStats.unread} New Alerts` : "No pending mail"}
              loading={chatLoading && groups.length === 0}
              urgent={messageStats.unread > 0}
            />
          </Link>

          <Link to="/judge/events">
            <StatCard
              title="Events"
              value={events.length}
              subtext="Judiciary Calendar"
              loading={eventsLoading && events.length === 0}
            />
          </Link>

          {/* DYNAMIC PROGRAMME CARD */}
          <Link 
            to={program?.isLocked ? "#" : "/judge/documents"}
            className={program?.isLocked ? "cursor-not-allowed" : "cursor-pointer"}
            onClick={(e) => program?.isLocked && e.preventDefault()}
          >
            <StatCard
              title="Programme"
              value={program?.isLocked ? "LOCKED" : "ACTIVE"}
              subtext={program?.isLocked ? "Awaiting Release" : "Schedule Ready"}
              loading={ceremonyLoading && !program}
              urgent={!program?.isLocked}
              locked={program?.isLocked}
            />
          </Link>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm p-6 md:p-8 shadow-sm relative">
             <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {isOngoing ? <Activity className="text-red-600 animate-pulse" size={22} /> : <Calendar className="text-[#C5A059]" size={22} />}
                <h2 className="text-[#355E3B] font-serif text-2xl font-black">
                  {isOngoing ? "Ongoing Assignment" : "Upcoming Event"}
                </h2>
              </div>
            </div>

            {displayEvent && startDate && endDate ? (
              <div className="flex flex-col md:flex-row gap-8 items-start mb-4">
                <div className={`${isOngoing ? 'bg-red-900' : 'bg-[#355E3B]'} p-6 text-center min-w-[150px] w-full md:w-auto rounded-sm shadow-md`}>
                  <p className="text-[#C5A059] text-[11px] uppercase font-black tracking-widest mb-1">
                    {startDate.toLocaleString("en-us", { month: "short" }).toUpperCase()}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-white font-serif font-black">
                    <span className="text-5xl">{startDate.getDate()}</span>
                    {isMultiDay && (
                      <>
                        <span className="text-2xl text-white/30 mx-1">-</span>
                        <span className="text-4xl text-[#C5A059]">{endDate.getDate()}</span>
                      </>
                    )}
                  </div>
                  <p className="text-white/50 text-[10px] font-bold mt-2 border-t border-white/10 pt-2">{startDate.getFullYear()}</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <h3 className="text-[#355E3B] text-2xl font-serif font-black leading-tight mb-3">
                      {displayEvent.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-slate-50 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-full text-[#C5A059]">
                          <Clock size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-black text-slate-400">Commencement</p>
                          <p className="text-xs font-bold text-slate-700">{formatDateLabel(startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-full text-slate-300">
                          <ArrowRight size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-black text-slate-400">Conclusion</p>
                          <p className="text-xs font-bold text-slate-700">{formatDateLabel(endDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-[#C5A059] shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Venue</p>
                          <p className="font-bold text-sm text-slate-700">{displayEvent.location || "TBD"}</p>
                        </div>
                    </div>
                    {displayEvent.isMandatory && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-sm font-bold text-[9px] uppercase tracking-tighter">
                         <Activity size={14} /> Mandatory Appearance
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-200 rounded-sm bg-slate-50/50">
                <Calendar className="mx-auto text-slate-300 mb-4" size={40} />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No active assignments</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-6 md:p-8 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="text-[#C5A059]" size={20} />
              <h2 className="text-[#355E3B] font-serif text-xl font-black">Recent Notices</h2>
            </div>

            <div className="space-y-6 flex-1">
              {sortedNotices.length > 0 ? (
                sortedNotices.map((notice) => (
                  <div key={notice._id} className="group cursor-pointer border-b border-slate-50 pb-4 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <h4 className="text-slate-700 text-[13px] font-bold group-hover:text-[#355E3B] transition-colors line-clamp-2 leading-snug">
                      {notice.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-400 text-[9px] font-black uppercase">
                        {new Date(notice.createdAt).toLocaleDateString('en-GB')}
                      </span>
                      <span className={`${notice.priority === 'URGENT' ? 'text-red-600 bg-red-50 border-red-100' : 'text-[#C5A059] bg-[#C5A059]/5 border-transparent'} text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 border`}>
                        {notice.priority}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-slate-300 text-xs italic font-medium">
                    {noticesLoading ? "Loading Secure Briefs..." : "No active notices found."}
                  </p>
                </div>
              )}
            </div>
            
            <Link to="/judge/notices" className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#355E3B] hover:text-[#C5A059] transition-all group">
              View All Notices <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboardPage;