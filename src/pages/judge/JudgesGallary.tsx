import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { 
  fetchGallery, 
  locallyIncrementGalleryDownload, 
  type IGallery 
} from "../../store/slices/gallerySlice";
import {
  Maximize2,
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
} from "lucide-react";

type MediaTypeFilter = "all" | "image" | "video";

const JudgeGallery = () => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.gallery);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<MediaTypeFilter>("all");
  const [selectedMedia, setSelectedMedia] = useState<IGallery | null>(null);

  useEffect(() => {
    dispatch(fetchGallery());

    const pollInterval = setInterval(() => {
      dispatch(fetchGallery());
    }, 30000);

    const handleFocus = () => dispatch(fetchGallery());
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [dispatch]);

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

  // Handle tracked download
  const handleDownload = (item: IGallery) => {
    dispatch(locallyIncrementGalleryDownload(item._id));
    // Hits the tracking controller which redirects to Cloudinary
    const trackingUrl = `${import.meta.env.VITE_API_URL}/gallery/download/${item._id}`;
    window.location.href = trackingUrl;
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-[#1A2F1F] text-white px-8 py-6 shadow-2xl z-20 border-b border-[#EFBF04]/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#EFBF04] p-2.5 rounded-xl text-[#1A2F1F] shadow-[0_0_20px_rgba(239,191,4,0.3)]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl uppercase tracking-tight text-white">
                GALLERY
              </h1>
              <p className="text-[10px] text-[#EFBF04] font-black tracking-[0.2em] uppercase opacity-80">
                Office of the Registrar High Court
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
                      ? "bg-[#EFBF04] text-[#1A2F1F] shadow-lg"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#EFBF04]/50 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      {/* GALLERY GRID */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <div className="w-12 h-12 border-2 border-[#EFBF04] border-t-transparent rounded-full animate-spin" />
              <span className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
                Authenticating Registry Data...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
              <AlertCircle size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">
                No matching media entries found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedMedia(item)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="aspect-[4/5] relative bg-slate-900 overflow-hidden">
                    {item.resourceType === "video" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="z-10 bg-white/20 backdrop-blur-md p-4 rounded-full group-hover:scale-110 transition-transform">
                          <Play size={24} className="text-white fill-white" />
                        </div>
                        <video className="absolute inset-0 w-full h-full object-cover opacity-60" src={item.url} />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt="Registry"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A2F1F] via-transparent to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[9px] font-black text-white/80 flex items-center gap-1.5 border border-white/10">
                      <BarChart3 size={10} className="text-[#EFBF04]" />
                      {item.downloadCount || 0}
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#EFBF04] pb-1">
                        Open File
                      </span>
                      <Maximize2 size={18} className="text-[#EFBF04]" />
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-slate-600 text-[13px] leading-relaxed line-clamp-2 italic min-h-[40px] font-medium">
                      "{item.description || "No official description filed for this asset."}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-tighter ${
                        item.resourceType === 'video' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'
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

      {/* LIGHTBOX MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0F172A]/98 backdrop-blur-xl" onClick={() => setSelectedMedia(null)} />

          <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-[#1E293B] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col lg:flex-row">
            {/* Close Button Mobile */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-[100] p-2 bg-white/10 text-white rounded-full lg:hidden hover:bg-white/20"
            >
              <X size={24} />
            </button>

            {/* Media Canvas */}
            <div className="flex-[2.5] bg-black/40 relative flex items-center justify-center p-4">
              {selectedMedia.resourceType === "video" ? (
                <video controls autoPlay className="w-full h-full max-h-[80vh] rounded-xl shadow-2xl" src={selectedMedia.url} />
              ) : (
                <img src={selectedMedia.url} alt="Full view" className="w-full h-full object-contain drop-shadow-2xl" />
              )}
            </div>

            {/* Sidebar Metadata */}
            <div className="flex-1 min-w-[360px] bg-[#1E293B] p-10 flex flex-col border-l border-white/5">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-8 bg-[#EFBF04] rounded-full" />
                  <h2 className="text-white font-serif text-xl font-bold uppercase tracking-wider">
                    Asset Details
                  </h2>
                </div>

                <div className="space-y-10">
                  <section>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 block">
                      Registry Log
                    </label>
                    <p className="text-slate-200 text-sm leading-relaxed font-medium bg-white/5 p-4 rounded-xl italic border border-white/5">
                      {selectedMedia.description || "Digital asset recorded without formal description."}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                      <div className="p-2.5 bg-[#EFBF04]/10 rounded-lg text-[#EFBF04]">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Date Filed</p>
                        <p className="text-sm font-bold text-white">
                          {new Date(selectedMedia.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                      <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Accesses</p>
                        <p className="text-sm font-bold text-white">{selectedMedia.downloadCount || 0} Downloads</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Download Button */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <button
                  onClick={() => handleDownload(selectedMedia)}
                  className="w-full flex items-center justify-center gap-3 bg-[#EFBF04] hover:bg-[#FCD34D] text-[#1A2F1F] font-black text-sm py-5 rounded-2xl transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(239,191,4,0.2)]"
                >
                  <Download size={20} /> DOWNLOAD OFFICIAL COPY
                </button>
                <p className="text-center mt-4 text-[9px] text-white/30 font-bold uppercase tracking-widest">
                  Secure download will be logged for registry audit
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeGallery;