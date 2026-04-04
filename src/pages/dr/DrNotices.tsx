import { useEffect, useState, useCallback } from "react";
import {
  Download,
  Search,
  AlertCircle,
  Calendar,
  User,
  Inbox,
  CheckCircle,
} from "lucide-react";
import debounce from "lodash/debounce";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNotices,
  downloadNotice,
  type NoticePriority,
} from "../../store/slices/noticeSlice";

const DrNotices = () => {
  const dispatch = useAppDispatch();
  const { notices, loading } = useAppSelector((state) => state.notices);
  const { user } = useAppSelector((state) => state.auth);

  const [filter, setFilter] = useState<"ALL" | NoticePriority>("ALL");
  const [search, setSearch] = useState("");

  const categories: ("ALL" | NoticePriority)[] = ["ALL", "NORMAL", "URGENT"];

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
    return () => debouncedFetch.cancel();
  }, [filter, search, debouncedFetch]);

  const formatFileSize = (size?: number) => {
    if (!size) return "0.00 MB";
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderFormattedDescription = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*") || trimmedLine.startsWith("•")) {
        return (
          <li key={i} className="ml-5 list-disc text-slate-600 mb-1 pl-2 text-sm font-medium">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }
      if (trimmedLine === "") return <div key={i} className="h-3" />;
      return (
        <p key={i} className="mb-2 text-slate-600 leading-relaxed text-sm font-medium">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-left">
          <h1 className="text-[#1a3a32] font-serif text-2xl md:text-2xl font-black mb-2 tracking-tight">
          Notice Board
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c2a336]" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Deputy Registrar Notice Board
            </p>
          </div>
        </div>
      </div>

      {/* FILTER + SEARCH */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex w-full gap-2 lg:w-auto p-1 bg-slate-100 rounded-2xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-1 lg:flex-none lg:px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === cat
                  ? "bg-white text-[#1a3a32] shadow-sm scale-[1.02]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communications, ref numbers or notices..."
            className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-[#1a3a32]/5 focus:border-[#1a3a32] transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* LISTING */}
      <div className="space-y-8">
        {loading && notices.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
             <LoaderIcon />
          </div>
        ) : notices.length === 0 ? (
          <div className="py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
            <Inbox className="text-slate-200 mb-4" size={64} />
            <h3 className="text-slate-500 font-black uppercase tracking-widest text-xs">No Records Found</h3>
          </div>
        ) : (
          notices.map((notice) => {
            const isRead = notice.readBy?.includes(user?._id || "");
            const isUrgent = notice.priority === "URGENT";

            return (
              <div
                key={notice._id}
                className={`relative group bg-white border rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-[#1a3a32]/5 ${
                  isRead ? "border-slate-100 opacity-90" : "border-[#1a3a32]/10 shadow-sm shadow-[#1a3a32]/5"
                }`}
              >
                {/* UNREAD STATUS DOT INDICATOR */}
                {!isRead && (
                  <div className="absolute top-8 left-0 w-1.5 h-12 bg-[#c2a336] rounded-r-full shadow-[2px_0_10px_rgba(194,163,54,0.4)]" />
                )}

                <div className="p-8 lg:p-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${
                        isUrgent
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-[#1a3a32]/5 text-[#1a3a32] border-[#1a3a32]/10"
                      }`}>
                        {notice.priority}
                      </span>
                      {isUrgent && (
                        <span className="flex items-center gap-1.5 text-red-600 text-[9px] font-black uppercase animate-pulse">
                          <AlertCircle size={12} /> Priority Review
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      Ref: {notice._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <h3 className={`font-serif text-2xl font-black leading-tight mb-6 ${isRead ? "text-slate-600" : "text-[#1a3a32]"}`}>
                    {notice.title}
                  </h3>

                  <div className="description-container mb-10 max-w-5xl line-clamp-3 lg:line-clamp-none">
                    {renderFormattedDescription(notice.description)}
                  </div>

                  {/* FOOTER ACTION AREA */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-50">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#c2a336]" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {new Date(notice.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[#c2a336]" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                          {notice.createdBy?.name || "Registry System"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      {notice.attachments && notice.attachments.length > 0 ? (
                        <button
                          onClick={() => dispatch(downloadNotice(notice._id))}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 font-bold text-[10px] uppercase tracking-wider"
                          title="Download Briefing"
                        >
                          <Download size={18} />
                          {formatFileSize(notice.attachments[0]?.fileSize)}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100">
                          <AlertCircle size={14} className="text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase italic">Scan Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER AUDIT NOTE */}
      <div className="flex items-center justify-center gap-2 py-6 border-t border-slate-100">
        <CheckCircle size={14} className="text-[#1a3a32]" />
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
          Office of the Registrar High Court • Information Portal
        </p>
      </div>
    </div>
  );
};

const LoaderIcon = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-10 h-10 border-[3px] border-[#1a3a32]/10 border-t-[#1a3a32] rounded-full animate-spin" />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing data...</p>
  </div>
);

export default DrNotices;