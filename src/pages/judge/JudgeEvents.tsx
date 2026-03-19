import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvents,
  type IEvent,
  type EventFilter,
} from "../../store/slices/eventSlice";
import {
  Calendar as CalendarIcon,
  MapPin,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Timer,
  ArrowRight,
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
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6 md:pb-10">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">ORHC</span>
          </div>
          <h1 className="text-[#355E3B] font-serif text-3xl md:text-4xl font-black tracking-tight">
            Events 
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium italic">
            Office of the Registrar High Court
          </p>
        </div>

        {/* Filter Tabs - Scrollable on mobile */}
        <div className="flex bg-slate-100 p-1 rounded-xl md:rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === cat.value
                    ? "bg-white text-[#355E3B] shadow-sm"
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
        <div className="flex flex-col items-center justify-center py-24 md:py-32 space-y-6 text-center">
          <Loader2 className="animate-spin text-[#355E3B]" size={32} />
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Synchronizing Registry Records...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center gap-4 md:gap-6 text-red-700">
          <AlertTriangle size={28} />
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest">Registry Synchronization Error</p>
            <p className="text-sm font-medium mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-8">
          {events.map((event: IEvent) => {
            const timeLeft = getCountdown(event.startDate);
            const start = event.startDate ? new Date(event.startDate) : new Date();
            const end = event.endDate ? new Date(event.endDate) : start;
            const isSameDay = start.toDateString() === end.toDateString();
            
            return (
              <div
                key={event._id}
                className="group relative flex flex-col md:flex-row bg-white border border-slate-200 rounded-2xl md:rounded-[3rem] overflow-hidden hover:shadow-xl transition-all duration-500"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 md:w-2 ${
                  event.status === 'ONGOING' ? 'bg-amber-500' : 
                  event.status === 'COMPLETED' ? 'bg-blue-500' : 
                  event.status === 'CANCELLED' ? 'bg-red-500' : 'bg-[#355E3B]'
                }`} />

                {/* Date Side Block - Stacked on mobile */}
                <div className="w-full md:w-48 lg:w-56 flex md:flex-col items-center justify-between md:justify-center p-5 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col md:items-center">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 md:mb-1">
                      {start.toLocaleString("default", { month: "short" })} {start.getFullYear()}
                    </span>
                    <div className="flex items-baseline gap-1 md:gap-2">
                      <span className="text-2xl md:text-4xl font-serif font-black text-[#355E3B]">
                        {start.getDate()}
                      </span>
                      {!isSameDay && (
                        <>
                          <span className="text-slate-300 font-light text-xl md:text-2xl"> - </span>
                          <span className="text-2xl md:text-4xl font-serif font-black text-[#C5A059]">
                            {end.getDate()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right md:text-center md:mt-4">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Duration</span>
                    <span className="text-[9px] md:text-[10px] font-black text-[#355E3B] uppercase">
                      {isSameDay ? "Single Day" : "Multi-Day"}
                    </span>
                  </div>
                </div>

                {/* Main Content Details */}
                <div className="flex-1 p-6 md:p-10 space-y-4 md:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                       <div className="flex flex-wrap items-center gap-2">
                         {event.status === 'ONGOING' && (
                           <span className="flex items-center gap-1 text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                             <Timer size={10} className="animate-spin" /> In Session
                           </span>
                         )}
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${
                            event.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            event.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-[#355E3B]/5 text-[#355E3B] border-[#355E3B]/10'
                         }`}>
                           {event.status ?? 'SCHEDULED'}
                         </span>
                       </div>
                       <h3 className="text-[#355E3B] font-serif text-xl md:text-2xl lg:text-3xl font-bold group-hover:text-[#C5A059] transition-colors leading-snug">
                        {event.title}
                      </h3>
                    </div>

                    {timeLeft && event.status === 'SCHEDULED' && (
                      <div className="inline-flex items-center gap-2 bg-[#355E3B] text-white px-4 py-2 rounded-xl self-start">
                        <Timer size={14} className="text-[#C5A059]" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{timeLeft}</span>
                      </div>
                    )}
                  </div>

                  {/* Explicit Date Range Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <CalendarIcon size={14} className="text-[#C5A059]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Registry Start</span>
                        <span className="text-xs font-bold text-slate-700">{formatDate(event.startDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <ArrowRight size={14} className="text-slate-300" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Conclusion</span>
                        <span className="text-xs font-bold text-slate-700">{formatDate(event.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="text-[#C5A059]" />
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {event.location ?? 'Chambers / TBD'}
                      </span>
                    </div>
                    {event.isMandatory && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg w-fit">
                        <AlertCircle size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Mandatory Appearance</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <div className="bg-slate-50/80 rounded-xl md:rounded-2xl p-4 md:p-6 border-l-4 border-[#C5A059]">
                      <p className="text-slate-600 text-xs md:text-sm leading-relaxed italic line-clamp-3 group-hover:line-clamp-none transition-all">
                        {event.description}
                      </p>
                    </div>
                  )}
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