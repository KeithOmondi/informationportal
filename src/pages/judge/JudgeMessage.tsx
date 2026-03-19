import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserGroups,
  fetchUserMessages,
  resetChatMessages,
  markThreadAsRead,
} from "../../store/slices/userChatSlice";
import {
  ShieldCheck,
  UserCircle,
  Scale,
  Megaphone,
  X,
  CheckCheck,
  Search,
  ChevronLeft,
} from "lucide-react";

interface JudgeMessageProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const JudgeMessagePage = ({ isOpen = true, onClose }: JudgeMessageProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Selectors
  const userId = useAppSelector((state) => state.auth.user?._id);
  const { chatMessages, groups } = useAppSelector((state) => state.userChat);

  // Local State
  const [activeTab, setActiveTab] = useState<"broadcast" | "private">("broadcast");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to track groups for the interval without triggering re-runs
  const groupsRef = useRef(groups);
  useEffect(() => { groupsRef.current = groups; }, [groups]);

  /* --- Navigation & Closing --- */
  const handleClose = () => {
    setActiveChatId(null);
    onClose ? onClose() : navigate(-1);
  };

  /* ================= DATA FETCHING & POLLING ================= */
  useEffect(() => {
    if (!isOpen) return;

    // Initial load
    dispatch(fetchUserGroups());

    const interval = setInterval(() => {
      dispatch(fetchUserGroups());
      
      if (activeChatId) {
        const currentGroup = groupsRef.current.find(g => g._id === activeChatId);
        if (currentGroup) {
          dispatch(fetchUserMessages(
            currentGroup.type === "broadcast" ? { isBroadcast: true } : { receiver: userId }
          ));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch, isOpen, activeChatId, userId]); 

  /* ================= MARK AS READ LOGIC ================= */
  useEffect(() => {
    if (!activeChatId || !isOpen) return;
    
    const currentGroup = groups.find(g => g._id === activeChatId);
    if (currentGroup && (currentGroup.unreadCount ?? 0) > 0) {
      dispatch(markThreadAsRead({ 
        channelId: activeChatId, 
        type: currentGroup.type as "broadcast" | "private" 
      }));
    }
  }, [activeChatId, dispatch, groups, isOpen]);

  /* ================= MEMOIZED UI DATA ================= */
  const counts = useMemo(() => ({
    broadcast: groups.filter(g => g.type === "broadcast").reduce((acc, g) => acc + (g.unreadCount ?? 0), 0),
    private: groups.filter(g => g.type === "private").reduce((acc, g) => acc + (g.unreadCount ?? 0), 0)
  }), [groups]);

  const filteredGroups = useMemo(() => 
    groups.filter(g => g.type === activeTab), 
  [groups, activeTab]);

  // Auto-scroll to bottom on new messages
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chatMessages]);

  return (
    <div className="font-['Nunito',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      
      {/* OVERLAY BACKDROP */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={handleClose}
      />

      {/* SIDE PANEL CONTAINER */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[160] shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* VIEW 1: MASTER LIST (THREADS) */}
        <div className={`flex flex-col h-full transition-all duration-300 ${activeChatId ? 'hidden' : 'flex'}`}>
          <header className="px-5 py-6 bg-[#355E3B] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Scale size={22} className="text-[#C5A059]" />
              <h1 className="text-xl font-extrabold tracking-tight uppercase font-serif">Judicial Briefings</h1>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={26} />
            </button>
          </header>

          {/* Search Bar */}
          <div className="p-4 bg-white border-b border-slate-100">
            <div className="bg-[#f0f2f5] rounded-xl flex items-center px-4 py-2.5">
              <Search size={18} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search correspondence..." 
                className="bg-transparent text-sm w-full outline-none font-semibold text-slate-700" 
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white shrink-0 border-b border-slate-100">
            {["broadcast", "private"].map((tab) => (
              <button 
                key={tab}
                onClick={() => { 
                  setActiveTab(tab as any); 
                  setActiveChatId(null); 
                  dispatch(resetChatMessages()); 
                }}
                className={`flex-1 font-serif py-4 text-[11px] font-extrabold uppercase tracking-[0.15em] relative transition-all ${
                  activeTab === tab 
                  ? "text-[#355E3B] border-b-4 border-[#355E3B]" 
                  : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "broadcast" ? "ORHC Broadcast" : "ORHC Team"}
                {(counts[tab as keyof typeof counts] ?? 0) > 0 && (
                  <span className="ml-2 bg-[#C5A059] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                    {counts[tab as keyof typeof counts]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
            {filteredGroups.length > 0 ? filteredGroups.map(group => (
              <div
                key={group._id}
                onClick={() => {
                  setActiveChatId(group._id);
                  dispatch(fetchUserMessages(
                    group.type === "broadcast" ? { isBroadcast: true } : { receiver: userId }
                  ));
                }}
                className="flex items-center gap-4 px-5 py-5 cursor-pointer bg-white hover:bg-slate-50 border-b border-slate-100 transition-all active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-[#355E3B] shrink-0 border-2 border-slate-200 shadow-sm">
                    {group.type === 'broadcast' ? <Megaphone size={24} /> : <UserCircle size={32} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="text-[15px] font-bold text-slate-900 truncate">{group.name}</h3>
                    <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-wider">ORHC</span>
                  </div>
                  <p className="text-[13px] text-slate-500 font-medium truncate">
                    {group.description || "Secure Judicial Channel"}
                  </p>
                </div>
                {(group.unreadCount ?? 0) > 0 && (
                  <div className="bg-[#25D366] text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-black shadow-md animate-bounce">
                    {group.unreadCount}
                  </div>
                )}
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60 p-10 text-center">
                <ShieldCheck size={48} className="mb-4 text-slate-200" />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">No verified threads found</p>
              </div>
            )}
          </div>
        </div>

        {/* VIEW 2: ACTIVE CONVERSATION VIEW */}
        <div className={`flex flex-col h-full bg-[#efe7dd] relative ${activeChatId ? 'flex' : 'hidden'}`}>
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]" />

          {/* Chat Header */}
          <header className="px-4 py-4 bg-[#f0f2f5] flex items-center gap-3 z-10 border-b shadow-sm shrink-0">
            <button 
              onClick={() => {
                setActiveChatId(null);
                dispatch(resetChatMessages());
              }} 
              className="p-1 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <div className="w-11 h-11 rounded-full bg-[#355E3B] text-white flex items-center justify-center shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                {groups.find(g => g._id === activeChatId)?.name || "Judicial Thread"}
              </h2>
              <p className="text-[11px] text-emerald-600 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified {activeTab === "broadcast" ? "ORHC Broadcast" : "ORHC Team"}
              </p>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 z-10 custom-scrollbar">
            {chatMessages.length > 0 ? chatMessages.map((msg) => {
              const isOutgoing = (typeof msg.sender === "string" ? msg.sender : msg.sender?._id) === userId;
              const isRead = msg.readBy && msg.readBy.length > 0;

              return (
                <div key={msg._id} className={`flex ${isOutgoing ? "justify-end" : "justify-start animate-in fade-in slide-in-from-bottom-2"}`}>
                  <div className={`relative max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-[14px] font-medium leading-relaxed ${
                    isOutgoing 
                    ? "bg-[#d9fdd3] text-slate-800 rounded-tr-none" 
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOutgoing && (
                        <CheckCheck size={16} className={isRead ? "text-blue-500" : "text-slate-300"} />
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/50 px-4 py-2 rounded-full">
                        Secure end-to-end encryption active
                    </p>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer */}
          <div className="p-4 bg-white/90 backdrop-blur-md z-10 flex items-center justify-center border-t border-slate-200/50">
            <div className="flex items-center gap-2.5 px-5 py-2 bg-[#355E3B]/5 rounded-full border border-[#355E3B]/10">
              <ShieldCheck size={16} className="text-[#355E3B]" />
              <span className="text-[11px] font-black text-[#355E3B] font-serif uppercase tracking-tighter">
                ORHC MESSAGING CHANNEL
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(53, 94, 59, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default JudgeMessagePage;