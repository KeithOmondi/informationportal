import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Loader2, LogOut, MessageSquare, Menu } from "lucide-react"; 
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchUserGroups } from "../../store/slices/userChatSlice";
import JudgeMessagePage from "../../pages/judge/JudgeMessage"; 
import toast from "react-hot-toast";
import { logoutUser } from "../../store/slices/adminAuthSlice";

const DrHeader = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const dispatch = useAppDispatch();
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { groups } = useAppSelector((state) => state.userChat);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMsgPanelOpen, setIsMsgPanelOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUserGroups());
    const interval = setInterval(() => dispatch(fetchUserGroups()), 20000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const totalUnread = useMemo(() => 
    groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0), 
  [groups]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(false)).unwrap();
      toast.success("Session Terminated");
    } catch (e) {
      console.error("Logout failed, state cleared locally");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[100] w-full flex items-center justify-between px-4 lg:px-8 py-3 bg-white border-b border-slate-200 shadow-sm font-sans">
        <div className="flex items-center gap-3">
          {/* MOBILE MENU TOGGLE */}
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-[#1a3a32]"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>

          {/* BRANDING: JUDICIAL GREEN & GOLD ACCENT */}
          <div className="p-2 bg-[#1a3a32]/5 rounded-lg border-l-[3px] border-[#c2a336]">
            <h1 className="text-[#1a3a32] font-serif text-xs lg:text-sm font-black uppercase tracking-tighter">
              High Court Information Portal
            </h1>
            <p className="text-[#c2a336] text-[8px] font-black uppercase tracking-[0.2em] mt-0.5">Republic of Kenya</p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* MESSAGES TOGGLE */}
          <button 
            onClick={() => setIsMsgPanelOpen(true)} 
            className="p-2 rounded-xl hover:bg-[#1a3a32]/5 relative group transition-colors"
          >
            <MessageSquare className="text-[#1a3a32] w-5 h-5 transition-transform group-hover:scale-110" />
            {totalUnread > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {totalUnread}
              </span>
            )}
          </button>

          {/* PROFILE DROPDOWN: JUDICIAL GREEN THEME */}
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 bg-[#1a3a32] p-1 lg:pr-4 rounded-full cursor-pointer hover:shadow-lg hover:shadow-[#1a3a32]/20 transition-all border-b-2 border-[#c2a336]/30"
            >
              <div className="bg-white w-7 h-7 rounded-full flex items-center justify-center font-black text-[#1a3a32] text-[10px] shadow-inner">
                {user?.name?.slice(0, 2).toUpperCase() || "DR"}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-white text-[10px] font-black leading-none truncate max-w-[120px] uppercase tracking-wide">
                  {user?.name}
                </p>
                <p className="text-[#c2a336] text-[7px] font-black uppercase mt-1 tracking-widest opacity-90">
                  P.J. NO: {user?.pj || "REGISTRY"}
                </p>
              </div>
              <ChevronDown size={14} className="text-[#c2a336] ml-1" />
            </div>

            {/* DROPDOWN MENU */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 animate-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Official Designation</p>
                    <p className="text-[10px] font-bold text-[#1a3a32] mt-0.5 italic">{user?.role || "Deputy Registrar"}</p>
                </div>
                
                <button 
                    onClick={handleLogout} 
                    disabled={authLoading} 
                    className="w-full flex items-center gap-3 px-3 py-3 text-[10px] font-black text-red-600 hover:bg-red-50 rounded-xl transition-colors tracking-widest"
                >
                  {authLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <LogOut size={14} strokeWidth={3} />
                  )}
                  TERMINATE SESSION
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <JudgeMessagePage isOpen={isMsgPanelOpen} onClose={() => setIsMsgPanelOpen(false)} />
    </>
  );
};

export default DrHeader;