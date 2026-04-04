import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvents,
  type IEvent,
  type EventFilter,
} from "../../store/slices/eventSlice";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Timer,
  ImageIcon,
  Gavel,
  CalendarDays,
  Inbox,
} from "lucide-react";

/* ---------------- HELPERS ---------------- */
const getCountdown = (targetDate?: string) => {
  if (!targetDate) return null;
  const total = Date.parse(targetDate) - Date.now();
  if (total <= 0) return null;
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const DrEvents = () => {
  const dispatch = useAppDispatch();
  const { events = [], loading, error } = useAppSelector(
    (state) => state.events
  );
  const [filter, setFilter] = useState<EventFilter>("UPCOMING");

  useEffect(() => {
    const promise = dispatch(
      fetchEvents({ filter: filter === "ALL" ? undefined : filter })
    );
    return () => {
      promise.abort();
    };
  }, [dispatch, filter]);

  const categories = useMemo<{ label: string; value: EventFilter }[]>(
    () => [
      { label: "UPCOMING", value: "UPCOMING" },
      { label: "RECENT", value: "RECENT" },
      { label: "ALL RECORDS", value: "ALL" },
    ],
    []
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-start gap-4">
          <div className="bg-[#1a3a32] p-3 rounded-2xl shadow-lg shadow-[#1a3a32]/20">
            <Gavel className="text-[#c2a336]" size={24} />
          </div>
          <div>
            <h1 className="text-[#1a3a32] font-serif text-3xl font-black tracking-tight">
              Events
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
              Deputy Registrar Events Board
            </p>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === cat.value
                    ? "bg-white text-[#1a3a32] shadow-sm ring-1 ring-black/5"
                    : "text-slate-400 hover:text-[#c2a336]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading && events.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#1a3a32]" size={32} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
            Synchronizing Registry...
          </span>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100 text-red-600 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={32} />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest">
              Connection Error
            </p>
            <p className="text-sm font-bold">{error}</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
          <Inbox size={48} strokeWidth={1} />
          <p className="mt-4 font-serif italic text-sm text-slate-400">
            No active records found for the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {events.map((event: IEvent) => {
            const timeLeft = getCountdown(event.startDate);

            return (
              <div
                key={event._id}
                className="group bg-white border border-slate-100 rounded-[2.5rem] p-3 flex flex-col sm:flex-row gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:border-[#1a3a32]/10"
              >
                {/* THUMBNAIL */}
                <div className="w-full sm:w-52 shrink-0 rounded-[2rem] overflow-hidden bg-slate-100 relative">
                  {event.image?.url ? (
                    <img
                      src={event.image.url}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt={event.title}
                    />
                  ) : (
                    <div className="w-full h-full min-h-[13rem] flex items-center justify-center text-slate-300">
                      <ImageIcon size={32} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-[#1a3a32] text-[8px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm border border-slate-100">
                      {event.targetAudience || "General"}
                    </span>
                  </div>
                </div>

                {/* INFO */}
                <div className="flex-1 py-4 pr-4 flex flex-col gap-4">

                  {/* DATE + MANDATORY BADGE */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-[#c2a336]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {formatDate(event.startDate)}
                      </span>
                    </div>
                    {event.isMandatory && (
                      <span className="bg-red-50 text-red-600 text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border border-red-100">
                        Mandatory
                      </span>
                    )}
                  </div>

                  {/* TITLE — no line-clamp */}
                  <h3 className="text-[#1a3a32] font-serif text-xl md:text-2xl font-black group-hover:text-[#c2a336] transition-colors leading-tight">
                    {event.title}
                  </h3>

                  {/* LOCATION */}
                  <div className="flex items-start gap-2 text-slate-500">
                    <MapPin size={14} className="text-[#c2a336] shrink-0 mt-0.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {event.location || "Registry Chambers"}
                    </span>
                  </div>

                  {/* DESCRIPTION — no line-clamp */}
                  <p className="text-slate-400 text-xs leading-relaxed italic font-medium">
                    {event.description}
                  </p>

                  {/* COUNTDOWN */}
                  <div className="pt-4 border-t border-slate-50">
                    {timeLeft ? (
                      <div className="flex items-center gap-2 text-[#1a3a32] bg-slate-50 px-3 py-1.5 rounded-full w-fit">
                        <Timer size={12} className="text-[#c2a336]" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                          {timeLeft}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">
                        Live Session
                      </span>
                    )}
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

export default DrEvents;