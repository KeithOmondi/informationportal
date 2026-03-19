import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type IEvent,
  type EventFilter,
  type EventStatus,
} from "../../store/slices/eventSlice";
import { 
  Plus, Trash2, Edit2, Calendar, MapPin, 
  Clock, X, Search, Filter, 
  Timer, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

const getTimeRemaining = (startDate: string) => {
  const total = Date.parse(startDate) - Date.now();
  if (total <= 0) return "Started";
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
};

const AdminEventsPage = () => {
  const dispatch = useAppDispatch();
  const { events, loading } = useAppSelector((state) => state.events);

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<EventFilter>("ALL");
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "SCHEDULED" as EventStatus,
  });

  useEffect(() => {
    const filterParam = activeFilter === "ALL" ? undefined : activeFilter;
    dispatch(fetchEvents({ filter: filterParam }));
  }, [dispatch, activeFilter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (event?: IEvent) => {
    if (event) {
      setEditingEvent(event);
      setForm({
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        status: event.status,
      });
    } else {
      setEditingEvent(null);
      setForm({ title: "", description: "", location: "", startDate: "", endDate: "", status: "SCHEDULED" });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.endDate) return toast.error("Required: Title, Start, and End dates.");
    if (new Date(form.endDate) <= new Date(form.startDate)) return toast.error("End date must be after start date.");

    try {
      if (editingEvent) {
        await dispatch(updateEvent({ id: editingEvent._id, formData: form })).unwrap();
        toast.success("Registry updated");
      } else {
        await dispatch(createEvent(form)).unwrap();
        toast.success("Protocol published");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err || "Save failed");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently strike this record from the registry?")) {
      dispatch(deleteEvent(id)).unwrap().then(() => toast.success("Record purged"));
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 space-y-6 md:space-y-10 animate-in fade-in duration-700">
      
      {/* 1. HEADER & SEARCH */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-100 pb-8">
        <h1 className="text-[#355E3B] font-serif text-3xl md:text-4xl font-black tracking-tight">Events</h1>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-40">
            <select 
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as EventFilter)}
              className="appearance-none w-full bg-slate-100 border-none rounded-xl pl-10 pr-8 py-3 text-[10px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-[#355E3B]/10"
            >
              <option value="ALL">All Events</option>
              <option value="UPCOMING">Upcoming Events</option>
              <option value="PAST">Events Archive</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Search events..."
              className="w-full bg-slate-100 border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#355E3B]/10 outline-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#355E3B] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2a4b2f] transition-all shadow-lg active:scale-95"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* 2. EVENTS LIST */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#355E3B]" /></div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Calendar className="mx-auto text-slate-200 mb-3" size={48} />
            <p className="text-slate-400 font-serif italic">No records found.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event._id} className="bg-white border border-slate-200 rounded-[2rem] hover:shadow-xl transition-all group overflow-hidden flex flex-col lg:flex-row lg:items-center">
              
              {/* DATE BLOCK */}
              <div className="bg-[#355E3B] text-white p-4 lg:p-8 flex flex-row lg:flex-col items-center justify-center gap-4 lg:gap-1 lg:min-w-[140px] text-center">
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest order-2 lg:order-1">
                  {new Date(event.startDate).toLocaleString('en-US', { month: 'short' })}
                </p>
                <p className="text-3xl lg:text-4xl font-serif font-black order-1 lg:order-2">
                  {new Date(event.startDate).getDate()}
                </p>
              </div>

              {/* CONTENT BLOCK */}
              <div className="p-6 lg:p-8 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                    event.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    event.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {event.status}
                  </span>
                  <h3 className="text-[#355E3B] text-xl font-bold w-full lg:w-auto">{event.title}</h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-slate-500">
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-fit">
                    <Clock size={14} className="text-[#C5A059]" />
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase">{formatDateTime(event.startDate)}</span>
                      <ArrowRight size={10} className="text-slate-300" />
                      <span className="text-[9px] font-black uppercase text-slate-400">{formatDateTime(event.endDate)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase"><MapPin size={14} className="text-[#C5A059]" /> {event.location}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase"><Timer size={14} className="text-[#355E3B]" /> {getTimeRemaining(event.startDate)}</span>
                  </div>
                </div>
              </div>

              {/* ACTIONS BLOCK */}
              <div className="flex lg:flex-col border-t lg:border-t-0 lg:border-l border-slate-100">
                <button onClick={() => openModal(event)} className="flex-1 p-5 text-slate-400 hover:text-[#C5A059] hover:bg-slate-50 transition-all flex justify-center"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(event._id)} className="flex-1 p-5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex justify-center border-l lg:border-l-0 lg:border-t border-slate-100"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#355E3B]/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-[#355E3B] font-serif text-2xl font-black">{editingEvent ? "Edit Entry" : "New Entry"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-h-[70vh] overflow-y-auto">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#C5A059]/20" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm outline-none resize-none" />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Start Date</label>
                <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm outline-none" />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">End Date</label>
                <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm outline-none" />
              </div>

              <div className="md:col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm outline-none">
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Location</label>
                <input type="text" name="location" value={form.location} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm outline-none" />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 flex flex-col md:flex-row justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="order-2 md:order-1 w-full md:w-auto px-8 py-3.5 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="order-1 md:order-2 w-full md:w-auto px-8 py-3.5 bg-[#355E3B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#2a4b2f] disabled:opacity-50">
                {editingEvent ? "Commit Changes" : "Publish Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;