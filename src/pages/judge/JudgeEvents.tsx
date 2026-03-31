import { useEffect, useState, useMemo } from "react";
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
  Scale,
  Inbox
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
    // We use the AbortController pattern to prevent race conditions
    // and "abnormal reloads" when switching between judicial filters.
    const promise = dispatch(
      fetchEvents({ filter: filter === "ALL" ? undefined : filter })
    );

    return () => {
      promise.abort();
    };
  }, [dispatch, filter]);

  const categories = useMemo<{ label: string; value: EventFilter }[]>(() => [
    { label: "UPCOMING", value: "UPCOMING" },
    { label: "RECENT", value: "RECENT" },
    { label: "PAST", value: "PAST" },
    { label: "ALL RECORDS", value: "ALL" },
  ], []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* JUDICIAL HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6 md:pb-10">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-3">
             <Scale size={16} className="text-[#c2a336]" />
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Principal Registry</span>
          </div>
          <h1 className="text-[#1a3a32] font-serif text-2xl md:text-4xl font-black tracking-tight">
            Events Calendar
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`px-5 md:px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === cat.value
                    ? "bg-[#1a3a32] text-white shadow-md shadow-[#1a3a32]/20"
                    : "text-slate-500 hover:text-[#c2a336]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATE HANDLING */}
      {loading && events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
          <Loader2 className="animate-spin text-[#1a3a32]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Accessing Secure Registry...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 text-red-700">
          <AlertTriangle size={32} />
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest">System Error</p>
            <p className="text-sm font-bold mt-1">{error}</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
           <Inbox size={48} className="text-slate-200" />
           <p className="text-slate-400 font-serif italic text-sm mt-4 tracking-wide">No active judicial records found in this category.</p>
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
                className="group relative flex flex-col lg:flex-row bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:border-[#1a3a32]/10"
              >
                {/* Media Section */}
                <div className="w-full lg:w-[380px] relative overflow-hidden bg-slate-50 min-h-[250px]">
                  {event.image?.url ? (
                    <img 
                      src={event.image.url} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                      <ImageIcon size={48} strokeWidth={1} />
                      <span className="text-[8px] font-black uppercase tracking-tighter mt-2 text-slate-300">Registry Archive</span>
                    </div>
                  )}
                  
                  {/* Scope Tag */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className="bg-[#1a3a32]/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                       {event.targetAudience || 'Judicial Only'}
                    </span>
                  </div>

                  {/* Operational Status */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                     event.status === 'ONGOING' ? 'bg-[#c2a336] text-white animate-pulse' : 
                     event.status === 'COMPLETED' ? 'bg-slate-600 text-white' : 
                     event.status === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-[#1a3a32] text-white'
                  }`}>
                    {event.status ?? 'SCHEDULED'}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-[#c2a336] uppercase tracking-[0.2em]">
                             {start.toLocaleString("default", { month: "long" })} {start.getFullYear()}
                           </span>
                           {event.isMandatory && (
                            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                              <AlertCircle size={10} /> Mandatory
                            </div>
                           )}
                        </div>
                        <h3 className="text-[#1a3a32] font-serif text-2xl md:text-3xl font-black group-hover:text-[#c2a336] transition-colors leading-tight">
                          {event.title}
                        </h3>
                      </div>

                      {timeLeft && event.status === 'SCHEDULED' && (
                        <div className="bg-[#fdf9f0] border border-[#c2a336]/20 text-[#1a3a32] px-4 py-2 rounded-2xl flex items-center gap-2 h-fit">
                          <Timer size={16} className="text-[#c2a336]" />
                          <span className="text-xs font-black uppercase">{timeLeft}</span>
                        </div>
                      )}
                    </div>

                    {/* Registry Timeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-y border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[#1a3a32] font-serif font-black border border-slate-100">
                          {start.getDate()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Commencement</span>
                          <span className="text-sm font-bold text-slate-700">{formatDate(event.startDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center font-serif font-black border border-slate-100 ${!isSameDay ? 'text-[#c2a336]' : 'text-[#1a3a32]'}`}>
                          {end.getDate()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Conclusion</span>
                          <span className="text-sm font-bold text-slate-700">{formatDate(event.endDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={18} className="text-[#c2a336] shrink-0" />
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                        {event.location ?? 'Registry Chambers'}
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 italic">
                      {event.description}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      ID: {event._id.slice(-8).toUpperCase()}
                    </span>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3a32] hover:text-[#c2a336] transition-all group/btn">
                      View Session Details <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
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