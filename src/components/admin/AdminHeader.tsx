import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // 👈 added useNavigate
import {
  User, Bell, BellOff, Search, Calendar, ChevronRight, Loader2, LogOut, Settings
} from "lucide-react";
import toast from "react-hot-toast"; // 👈 added
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { subscribeUserToPush } from "../../store/slices/pushSlice";
import { logoutUser } from "../../store/slices/adminAuthSlice";
import { clearUnreadCount } from "../../store/slices/adminMessageSlice";

const AdminHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate(); // 👈 added
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user } = useAppSelector((state) => state.auth);
  const { permission, loading: pushLoading } = useAppSelector((state) => state.push);
  const { unreadCount } = useAppSelector((state) => state.adminChat);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBellClick = () => {
    if (permission !== "granted") {
      dispatch(subscribeUserToPush());
    } else {
      setIsNotifOpen(!isNotifOpen);
      if (!isNotifOpen) dispatch(clearUnreadCount());
    }
  };

  // 👇 updated logout handler
  const handleLogout = async () => {
    setIsProfileOpen(false)
    const toastId = toast.loading("Signing out...")
    try {
      await dispatch(logoutUser()).unwrap()
      toast.success("Signed out successfully", { id: toastId })
      navigate("/login", { replace: true }) // 👈 redirect after logout
    } catch {
      toast.error("Logout failed", { id: toastId })
    }
  }

  const getPageTitle = () => {
    const path = location.pathname.split("/").pop();
    if (!path || path === "dashboard") return "Overview";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-[50] sticky top-0">
      {/* Title Section */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1 md:gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="text-lg md:text-xl font-serif hidden xs:inline shrink-0">ORHC</span>
          <ChevronRight size={10} className="hidden xs:inline shrink-0" />
          <span className="text-[#355E3B] text-lg md:text-xl font-serif font-bold truncate">
            {getPageTitle()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
          <Calendar size={14} className="text-[#355E3B]" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{today}</span>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-0.5 md:gap-2 border-r border-slate-200 pr-2 md:pr-6">
          <button className="p-2 text-slate-400 hover:text-[#355E3B] hover:bg-emerald-50 rounded-full transition-colors">
            <Search size={18} className="md:w-5 md:h-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className={`p-2 rounded-full transition-all relative ${
                permission === "granted" ? "text-slate-400 hover:text-[#355E3B] hover:bg-emerald-50" : "text-red-300 hover:bg-red-50"
              }`}
            >
              {pushLoading ? (
                <Loader2 size={18} className="animate-spin md:w-5 md:h-5" />
              ) : permission === "granted" ? (
                <Bell size={18} className="md:w-5 md:h-5" />
              ) : (
                <BellOff size={18} className="md:w-5 md:h-5" />
              )}

              {unreadCount > 0 && permission === "granted" && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EFBF04] rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-[-60px] md:right-0 mt-4 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Alerts</span>
                  <span className="bg-[#355E3B] text-white text-[9px] px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto p-4 text-center">
                  {unreadCount > 0 ? (
                    <p className="text-[11px] text-slate-600 font-medium">
                      You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clear for now</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="relative" ref={profileRef}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 md:gap-3 pl-1 cursor-pointer group">
            <div className="text-right hidden sm:block max-w-[150px] md:max-w-[200px]">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wide group-hover:text-[#355E3B] transition-colors truncate">
                {user?.name || "Administrator"}
              </p>
              <p className="text-[9px] font-bold text-[#355E3B] uppercase tracking-tighter opacity-70">
                {user?.role || "Authorized"}
              </p>
            </div>
            <div className="h-9 w-9 md:h-10 md:w-10 bg-[#355E3B] rounded-xl flex items-center justify-center border-2 border-[#EFBF04] shadow-sm transition-transform group-active:scale-95 shrink-0">
              <User size={18} className="text-white" />
            </div>
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-4 w-52 md:w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</p>
                <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors mt-1">
                <Settings size={14} /> Settings
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={handleLogout} // 👈 updated
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;