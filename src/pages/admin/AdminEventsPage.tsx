import { useEffect, useState, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type IEvent,
  type EventFilter,
  type EventStatus,
  type EventAudience, // Added from slice
} from "../../store/slices/eventSlice";
import { 
  Plus, Trash2, Edit2, MapPin, 
  X, Search, 
  Timer, Upload, Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const getTimeRemaining = (startDate: string) => {
  const total = Date.parse(startDate) - Date.now();
  if (total <= 0) return "Started";
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
};

const AdminEventsPage = () => {
  const dispatch = useAppDispatch();
  const { events, loading } = useAppSelector((state) => state.events);

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<EventFilter>("ALL");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "SCHEDULED" as EventStatus,
    targetAudience: "ALL" as EventAudience, // New Field
    isMandatory: "false"
  });

  useEffect(() => {
    dispatch(fetchEvents({ filter: activeFilter === "ALL" ? undefined : activeFilter }));
  }, [dispatch, activeFilter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openModal = (event?: IEvent) => {
    setSelectedFile(null);
    setPreviewUrl(event?.image?.url || null);
    
    if (event) {
      setEditingEvent(event);
      setForm({
        title: event.title,
        description: event.description || "",
        location: event.location,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        status: event.status,
        targetAudience: event.targetAudience || "ALL",
        isMandatory: String(event.isMandatory)
      });
    } else {
      setEditingEvent(null);
      setForm({ 
        title: "", 
        description: "", 
        location: "", 
        startDate: "", 
        endDate: "", 
        status: "SCHEDULED", 
        targetAudience: "ALL", 
        isMandatory: "false" 
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.endDate) return toast.error("Required: Title, Start, and End dates.");
    
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (selectedFile) formData.append("image", selectedFile);

    try {
      if (editingEvent) {
        await dispatch(updateEvent({ id: editingEvent._id, formData })).unwrap();
        toast.success("Registry updated");
      } else {
        await dispatch(createEvent(formData)).unwrap();
        toast.success("Protocol published");
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err || "Save failed");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently strike this record?")) {
      dispatch(deleteEvent(id)).unwrap().then(() => toast.success("Record purged"));
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-[#1a3a32] font-serif text-2xl font-black">Events</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Judicial Registry Console</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search..."
              className="w-full bg-slate-50 border-none rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#1a3a32]/20 outline-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as EventFilter)}
            className="bg-slate-50 border-none rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 outline-none"
          >
            <option value="ALL">All Records</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="PAST">Archive</option>
          </select>
          
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-[#1a3a32] text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#122a24] transition-all shadow-md active:scale-95"
          >
            <Plus size={14} /> New Entry
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="py-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a32]" /></div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-serif italic text-sm">No registry entries match the current filter.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event._id} className="bg-white border border-slate-100 rounded-xl hover:border-[#1a3a32]/20 transition-all flex flex-col sm:flex-row overflow-hidden group shadow-sm">
              <div className="w-full sm:w-32 h-24 sm:h-auto bg-slate-100 shrink-0 relative">
                {event.image?.url ? (
                  <img src={event.image.url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={20}/></div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                   <span className="text-[6px] font-black bg-white/90 text-[#1a3a32] px-1 py-0.5 rounded shadow-sm uppercase">{event.targetAudience}</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border uppercase ${
                    event.status === 'SCHEDULED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {event.status}
                  </span>
                  {event.isMandatory && (
                    <span className="flex items-center gap-1 text-[7px] font-black uppercase bg-red-600 text-white px-1.5 py-0.5 rounded-md">
                      <AlertCircle size={8} /> Mandatory
                    </span>
                  )}
                  <h3 className="text-[#1a3a32] text-sm font-bold truncate flex-1">{event.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase"><MapPin size={12} className="text-[#c2a336]" /> {event.location}</span>
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase"><Timer size={12} className="text-[#1a3a32]" /> {getTimeRemaining(event.startDate)}</span>
                </div>
              </div>

              <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l border-slate-50">
                <button onClick={() => openModal(event)} className="flex-1 p-3 text-slate-400 hover:text-[#c2a336] hover:bg-slate-50 transition-colors flex justify-center border-r sm:border-r-0 sm:border-b border-slate-50"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(event._id)} className="flex-1 p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex justify-center"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a3a32]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-[#1a3a32] font-serif text-xl font-black">{editingEvent ? "Update Protocol" : "Publish New Entry"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* IMAGE UPLOADER */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-[21/9] w-full rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1a3a32]/30 transition-colors"
              >
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="text-center">
                    <Upload size={20} className="mx-auto text-slate-300 mb-1" />
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Upload Banner</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* AUDIENCE SELECTOR - TOGGLE GROUP */}
                <div className="col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Target Audience</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ALL', 'JUDGES', 'DR'] as EventAudience[]).map((aud) => (
                      <button
                        key={aud}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, targetAudience: aud }))}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                          form.targetAudience === aud 
                          ? 'bg-[#1a3a32] text-white border-[#1a3a32] shadow-md' 
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Title</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#c2a336]/30" />
                </div>

                <div className="col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Description</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    rows={2} 
                    className="w-full bg-slate-50 rounded-lg pl-3 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#c2a336]/30 resize-none"
                    placeholder="Enter judicial event details..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Location</label>
                  <input type="text" name="location" value={form.location} onChange={handleChange} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#c2a336]/30" />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Start Date/Time</label>
                  <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-[10px] outline-none" />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">End Date/Time</label>
                  <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-[10px] outline-none" />
                </div>

                <div className="col-span-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-xs outline-none">
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="flex items-end pb-1.5 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={form.isMandatory === "true"}
                      onChange={(e) => setForm(prev => ({ ...prev, isMandatory: String(e.target.checked) }))}
                    />
                    <div className={`w-8 h-4 rounded-full transition-colors relative ${form.isMandatory === "true" ? 'bg-red-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${form.isMandatory === "true" ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-red-500 transition-colors">Mandatory</span>
                  </label>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-slate-50 flex gap-2 justify-end border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 text-[10px] font-black uppercase hover:bg-slate-200 rounded-lg transition-all">Discard</button>
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-[#1a3a32] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md disabled:opacity-50">
                {editingEvent ? "Commit Changes" : "Publish to Registry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;