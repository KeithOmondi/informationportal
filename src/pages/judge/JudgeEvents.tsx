import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvents,
  type IEvent,
  type EventFilter,
} from "../../store/slices/eventSlice";
import {
  MapPin,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Timer,
  ArrowRight,
  ImageIcon,
} from "lucide-react";

/* ---------------- HELPERS ---------------- */
const getCountdown = (targetDate?: string) => {
  if (!targetDate) return null;
  const total = Date.parse(targetDate) - Date.now();
  if (total <= 0) return null;
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const JudgeEventsPage = () => {
  const dispatch = useAppDispatch();
  const { events = [], loading, error } = useAppSelector((state) => state.events);
  const [filter, setFilter] = useState<EventFilter>("UPCOMING");

  useEffect(() => {
    const filterParam = filter === "ALL" ? undefined : filter;
    dispatch(fetchEvents({ filter: filterParam }));
  }, [dispatch, filter]);

  const categories: { label: string; value: EventFilter }[] = [
    { label: "UPCOMING", value: "UPCOMING" },
    { label: "RECENT", value: "RECENT" },
    { label: "PAST", value: "PAST" },
    { label: "ALL", value: "ALL" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6 md:pb-10">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">High Court</span>
          </div>
          <h1 className="text-[#355E3B] font-serif text-3xl md:text-3xl font-black tracking-tight">
            Events & Sessions
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium italic">
            High Court Calendar • Office of the Registrar
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`px-5 md:px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === cat.value
                    ? "bg-[#355E3B] text-white shadow-md shadow-[#355E3B]/20"
                    : "text-slate-500 hover:text-[#C5A059]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      {loading && events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
          <Loader2 className="animate-spin text-[#355E3B]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Fetching Secure Records...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 text-red-700">
          <AlertTriangle size={32} />
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest">Server Error</p>
            <p className="text-sm font-bold mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-10">
          {events.map((event: IEvent) => {
            const timeLeft = getCountdown(event.startDate);
            const start = event.startDate ? new Date(event.startDate) : new Date();
            const end = event.endDate ? new Date(event.endDate) : start;
            const isSameDay = start.toDateString() === end.toDateString();
            
            return (
              <div
                key={event._id}
                className="group relative flex flex-col lg:flex-row bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500"
              >
                {/* Visual Cover / Image Section */}
                <div className="w-full lg:w-[350px] relative overflow-hidden bg-slate-100 min-h-[220px]">
                  {event.image?.url ? (
                    <img 
                      src={event.image.url} 
                      alt={event.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={48} strokeWidth={1} />
                      <span className="text-[8px] font-black uppercase tracking-tighter mt-2">No Visual Attached</span>
                    </div>
                  )}
                  
                  {/* Status Overlay */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                     event.status === 'ONGOING' ? 'bg-amber-500 text-white animate-pulse' : 
                     event.status === 'COMPLETED' ? 'bg-blue-600 text-white' : 
                     event.status === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-[#355E3B] text-white'
                  }`}>
                    {event.status ?? 'SCHEDULED'}
                  </div>
                </div>

                {/* Main Content Details */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.2em]">
                             {start.toLocaleString("default", { month: "long" })} {start.getFullYear()}
                           </span>
                           {event.isMandatory && (
                            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                              <AlertCircle size={10} /> Mandatory
                            </div>
                           )}
                        </div>
                        <h3 className="text-[#355E3B] font-serif text-2xl md:text-3xl font-black group-hover:text-[#C5A059] transition-colors leading-tight">
                          {event.title}
                        </h3>
                      </div>

                      {timeLeft && event.status === 'SCHEDULED' && (
                        <div className="bg-[#FDF8EE] border border-[#C5A059]/20 text-[#355E3B] px-4 py-2 rounded-2xl flex items-center gap-2 h-fit">
                          <Timer size={16} className="text-[#C5A059]" />
                          <span className="text-xs font-black uppercase">{timeLeft}</span>
                        </div>
                      )}
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-y border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[#355E3B] font-serif font-black border border-slate-100">
                          {start.getDate()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Commencement</span>
                          <span className="text-sm font-bold text-slate-700">{formatDate(event.startDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center font-serif font-black border border-slate-100 ${!isSameDay ? 'text-[#C5A059]' : 'text-[#355E3B]'}`}>
                          {end.getDate()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Conclusion</span>
                          <span className="text-sm font-bold text-slate-700">{formatDate(event.endDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={18} className="text-[#C5A059] shrink-0" />
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                        {event.location ?? 'Chambers / TBD'}
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 italic">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      ID: {event._id.slice(-8).toUpperCase()}
                    </span>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#355E3B] hover:text-[#C5A059] transition-all group/btn">
                      Full Details <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JudgeEventsPage;