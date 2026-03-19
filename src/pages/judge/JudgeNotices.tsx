import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  Search,
  AlertCircle,
  Calendar,
} from "lucide-react";

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

  useEffect(() => {
    const params: any = {};
    if (filter !== "ALL") params.priority = filter;
    if (search) params.search = search;

    dispatch(fetchNotices(params));
  }, [dispatch, filter, search]);

  const formatFileSize = (size?: number) => {
    if (!size) return "0.00 MB";
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Nunito',sans-serif]">
      
      {/* HEADER - Centered on mobile for better balance */}
      <div className="border-b border-slate-200 pb-6 text-center lg:text-left">
        <h1 className="text-[#355E3B] font-serif text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight">
          ORHC Notice Board
        </h1>
      </div>

      {/* FILTER + SEARCH - Stacked perfectly on mobile */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Buttons now grow to take equal width on mobile */}
        <div className="flex w-full gap-2 lg:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-1 lg:flex-none lg:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border text-center ${
                filter === cat
                  ? "bg-[#355E3B] border-[#355E3B] text-white shadow-md"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar - Full width on mobile */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search registry..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-[#355E3B]/5 focus:border-[#355E3B] transition-all outline-none"
          />
        </div>
      </div>

      {/* GRID/LIST */}
      <div className="grid gap-6">
        {loading && notices.length === 0 ? (
          <div className="py-20 text-center text-slate-400 animate-pulse font-bold uppercase tracking-widest text-[10px]">
            Retrieving Registry Records...
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice._id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-5 lg:p-10">
                {/* Priority Badges - Centered on mobile */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-5">
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                      notice.priority === "URGENT"
                        ? "bg-red-50 text-red-600"
                        : "bg-[#355E3B]/5 text-[#355E3B]"
                    }`}
                  >
                    {notice.priority}
                  </span>
                  {notice.priority === "URGENT" && (
                    <span className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase animate-pulse">
                      <AlertCircle size={12} /> Action Required
                    </span>
                  )}
                </div>

                <h3 className="text-[#355E3B] font-serif text-xl lg:text-3xl font-extrabold leading-tight mb-3 text-center lg:text-left">
                  {notice.title}
                </h3>

                <p className="text-slate-600 text-sm lg:text-[15px] leading-relaxed mb-6 text-center lg:text-left font-medium">
                  {notice.description}
                </p>

                {/* ACTION BAR - Symmetrical Vertical stack on mobile */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#C5A059]" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Eye size={14} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">
                        {(notice.stats?.views ?? 0)} Views
                      </span>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    {notice.attachments && notice.attachments.length > 0 ? (
                      <button
                        onClick={() => dispatch(downloadNotice(notice._id))}
                        className="w-full flex items-center justify-center gap-3 bg-[#355E3B] text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-[#2a4a2e] active:scale-[0.98] transition-all"
                      >
                        <Download size={18} />
                        Download PDF • {formatFileSize(notice.attachments[0]?.fileSize)}
                      </button>
                    ) : (
                      <div className="text-center lg:text-right w-full">
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">
                          No Attachments Available
                        </span>
                      </div>
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