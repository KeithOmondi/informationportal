import { useEffect, useMemo, useState, useRef, type JSX } from "react";
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

/**
 * Interface for fetch parameters to avoid 'any'
 */
interface FetchNoticesParams {
  priority?: NoticePriority;
  search?: string;
}

const JudgeNoticesPage = () => {
  const dispatch = useAppDispatch();
  const { notices, loading } = useAppSelector((state) => state.notices);

  type Tab = "ALL" | "NEW" | "PAST" | "URGENT";
  const [filter, setFilter] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");
  const [now] = useState(() => Date.now());

  const categories: Tab[] = ["ALL", "NEW", "PAST", "URGENT"];
  const NEW_DAYS = 7;

  // A notice is "new" for a week after it is published, as long as it has not expired. After that it is "past".
  const isNew = (n: { publishDate?: string; createdAt: string; expiryDate?: string }): boolean => {
    const published = new Date(n.publishDate ?? n.createdAt).getTime();
    const expired = n.expiryDate ? new Date(n.expiryDate).getTime() < now : false;
    return !expired && now - published <= NEW_DAYS * 24 * 60 * 60 * 1000;
  };

  const counts = useMemo(() => {
    const fresh = notices.filter(isNew).length;
    return { ALL: notices.length, NEW: fresh, PAST: notices.length - fresh, URGENT: notices.filter((n) => n.priority === "URGENT").length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices, now]);

  const visible = useMemo(() => {
    if (filter === "NEW") return notices.filter(isNew);
    if (filter === "PAST") return notices.filter((n) => !isNew(n));
    if (filter === "URGENT") return notices.filter((n) => n.priority === "URGENT");
    return notices;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices, filter, now]);

  /**
   * FIX: PERSIST DEBOUNCED FUNCTION
   * We use a ref to store the debounced function so it isn't recreated
   * on every render, while keeping the callback simple for React's analyzer.
   */
  const debouncedFetchRef = useRef(
    debounce((currentSearch: string) => {
      const params: FetchNoticesParams = {};
      if (currentSearch) params.search = currentSearch;
      dispatch(fetchNotices(params));
    }, 500)
  );

  // Clean up debounce on unmount
  useEffect(() => {
    const debouncedFn = debouncedFetchRef.current;
    return () => {
      debouncedFn.cancel();
    };
  }, []);

  // Trigger fetch when dependencies change
  useEffect(() => {
    debouncedFetchRef.current(search);
  }, [search]);

  const formatFileSize = (size?: number): string => {
    if (!size) return "0.00 MB";
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * DESCRIPTION RENDERING LOGIC
   */
  const renderFormattedDescription = (text: string): JSX.Element[] => {
    return text.split("\n").map((line, i) => {
      const trimmedLine = line.trim();

      if (
        trimmedLine.startsWith("-") ||
        trimmedLine.startsWith("*") ||
        trimmedLine.startsWith("•")
      ) {
        return (
          <li key={i} className="ml-5 list-disc text-slate-600 mb-1 pl-2">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }

      if (trimmedLine === "") {
        return <div key={i} className="h-4" />;
      }

      return (
        <p key={i} className="mb-3 text-slate-600 leading-relaxed font-medium">
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
          <h1 className="text-[#355E3B] font-serif text-3xl md:text-4xl font-black mb-2 tracking-tight">
            Judicial Notice Board
          </h1>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-[#C5A059]" />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              Official Registry Verified Communications
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
                  ? "bg-white text-[#355E3B] shadow-sm scale-[1.02]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {cat === "ALL" ? "All" : cat === "NEW" ? "New" : cat === "PAST" ? "Past" : "Urgent"}
              {cat !== "ALL" && counts[cat] > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] ${
                    cat === "NEW" ? "bg-[#C5A059] text-[#14301f]" : cat === "URGENT" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {counts[cat]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents, circulars or registry records..."
            className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-[#355E3B]/5 focus:border-[#355E3B] transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* LISTING */}
      <div className="space-y-8">
        {loading && visible.length === 0 && notices.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <LoaderIcon />
          </div>
        ) : visible.length === 0 ? (
          <div className="py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
            <Inbox className="text-slate-200 mb-4" size={64} />
            <h3 className="text-slate-500 font-black uppercase tracking-widest text-xs">
              {filter === "NEW" ? "Nothing new this week" : filter === "PAST" ? "No past notices" : "No Records Found"}
            </h3>
          </div>
        ) : (
          visible.map((notice) => (
            <div
              key={notice._id}
              className="group bg-white border border-slate-200 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-[#355E3B]/5 transition-all duration-500"
            >
              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest border ${
                        notice.priority === "URGENT"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-[#355E3B]/5 text-[#355E3B] border-[#355E3B]/10"
                      }`}
                    >
                      {notice.priority}
                    </span>
                    {isNew(notice) && (
                      <span className="rounded-full bg-[#C5A059] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#14301f]">New</span>
                    )}
                    {notice.priority === "URGENT" && (
                      <span className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase animate-pulse">
                        <AlertCircle size={14} /> Critical Action Required
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    Ref: {notice.targetAudience}
                  </span>
                </div>

                <h3 className="text-[#355E3B] font-serif text-2xl lg:text-2xl font-black leading-tight mb-8">
                  {notice.title}
                </h3>

                <div className="description-container mb-10 max-w-5xl">
                  {renderFormattedDescription(notice.description)}
                </div>

                {/* FOOTER ACTION AREA */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-10 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-[#C5A059]">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          Date Published
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 uppercase">
                          {new Date(notice.createdAt).toLocaleDateString(
                            "en-KE",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-[#C5A059]">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          Published By
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 uppercase">
                          {notice.createdBy?.name || "Registry System"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    {notice.attachments && notice.attachments.length > 0 ? (
                      <button
                        onClick={() => dispatch(downloadNotice(notice._id))}
                        className="w-full group flex items-center justify-center gap-4 bg-[#355E3B] text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#355E3B]/20 hover:bg-[#2a4a2e] transition-all"
                      >
                        <Download
                          size={18}
                          strokeWidth={3}
                          className="group-hover:translate-y-0.5 transition-transform"
                        />
                        View File •{" "}
                        {formatFileSize(notice.attachments[0]?.fileSize)}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100">
                        <AlertCircle size={14} className="text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase italic">
                          Scan Pending
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

const LoaderIcon = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-10 h-10 border-[3px] border-[#355E3B]/10 border-t-[#355E3B] rounded-full animate-spin" />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
      Registry Synchronizing...
    </p>
  </div>
);

export default JudgeNoticesPage;