import { useEffect, useState, useCallback } from "react";
import {
  Download,
  Eye,
  Search,
  AlertCircle,
  Calendar,
  User,
  Inbox
} from "lucide-react";
import debounce from "lodash/debounce"; // Recommended: npm install lodash

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNotices,
  downloadNotice,
  type NoticePriority,
} from "../../store/slices/noticeSlice";

const JudgeNoticesPage = () => {
  const dispatch = useAppDispatch();
  const { notices, loading } = useAppSelector((state) => state.notices);

  const [filter, setFilter] = useState<"ALL" | NoticePriority>("ALL");
  const [search, setSearch] = useState("");

  const categories: ("ALL" | NoticePriority)[] = ["ALL", "NORMAL", "URGENT"];

  // Debounced Search Implementation
  const debouncedFetch = useCallback(
    debounce((currentFilter: string, currentSearch: string) => {
      const params: any = {};
      if (currentFilter !== "ALL") params.priority = currentFilter;
      if (currentSearch) params.search = currentSearch;
      dispatch(fetchNotices(params));
    }, 500),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetch(filter, search);
    // Cleanup debounce on unmount
    return () => debouncedFetch.cancel();
  }, [filter, search, debouncedFetch]);

  const formatFileSize = (size?: number) => {
    if (!size) return "0.00 MB";
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Nunito',sans-serif]">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-[#355E3B] font-serif text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight">
            ORHC Notice Board
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Official Registry High Court Information Portal
          </p>
        </div>
      </div>

      {/* FILTER + SEARCH */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex w-full gap-2 lg:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-1 lg:flex-none lg:px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border text-center ${
                filter === cat
                  ? "bg-[#355E3B] border-[#355E3B] text-white shadow-lg shadow-[#355E3B]/20 scale-[1.02]"
                  : "bg-white border-slate-200 text-slate-400 hover:border-[#355E3B]/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, descriptions, or cause numbers..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-[#355E3B]/5 focus:border-[#355E3B] transition-all outline-none placeholder:text-slate-300 shadow-sm"
          />
        </div>
      </div>

      {/* GRID/LIST */}
      <div className="grid gap-8">
        {loading && notices.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-[#355E3B]/10 border-t-[#355E3B] rounded-full animate-spin" />
             <span className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Synchronizing Registry...</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
            <Inbox className="text-slate-300 mb-4" size={48} />
            <h3 className="text-slate-600 font-bold text-lg">No Records Found</h3>
            <p className="text-slate-400 text-sm max-w-xs">We couldn't find any notices matching your current search or filter criteria.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice._id}
              className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-[#355E3B]/20 transition-all duration-500"
            >
              <div className="p-6 lg:p-12">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${
                        notice.priority === "URGENT"
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-[#355E3B]/5 text-[#355E3B] border border-[#355E3B]/10"
                      }`}
                    >
                      {notice.priority}
                    </span>
                    {notice.priority === "URGENT" && (
                      <span className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase animate-pulse">
                        <AlertCircle size={14} /> Critical
                      </span>
                    )}
                  </div>
                  
                  {/* Target Audience Badge */}
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md uppercase">
                    Ref: {notice.targetAudience}
                  </span>
                </div>

                <h3 className="text-[#355E3B] font-serif text-2xl lg:text-4xl font-extrabold leading-tight mb-4 group-hover:text-[#2a4a2e] transition-colors">
                  {notice.title}
                </h3>

                <p className="text-slate-600 text-sm lg:text-lg leading-relaxed mb-8 font-medium max-w-4xl">
                  {notice.description}
                </p>

                {/* META INFO & ACTIONS */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-100">
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#C5A059]" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        {new Date(notice.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={16} className="text-[#C5A059]" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        {notice.createdBy?.name || "Registry System"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Eye size={16} />
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {notice.stats?.views ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    {notice.attachments && notice.attachments.length > 0 ? (
                      <button
                        onClick={() => dispatch(downloadNotice(notice._id))}
                        className="w-full flex items-center justify-center gap-4 bg-[#355E3B] text-white px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-[#355E3B]/20 hover:bg-[#2a4a2e] hover:-translate-y-1 active:scale-[0.98] transition-all"
                      >
                        <Download size={20} strokeWidth={3} />
                        Download File • {formatFileSize(notice.attachments[0]?.fileSize)}
                      </button>
                    ) : (
                      <span className="text-[11px] font-black text-slate-300 uppercase italic tracking-widest">
                        Document scan pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JudgeNoticesPage;