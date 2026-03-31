import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { 
  fetchGallery, 
  locallyIncrementGalleryDownload, 
  type IGallery 
} from "../../store/slices/gallerySlice";
import {
  X,
  Play,
  Search,
  ShieldCheck,
  Calendar,
  Download,
  AlertCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  LayoutGrid,
  BarChart3,
  ExternalLink,
} from "lucide-react";

type MediaTypeFilter = "all" | "image" | "video";

const JudgeGallery = () => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.gallery);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<MediaTypeFilter>("all");
  const [selectedMedia, setSelectedMedia] = useState<IGallery | null>(null);

  // -------------------- SYNC & POLLING --------------------
  useEffect(() => {
    dispatch(fetchGallery());

    // Background sync every 30 seconds to keep registry current
    const pollInterval = setInterval(() => {
      dispatch(fetchGallery());
    }, 30000);

    // Refresh immediately when returning to the tab
    const handleFocus = () => dispatch(fetchGallery());
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [dispatch]);

  // -------------------- FILTERING LOGIC --------------------
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = (item.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType =
        activeFilter === "all" || item.resourceType === activeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, searchTerm, activeFilter]);

  // -------------------- SECURE DOWNLOAD --------------------
  const handleDownload = (item: IGallery) => {
    // 1. Optimistic UI increment in Redux
    dispatch(locallyIncrementGalleryDownload(item._id));
    
    // 2. Route through tracking controller for audit log
    const trackingUrl = `${import.meta.env.VITE_API_URL}/gallery/download/${item._id}`;
    
    // Create a temporary link to force the browser to handle the redirect properly
    const link = document.createElement("a");
    link.href = trackingUrl;
    link.target = "_blank"; // Open in new tab to avoid disrupting current view
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* JUDICIAL HEADER */}
      <header className="bg-[#1A3A32] text-white px-8 py-6 shadow-2xl z-20 border-b border-[#C2A336]/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#C2A336] p-2.5 rounded-xl text-[#1A3A32] shadow-[0_0_20px_rgba(194,163,54,0.3)]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl uppercase tracking-tight text-white">
                Gallery
              </h1>
              <p className="text-[10px] text-[#C2A336] font-black tracking-[0.2em] uppercase opacity-90">
                High Court of Kenya | Information Portal
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
              {(["all", "image", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeFilter === type
                      ? "bg-[#C2A336] text-[#1A3A32] shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {type === "all" && <LayoutGrid size={14} />}
                  {type === "image" && <ImageIcon size={14} />}
                  {type === "video" && <VideoIcon size={14} />}
                  {type}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="text"
                placeholder="Search registry files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#C2A336]/50 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* REPOSITORY GRID */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <div className="w-12 h-12 border-4 border-[#C2A336] border-t-transparent rounded-full animate-spin" />
              <span className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
                Retrieving Certified Assets...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl bg-white/50">
              <AlertCircle size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">No matching assets found in registry</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedMedia(item)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500"
                >
                  <div className="aspect-[4/5] relative bg-slate-900 overflow-hidden">
                    {item.resourceType === "video" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="z-10 bg-white/20 backdrop-blur-md p-4 rounded-full group-hover:scale-110 transition-transform duration-500">
                          <Play size={24} className="text-white fill-white" />
                        </div>
                        <video className="absolute inset-0 w-full h-full object-cover opacity-60" src={item.url} />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt="Registry"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      />
                    )}

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A3A32] via-transparent to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    {/* View/Download Stats Badge */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white/90 flex items-center gap-1.5 border border-white/10">
                      <BarChart3 size={12} className="text-[#C2A336]" />
                      {item.downloadCount || 0}
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-[#C2A336] pb-1">
                        Inspect Asset
                      </span>
                      <ExternalLink size={18} className="text-[#C2A336]" />
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-2 italic min-h-[40px] font-medium border-l-2 border-slate-100 pl-3">
                      "{item.description || "No official description filed."}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {new Date(item.createdAt).toLocaleDateString('en-KE')}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-tighter shadow-sm ${
                        item.resourceType === 'video' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.resourceType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ASSET INSPECTION LIGHTBOX */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md transition-opacity" 
            onClick={() => setSelectedMedia(null)} 
          />

          <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-[#1E293B] rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col lg:flex-row animate-in zoom-in-95 duration-300">
            
            {/* Close Button Mobile */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-6 right-6 z-[100] p-3 bg-white/10 text-white rounded-2xl lg:hidden hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Media Canvas */}
            <div className="flex-[2.5] bg-black/50 relative flex items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-white/5">
              {selectedMedia.resourceType === "video" ? (
                <video controls autoPlay className="w-full h-full max-h-[75vh] rounded-2xl shadow-2xl" src={selectedMedia.url} />
              ) : (
                <img src={selectedMedia.url} alt="Full view" className="w-full h-full object-contain drop-shadow-2xl" />
              )}
            </div>

            {/* Registry Sidebar */}
            <div className="flex-1 min-w-[380px] bg-[#1E293B] p-10 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-2 h-10 bg-[#C2A336] rounded-full" />
                  <h2 className="text-white font-serif text-2xl font-bold uppercase tracking-wider">
                    Asset Record
                  </h2>
                </div>

                <div className="space-y-8">
                  <section>
                    <label className="text-[10px] font-black text-[#C2A336] uppercase tracking-[0.3em] mb-4 block">
                      Certified Description
                    </label>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                      <p className="text-slate-200 text-sm leading-relaxed font-medium italic">
                        {selectedMedia.description || "Digital asset recorded without formal description."}
                      </p>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-5 bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div className="p-3 bg-[#C2A336]/10 rounded-xl text-[#C2A336]">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Entry Filed</p>
                        <p className="text-sm font-bold text-white">
                          {new Date(selectedMedia.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Audit Count</p>
                        <p className="text-sm font-bold text-white">{selectedMedia.downloadCount || 0} External Accesses</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Download Trigger */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <button
                  onClick={() => handleDownload(selectedMedia)}
                  className="w-full flex items-center justify-center gap-3 bg-[#C2A336] hover:bg-[#D4B54D] text-[#1A3A32] font-black text-sm py-5 rounded-[1.25rem] transition-all active:scale-[0.97] shadow-lg"
                >
                  <Download size={20} /> DOWNLOAD OFFICIAL COPY
                </button>
                <div className="flex items-center justify-center gap-2 mt-5 opacity-40">
                  <ShieldCheck size={12} className="text-white" />
                  <p className="text-[9px] text-white font-bold uppercase tracking-widest">
                    Access will be logged in registry audit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeGallery;