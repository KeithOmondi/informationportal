import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Bell, BellOff, ChevronDown, Loader2, 
  LogOut, User as UserIcon, MessageSquare, Menu 
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { subscribeUserToPush } from "../../store/slices/pushSlice";
import { logoutUser } from "../../store/slices/adminAuthSlice";
import { fetchUserGroups } from "../../store/slices/userChatSlice";
import JudgeMessagePage from "../../pages/judge/JudgeMessage";

interface JudgeHeaderProps {
  toggleSidebar: () => void;
}

const JudgeHeader = ({ toggleSidebar }: JudgeHeaderProps) => {
  const dispatch = useAppDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAppSelector((state) => state.auth);
  const { permission, loading: pushLoading } = useAppSelector((state) => state.push);
  const { groups } = useAppSelector((state) => state.userChat);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMsgPanelOpen, setIsMsgPanelOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUserGroups());
    const interval = setInterval(() => {
      dispatch(fetchUserGroups());
    }, 10000); 
    return () => clearInterval(interval);
  }, [dispatch]);

  const totalUnreadBriefings = useMemo(() => {
    return groups.reduce((acc, group) => acc + (group.unreadCount || 0), 0);
  }, [groups]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    if (permission !== "granted") {
      dispatch(subscribeUserToPush());
    } else {
      setIsNotifOpen(!isNotifOpen);
      setIsProfileOpen(false); 
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const getInitials = (name: string = "Anonymous") => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] w-full flex items-center justify-between px-4 lg:px-8 py-2.5 lg:py-4 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all isolate">
        
        {/* --- LOGO SECTION --- */}
        <div className="flex items-center">
          <div className="p-1 sm:p-2 lg:p-3 bg-white rounded-lg lg:rounded-xl border-l-[3px] lg:border-l-4 border-[#355E3B] flex flex-col justify-center min-w-0">
            <h1 className="text-[#355E3B] font-serif text-[10px] sm:text-xs lg:text-base font-black leading-none uppercase tracking-tighter truncate">
              information portal
            </h1>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
              <div className="hidden xs:block h-[1px] w-2 lg:w-3 bg-[#C5A059]" />
              <p className="text-[#C5A059] text-[7px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] leading-none whitespace-nowrap">
                High Court of Kenya
              </p>
            </div>
          </div>
        </div>

        {/* --- ACTIONS & AUTH SECTION --- */}
        <div className="flex items-center gap-1 lg:gap-6">
          
          {/* Messages */}
          <div className="relative">
            <div 
              onClick={() => {
                setIsMsgPanelOpen(true);
                setIsNotifOpen(false);
                setIsProfileOpen(false);
              }} 
              className="p-2 lg:p-2.5 rounded-full hover:bg-[#355E3B]/5 transition-all cursor-pointer group relative"
            >
              <MessageSquare className="text-[#355E3B] w-5 h-5 transition-transform group-hover:scale-110" />
              {totalUnreadBriefings > 0 && (
                <span className="absolute top-1 right-1 lg:-top-1 lg:-right-1 min-w-[14px] lg:min-w-[18px] h-[14px] lg:h-[18px] px-1 bg-[#C5A059] text-white text-[8px] lg:text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  {totalUnreadBriefings > 99 ? "99+" : totalUnreadBriefings}
                </span>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <div onClick={handleBellClick} className="relative cursor-pointer group">
              <div className={`p-2 lg:p-2.5 rounded-full transition-all ${
                permission === "granted" ? "hover:bg-[#355E3B]/5" : "bg-red-50 hover:bg-red-100"
              }`}>
                {pushLoading ? (
                  <Loader2 className="text-[#355E3B] w-5 h-5 animate-spin" />
                ) : (
                  permission === "granted" ? (
                    <Bell className="text-[#355E3B] w-5 h-5" />
                  ) : (
                    <BellOff className="text-red-400 w-5 h-5" />
                  )
                )}
              </div>
            </div>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-64 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="bg-[#355E3B] px-4 py-3">
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">System Alerts</span>
                </div>
                <div className="py-8 px-4 text-center">
                  <Bell className="mx-auto text-slate-200 mb-2" size={20} />
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">No active system alerts</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
              className="flex items-center gap-1 sm:gap-2 bg-slate-50 p-1 lg:pr-4 rounded-full border border-slate-200 hover:border-[#355E3B]/30 transition-all cursor-pointer shadow-sm"
            >
              <div className="bg-[#355E3B] w-7 h-7 lg:w-9 lg:h-9 rounded-full flex items-center justify-center font-black text-[#C5A059] text-[10px] lg:text-sm border-2 border-white shrink-0">
                {getInitials(user?.name)}
              </div>
              
              <div className="hidden md:block text-left">
                <p className="text-[#355E3B] text-[11px] lg:text-sm font-bold leading-none truncate max-w-[100px]">
                   Justice {user?.name?.split(" ")[0] || "..."}
                </p>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 animate-in slide-in-from-top-2 duration-200 origin-top-right">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <UserIcon size={14} /> My Profile
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- MOBILE FLOATING HAMBURGER (Bottom Right) --- */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-6 right-6 z-[150] w-14 h-14 bg-[#355E3B] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in duration-500 border-4 border-white/20"
        aria-label="Toggle Menu"
      >
        <Menu size={28} />
      </button>

      <JudgeMessagePage isOpen={isMsgPanelOpen} onClose={() => setIsMsgPanelOpen(false)} />
    </>
  );
};

export default JudgeHeader;