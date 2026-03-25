import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Bell, BellOff, ChevronDown, Loader2, 
  LogOut, User as UserIcon, MessageSquare, Menu,
  ShieldCheck, Scale
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { subscribeUserToPush } from "../../store/slices/pushSlice";
import { fetchUserGroups } from "../../store/slices/userChatSlice";
import JudgeMessagePage from "../../pages/judge/JudgeMessage";
import toast from "react-hot-toast";
import { fetchProfile } from "../../store/slices/adminUserSlice";
import { logoutUser } from "../../store/slices/adminAuthSlice";

interface JudgeHeaderProps {
  toggleSidebar: () => void;
}

const JudgeHeader = ({ toggleSidebar }: JudgeHeaderProps) => {
  const dispatch = useAppDispatch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // 1. Fetch Profile from userSlice (IUser)
  const { profile, loading: userLoading } = useAppSelector((state) => state.users);
  // 2. Auth loading state for the logout button
  const { loading: authLoading } = useAppSelector((state) => state.auth);
  
  const { permission, loading: pushLoading } = useAppSelector((state) => state.push);
  const { groups } = useAppSelector((state) => state.userChat);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMsgPanelOpen, setIsMsgPanelOpen] = useState(false);

  // Sync Profile and Groups on Mount
  useEffect(() => {
    if (!profile) {
      dispatch(fetchProfile());
    }
    dispatch(fetchUserGroups());
    
    const interval = setInterval(() => {
      dispatch(fetchUserGroups());
    }, 15000); 
    return () => clearInterval(interval);
  }, [dispatch, profile]);

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

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Session Terminated", {
        style: { background: '#355E3B', color: '#fff', fontSize: '10px', fontWeight: 'bold' }
      });
    } catch (error) {
      console.error("Local session cleared despite server error.");
    }
  };

  const getInitials = (name: string = "User") => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-[100] w-full flex items-center justify-between px-4 lg:px-8 py-2.5 lg:py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all isolate">
        
        {/* --- JUDICIAL INSIGNIA --- */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-[#355E3B]">
            <Scale size={20} strokeWidth={2.5} />
          </div>
          <div className="p-1 sm:p-2 bg-white rounded-lg border-l-[3px] border-[#355E3B] flex flex-col justify-center min-w-0">
            <h1 className="text-[#355E3B] font-serif text-[11px] sm:text-xs lg:text-sm font-black leading-none uppercase tracking-tighter truncate">
              High Court Information Portal
            </h1>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
              <div className="h-[1px] w-2 lg:w-3 bg-[#C5A059]" />
              <p className="text-[#C5A059] text-[7px] sm:text-[8px] lg:text-[9px] font-black uppercase tracking-[0.15em] leading-none whitespace-nowrap">
                Republic of Kenya
              </p>
            </div>
          </div>
        </div>

        {/* --- ACTIONS & IDENTITY --- */}
        <div className="flex items-center gap-1.5 lg:gap-4">
          
          {/* Briefings Button */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsMsgPanelOpen(true);
                setIsNotifOpen(false);
                setIsProfileOpen(false);
              }} 
              className="p-2 lg:p-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group relative"
            >
              <MessageSquare className="text-[#355E3B] w-4 h-4 lg:w-5 lg:h-5 transition-transform group-hover:scale-110" />
              {totalUnreadBriefings > 0 && (
                <span className="absolute top-1 right-1 lg:top-0 lg:right-0 min-w-[14px] lg:min-w-[16px] h-[14px] lg:h-[16px] px-1 bg-red-600 text-white text-[7px] lg:text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-md animate-pulse">
                  {totalUnreadBriefings > 99 ? "99" : totalUnreadBriefings}
                </span>
              )}
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={handleBellClick} className="relative cursor-pointer group">
              <div className={`p-2 lg:p-2.5 rounded-full border transition-all ${
                permission === "granted" 
                  ? "bg-slate-50 border-slate-100 hover:bg-white hover:border-[#355E3B]/20" 
                  : "bg-amber-50 border-amber-100 hover:bg-amber-100"
              }`}>
                {pushLoading ? (
                  <Loader2 className="text-[#355E3B] w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                ) : (
                  permission === "granted" ? (
                    <Bell className="text-[#355E3B] w-4 h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <BellOff className="text-amber-600 w-4 h-4 lg:w-5 lg:h-5" />
                  )
                )}
              </div>
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right border-t-4 border-t-[#355E3B]">
                <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                  <span className="text-[#355E3B] text-[9px] font-black uppercase tracking-widest">Alerts</span>
                  <span className="text-[8px] font-bold text-slate-400">0 Total</span>
                </div>
                <div className="py-10 px-4 text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="text-slate-200" size={18} />
                  </div>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-relaxed">System protocols are secure.<br/>No pending alerts.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Judicial Identity (Using UserSlice Profile) */}
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
              className="flex items-center gap-2 bg-[#355E3B] p-0.5 lg:pr-4 rounded-full border border-[#355E3B] hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="bg-white w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center font-black text-[#355E3B] text-[10px] lg:text-xs shrink-0 shadow-inner">
                {userLoading ? (
                   <Loader2 size={12} className="animate-spin" />
                ) : (
                   getInitials(profile?.name)
                )}
              </div>
              
              <div className="hidden md:block text-left pr-1">
                <p className="text-white text-[10px] lg:text-[11px] font-serif font-bold leading-none truncate max-w-[120px]">
                   {profile?.name ? `Justice ${profile.name.split(" ")[0]}` : "Chamber Officer"}
                </p>
                <p className="text-[#C5A059] text-[7px] font-black uppercase tracking-tighter mt-0.5">
                  {profile?.pj || "Verified Chamber"}
                </p>
              </div>
              <ChevronDown size={14} className={`text-white/70 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 animate-in slide-in-from-top-2 duration-200 origin-top-right">
                <div className="px-3 py-2 mb-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Digital Signature</p>
                  <p className="text-[10px] font-bold text-[#355E3B] truncate">{profile?.email || "loading credentials..."}</p>
                </div>
                
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <UserIcon size={14} className="text-[#C5A059]" /> Verified Profile
                </button>
                
                <div className="h-px bg-slate-100 my-1.5" />
                
                <button 
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-black text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                >
                  {authLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  )}
                  END SESSION
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Floating Toggle */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-6 right-6 z-[150] w-14 h-14 bg-[#355E3B] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-4 border-white/20"
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </button>

      <JudgeMessagePage isOpen={isMsgPanelOpen} onClose={() => setIsMsgPanelOpen(false)} />
    </>
  );
};

export default JudgeHeader;