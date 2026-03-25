import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGallery, type IGallery } from "../../store/slices/gallerySlice";
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

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-[#1A2F1F] text-white px-8 py-6 shadow-2xl z-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#EFBF04] p-2.5 rounded-xl text-[#1A2F1F]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl uppercase tracking-tight text-white">
                MEDIA GALLERY
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Filter tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {(["all", "image", "video"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === type
                      ? "bg-[#EFBF04] text-[#1A2F1F] shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {type === "all" && <LayoutGrid size={14} className="inline mr-2" />}
                  {type === "image" && <ImageIcon size={14} className="inline mr-2" />}
                  {type === "video" && <VideoIcon size={14} className="inline mr-2" />}
                  {type}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                size={18}
              />
              <input
                type="text"
                placeholder="Search description..."
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
                Loading Registry...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">
                No matching media entries found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedMedia(item)}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-square relative bg-slate-900 overflow-hidden">
                    {item.resourceType === "video" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="z-10 bg-white/20 backdrop-blur-md p-3 rounded-full">
                          <Play size={20} className="text-white fill-white" />
                        </div>
                        <video
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                          src={item.url}
                        />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt="Gallery item"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest truncate">
                        View Details
                      </p>
                      <Maximize2 size={16} className="text-[#EFBF04]" />
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-slate-600 text-xs line-clamp-2 italic min-h-[32px]">
                      "{item.description || "No description provided."}"
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[9px] font-black text-[#355E3B] uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md"
            onClick={() => setSelectedMedia(null)}
          />

          <div className="relative w-full max-w-6xl h-full max-h-[85vh] bg-[#1E293B] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col lg:flex-row">

            {/* Media canvas */}
            <div className="flex-[3] bg-black/20 relative flex items-center justify-center">
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-6 left-6 z-50 p-2 bg-black/50 text-white rounded-lg hover:bg-black transition-colors"
              >
                <X size={20} />
              </button>

              {selectedMedia.resourceType === "video" ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src={selectedMedia.url}
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Full view"
                  className="w-full h-full object-contain p-4"
                />
              )}
            </div>

            {/* Sidebar metadata */}
            <div className="flex-1 min-w-[320px] bg-[#1E293B] p-8 flex flex-col border-l border-white/5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-[10px] font-black text-[#EFBF04] uppercase tracking-[0.3em]">
                    Registry Secure View
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">
                      Description
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      {selectedMedia.description || "No official report filed."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-[#EFBF04]" />
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase">
                          Filed On
                        </p>
                        <p className="text-sm font-bold text-white">
                          {new Date(selectedMedia.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download button — uses server-generated fl_attachment URL */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <a
                  href={selectedMedia.downloadUrl}
                  download={`gallery-${selectedMedia._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#EFBF04] hover:bg-[#fcd34d] text-[#1A2F1F] font-black text-xs py-4 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  <Download size={16} /> DOWNLOAD
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeGallery;