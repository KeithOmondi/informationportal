import { useEffect } from "react";
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
} from "lucide-react";

// Thunks
import { fetchUsers } from "../../store/slices/adminUserSlice";
import { fetchEvents } from "../../store/slices/eventSlice";
import { fetchStats, fetchAllMessages } from "../../store/slices/adminMessageSlice";
import { fetchNotices } from "../../store/slices/noticeSlice";

// Interfaces
import { type IUser } from "../../store/slices/adminUserSlice";
import { type IEvent } from "../../store/slices/eventSlice";
import { type INotice } from "../../store/slices/noticeSlice";

const AdminDashboard = () => {
  const dispatch = useAppDispatch();

  // 1. Extract data from Redux Store
  const { users = [] } = useAppSelector((state) => state.users);
  const { events = [], loading: eventsLoading } = useAppSelector((state) => state.events);
  const { notices = [], loading: noticesLoading } = useAppSelector((state) => state.notices);
  const { stats: chatStats  } = useAppSelector((state) => state.adminChat);

  // 2. Fetch all required data on mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchEvents({ filter: "UPCOMING" }));
    dispatch(fetchStats());
    dispatch(fetchNotices());
    dispatch(fetchAllMessages({ limit: 5 })); // Get a few recent logs for the dashboard
  }, [dispatch]);

  // 3. Logic & Calculations
  const totalJudges = users?.filter((u: IUser) => u?.role === "judge").length || 0;
  const upcomingEventsCount = events?.filter((e: IEvent) => 
    e?.status === "SCHEDULED" || e?.status === "ONGOING"
  ).length || 0;
  const activeNoticesCount = notices?.filter(n => n.isActive).length || 0;

  const stats = [
    {
      label: "Total Judges",
      value: totalJudges,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Scheduled Events",
      value: upcomingEventsCount,
      icon: Calendar,
      color: "text-[#355E3B]",
      bg: "bg-[#355E3B]/10",
    },
    {
      label: "Active Notices",
      value: activeNoticesCount,
      icon: FileText,
      color: "text-[#C5A059]",
      bg: "bg-[#C5A059]/10",
    },
    {
      label: "Sent Messages",
      value: chatStats?.totalMessages || 0,
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const formatDateTime = (isoString: string) => {
    if (!isoString) return { date: "N/A", time: "" };
    const dateObj = new Date(isoString);
    return {
      date: dateObj.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
      time: dateObj.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-[#355E3B] font-serif text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium mt-1"></p>
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
              {eventsLoading || noticesLoading ? <div className="h-8 w-12 bg-slate-100 animate-pulse rounded" /> : stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* UPCOMING EVENTS TABLE */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[#355E3B] text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} /> UPCOMING EVENTS
            </h3>
            <Link to="/admin/event" className="text-slate-400 hover:text-[#355E3B]"><Filter size={16} /></Link>
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
                             <span className="text-[8px] text-red-500 font-black uppercase mt-0.5 tracking-tighter italic">Mandatory Appearance</span>
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
                            event.status === "ONGOING" ? "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse" : 
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

        {/* LATEST REGISTRY NOTICES */}
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
                  <div className={`p-2 rounded-lg ${doc.priority === 'URGENT' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                    {doc.priority === 'URGENT' ? <AlertCircle size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-[#355E3B]">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${doc.priority === 'URGENT' ? 'text-red-600' : 'text-[#C5A059]'}`}>
                        {doc.targetAudience}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                        <Download size={10} /> {doc.stats?.downloads || 0}
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