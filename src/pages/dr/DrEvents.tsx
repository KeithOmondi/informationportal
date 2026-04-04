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
  ImageIcon,
  Gavel,
  Inbox,
  X,
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

/* ---------------- MODAL ---------------- */
const EventModal = ({
  event,
  onClose,
}: {
  event: IEvent;
  onClose: () => void;
}) => {
  const start = event.startDate ? new Date(event.startDate) : new Date();
  const end = event.endDate ? new Date(event.endDate) : start;
  const isSameDay = start.toDateString() === end.toDateString();
  const timeLeft = getCountdown(event.startDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image */}
        <div className="relative w-full h-64 bg-slate-100 rounded-t-[2rem] overflow-hidden">
          {event.image?.url ? (
            <img
              src={event.image.url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
              <ImageIcon size={48} strokeWidth={1} />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-2 text-slate-300">
                Registry Archive
              </span>
            </div>
          )}
          <div
            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
              event.status === "ONGOING"
                ? "bg-[#c2a336] text-white animate-pulse"
                : event.status === "COMPLETED"
                ? "bg-slate-600 text-white"
                : event.status === "CANCELLED"
                ? "bg-red-600 text-white"
                : "bg-[#1a3a32] text-white"
            }`}
          >
            {event.status ?? "SCHEDULED"}
          </div>
          <div className="absolute bottom-4 left-4">
            <span className="bg-[#1a3a32]/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
              {event.targetAudience || "General"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full p-2 shadow-md hover:bg-white transition-colors"
          >
            <X size={16} className="text-[#1a3a32]" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-black text-[#c2a336] uppercase tracking-[0.2em]">
                {start.toLocaleString("default", { month: "long" })}{" "}
                {start.getFullYear()}
              </span>
              {event.isMandatory && (
                <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-red-100">
                  <AlertCircle size={10} /> Mandatory
                </div>
              )}
              {timeLeft && (
                <div className="flex items-center gap-1.5 bg-[#fdf9f0] border border-[#c2a336]/20 text-[#1a3a32] px-3 py-1 rounded-full">
                  <Timer size={12} className="text-[#c2a336]" />
                  <span className="text-[9px] font-black uppercase">{timeLeft}</span>
                </div>
              )}
            </div>
            <h2 className="text-[#1a3a32] font-serif text-2xl md:text-3xl font-black leading-tight">
              {event.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-y border-slate-100">
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
              <div className={`h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center font-serif font-black border border-slate-100 ${!isSameDay ? "text-[#c2a336]" : "text-[#1a3a32]"}`}>
                {end.getDate()}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Conclusion</span>
                <span className="text-sm font-bold text-slate-700">{formatDate(event.endDate)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-600">
            <MapPin size={16} className="text-[#c2a336] shrink-0 mt-0.5" />
            <span className="text-sm font-bold uppercase tracking-wide">
              {event.location ?? "Registry Chambers"}
            </span>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed italic">
            {event.description}
          </p>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
              ID: {event._id.slice(-8).toUpperCase()}
            </span>
            <button
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#1a3a32] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
const DrEvents = () => {
  const dispatch = useAppDispatch();
  const { events = [], loading, error } = useAppSelector(
    (state) => state.events
  );
  const [filter, setFilter] = useState<EventFilter>("UPCOMING");
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

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
    <>
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6 md:pb-10">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-3">
              <Gavel size={16} className="text-[#c2a336]" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Deputy Registrar
              </span>
            </div>
            <h1 className="text-[#1a3a32] font-serif text-2xl md:text-4xl font-black tracking-tight">
              Events Board
            </h1>
          </div>

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
              Synchronizing Registry...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 text-red-700">
            <AlertTriangle size={32} />
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest">Connection Error</p>
              <p className="text-sm font-bold mt-1">{error}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
            <Inbox size={48} className="text-slate-200" />
            <p className="text-slate-400 font-serif italic text-sm mt-4 tracking-wide">
              No active records found for the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8">
            {events.map((event: IEvent) => {
              const timeLeft = getCountdown(event.startDate);
              const start = event.startDate ? new Date(event.startDate) : new Date();
              const end = event.endDate ? new Date(event.endDate) : start;
              const isSameDay = start.toDateString() === end.toDateString();
              const shortDesc =
                event.description && event.description.length > 180
                  ? event.description.slice(0, 180) + "..."
                  : event.description;
              const hasMore = event.description && event.description.length > 180;

              return (
                <div
                  key={event._id}
                  className="group relative flex flex-col lg:flex-row bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:border-[#1a3a32]/10"
                >
                  {/* MEDIA */}
                  <div className="w-full lg:w-[340px] relative overflow-hidden bg-slate-50 min-h-[220px] shrink-0">
                    {event.image?.url ? (
                      <img
                        src={event.image.url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                        <ImageIcon size={48} strokeWidth={1} />
                        <span className="text-[8px] font-black uppercase tracking-tighter mt-2 text-slate-300">
                          Registry Archive
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-[#1a3a32]/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                        {event.targetAudience || "General"}
                      </span>
                    </div>
                    <div
                      className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                        event.status === "ONGOING"
                          ? "bg-[#c2a336] text-white animate-pulse"
                          : event.status === "COMPLETED"
                          ? "bg-slate-600 text-white"
                          : event.status === "CANCELLED"
                          ? "bg-red-600 text-white"
                          : "bg-[#1a3a32] text-white"
                      }`}
                    >
                      {event.status ?? "SCHEDULED"}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 p-7 md:p-9 flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-[#c2a336] uppercase tracking-[0.2em]">
                              {start.toLocaleString("default", { month: "long" })} {start.getFullYear()}
                            </span>
                            {event.isMandatory && (
                              <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-red-100">
                                <AlertCircle size={10} /> Mandatory
                              </div>
                            )}
                          </div>
                          <h3 className="text-[#1a3a32] font-serif text-2xl md:text-3xl font-black group-hover:text-[#c2a336] transition-colors leading-tight">
                            {event.title}
                          </h3>
                        </div>
                        {timeLeft && (
                          <div className="bg-[#fdf9f0] border border-[#c2a336]/20 text-[#1a3a32] px-4 py-2 rounded-2xl flex items-center gap-2 h-fit shrink-0">
                            <Timer size={14} className="text-[#c2a336]" />
                            <span className="text-xs font-black uppercase">{timeLeft}</span>
                          </div>
                        )}
                      </div>

                      {/* Date timeline */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-5 border-y border-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[#1a3a32] font-serif font-black border border-slate-100 shrink-0">
                            {start.getDate()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Commencement</span>
                            <span className="text-sm font-bold text-slate-700">{formatDate(event.startDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center font-serif font-black border border-slate-100 shrink-0 ${!isSameDay ? "text-[#c2a336]" : "text-[#1a3a32]"}`}>
                            {end.getDate()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">Conclusion</span>
                            <span className="text-sm font-bold text-slate-700">{formatDate(event.endDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin size={16} className="text-[#c2a336] shrink-0" />
                        <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                          {event.location ?? "Registry Chambers"}
                        </span>
                      </div>

                      {/* Description preview */}
                      <p className="text-slate-500 text-sm leading-relaxed italic">
                        {shortDesc}
                        {hasMore && (
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="ml-1.5 text-[#c2a336] font-black text-[10px] uppercase tracking-widest hover:underline not-italic"
                          >
                            Read more
                          </button>
                        )}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        ID: {event._id.slice(-8).toUpperCase()}
                      </span>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3a32] hover:text-[#c2a336] transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default DrEvents;