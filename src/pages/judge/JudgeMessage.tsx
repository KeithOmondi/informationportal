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
  Lock,
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
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const groupsRef = useRef(groups);
  useEffect(() => { groupsRef.current = groups; }, [groups]);

  const handleClose = () => {
    setActiveChatId(null);
    onClose ? onClose() : navigate(-1);
  };

  /* ================= DATA FETCHING & POLLING ================= */
  useEffect(() => {
    if (!isOpen) return;

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
    // If your slice uses 'channelId', keep it, but ensure the Interface matches.
    // If the error persists, check if the slice wants { id: string } or { groupId: string }
    dispatch(markThreadAsRead({ 
      channelId: activeChatId, 
      type: currentGroup.type as "broadcast" | "private" 
    } as any)); // Temporary cast if you're in a hurry to test the UI
  }
}, [activeChatId, dispatch, groups, isOpen]);

  /* ================= MEMOIZED UI DATA ================= */
  const counts = useMemo(() => ({
    broadcast: groups.filter(g => g.type === "broadcast").reduce((acc, g) => acc + (g.unreadCount ?? 0), 0),
    private: groups.filter(g => g.type === "private").reduce((acc, g) => acc + (g.unreadCount ?? 0), 0)
  }), [groups]);

  const filteredGroups = useMemo(() => 
    groups.filter(g => 
        g.type === activeTab && 
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), 
  [groups, activeTab, searchQuery]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chatMessages]);

  return (
    <div className="font-sans">
      {/* OVERLAY BACKDROP */}
      <div 
        className={`fixed inset-0 bg-[#1a3a32]/40 backdrop-blur-[4px] z-[150] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={handleClose}
      />

      {/* SIDE PANEL CONTAINER */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-[160] shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col border-l border-[#c2a336]/20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* VIEW 1: MASTER LIST */}
        <div className={`flex flex-col h-full transition-all duration-300 ${activeChatId ? 'hidden' : 'flex'}`}>
          <header className="px-6 py-8 bg-[#1a3a32] text-white flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Scale size={120} />
            </div>
            <div className="flex items-center gap-4 z-10">
              <div className="p-2 bg-[#c2a336] rounded-lg">
                <Scale size={20} className="text-[#1a3a32]" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold tracking-tight uppercase">Judicial Briefings</h1>
                <p className="text-[10px] font-black text-[#c2a336] tracking-[0.2em] uppercase">Principal Registry</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors z-10">
              <X size={24} />
            </button>
          </header>

          <div className="p-5 bg-white border-b border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 py-3 transition-all focus-within:border-[#1a3a32] focus-within:bg-white">
              <Search size={16} className="text-slate-400 mr-3" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search judicial records..." 
                className="bg-transparent text-xs w-full outline-none font-bold text-slate-700 placeholder:text-slate-400 uppercase tracking-wider" 
              />
            </div>
          </div>

          <div className="flex bg-white shrink-0 border-b border-slate-100 px-2">
            {["broadcast", "private"].map((tab) => (
              <button 
                key={tab}
                onClick={() => { 
                  setActiveTab(tab as any); 
                  setActiveChatId(null); 
                  dispatch(resetChatMessages()); 
                }}
                className={`flex-1 font-serif py-5 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab 
                  ? "text-[#1a3a32]" 
                  : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "broadcast" ? "Official Gazette" : "Registry Core"}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#c2a336]" />}
                {(counts[tab as keyof typeof counts] ?? 0) > 0 && (
                  <span className="bg-[#c2a336] text-[#1a3a32] px-1.5 py-0.5 rounded-md text-[9px] font-black shadow-sm">
                    {counts[tab as keyof typeof counts]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
            {filteredGroups.length > 0 ? filteredGroups.map(group => (
              <div
                key={group._id}
                onClick={() => {
                  setActiveChatId(group._id);
                  dispatch(fetchUserMessages(
                    group.type === "broadcast" ? { isBroadcast: true } : { receiver: userId }
                  ));
                }}
                className="flex items-center gap-4 px-6 py-6 cursor-pointer bg-white hover:bg-[#fcfcfc] border-b border-slate-100 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-[#1a3a32] shrink-0 border border-slate-200 shadow-sm group-hover:border-[#c2a336]/40 transition-colors">
                    {group.type === 'broadcast' ? <Megaphone size={20} className="text-[#c2a336]" /> : <UserCircle size={28} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{group.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <Lock size={8} className="text-[#c2a336]" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SECURE</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-slate-500 font-medium truncate italic font-serif">
                    {group.description || "Official Judicial Correspondence"}
                  </p>
                </div>
                {(group.unreadCount ?? 0) > 0 && (
                  <div className="bg-[#1a3a32] text-[#c2a336] text-[10px] w-6 h-6 flex items-center justify-center rounded-lg font-black shadow-lg border border-[#c2a336]/30">
                    {group.unreadCount}
                  </div>
                )}
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                <ShieldCheck size={40} className="mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Registry Vault Empty</p>
              </div>
            )}
          </div>
        </div>

        {/* VIEW 2: ACTIVE CONVERSATION */}
        <div className={`flex flex-col h-full bg-[#fdfdfd] relative ${activeChatId ? 'flex' : 'hidden'}`}>
          <header className="px-5 py-5 bg-white flex items-center gap-4 z-10 border-b border-slate-100 shadow-sm shrink-0">
            <button 
              onClick={() => {
                setActiveChatId(null);
                dispatch(resetChatMessages());
              }} 
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#1a3a32] transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-10 h-10 rounded-lg bg-[#1a3a32] text-[#c2a336] flex items-center justify-center shadow-lg">
              <ShieldCheck size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#1a3a32] truncate uppercase tracking-tight leading-none mb-1">
                {groups.find(g => g._id === activeChatId)?.name || "Judicial Thread"}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.1em]">Authenticated Registry Channel</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar bg-slate-50/20">
            {chatMessages.length > 0 ? chatMessages.map((msg) => {
              const isOutgoing = (typeof msg.sender === "string" ? msg.sender : msg.sender?._id) === userId;
              const isRead = msg.readBy && msg.readBy.length > 0;

              return (
                <div key={msg._id} className={`flex ${isOutgoing ? "justify-end" : "justify-start animate-in slide-in-from-bottom-1"}`}>
                  <div className={`relative max-w-[85%] px-5 py-3 rounded-2xl shadow-sm text-[13px] font-medium leading-relaxed border ${
                    isOutgoing 
                    ? "bg-[#1a3a32] text-white rounded-tr-none border-[#122923]" 
                    : "bg-white text-slate-800 rounded-tl-none border-slate-100"
                  }`}>
                    {activeTab === 'broadcast' && !isOutgoing && (
                        <p className="text-[8px] font-black text-[#c2a336] uppercase tracking-[0.2em] mb-1">Official Notice</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-white/10">
                      <span className={`text-[9px] font-bold uppercase ${isOutgoing ? "text-[#c2a336]/60" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOutgoing && (
                        <CheckCheck size={14} className={isRead ? "text-[#c2a336]" : "text-white/20"} />
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <Lock size={32} className="text-slate-200 mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                        End-to-End Encryption Sealed
                    </p>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="p-6 bg-white border-t border-slate-100 flex flex-col items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1a3a32]/5 rounded-full border border-[#1a3a32]/10">
                <Lock size={12} className="text-[#1a3a32]" />
                <span className="text-[10px] font-black text-[#1a3a32] uppercase tracking-tighter">
                  All messages relayed are end-to-end encrypted
                </span>
             </div>
             <p className="text-[9px] text-slate-400 italic text-center font-serif px-10 leading-relaxed">
                Kindly contact the ORHC for any assistance
             </p>
          </footer>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c2a336; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default JudgeMessagePage;