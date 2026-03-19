import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Send,
  Search,
  Scale,
  Plus,
  X,
  Megaphone,
  Check,
  ChevronLeft,
  Menu,
} from "lucide-react";
import toast from "react-hot-toast";

import type { AppDispatch, RootState } from "../../store/store";
import {
  type Message,
  sendMessage,
  fetchChatMessages,
  receiveMessage,
  resetChatMessages,
} from "../../store/slices/adminMessageSlice";
import {
  fetchUsers,
  addToActiveConversations,
  fetchActiveConversations,
  type IUser,
} from "../../store/slices/adminUserSlice";
import { getSocket } from "../../services/socket";

type BroadcastEntry = { _id: string; name: string; isBroadcast: true };
type SidebarItem = IUser | BroadcastEntry;

const AdminMessages: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- UI STATE ---
  const [selectedChat, setSelectedChat] = useState<{
    id: string;
    name: string;
    isBroadcast?: boolean;
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<number | "all">("all");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // --- MODAL & BROADCAST STATE ---
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [modalCohortFilter, setModalCohortFilter] = useState<number | "all">("all");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isGlobalBroadcast, setIsGlobalBroadcast] = useState(false);

  // --- REDUX DATA ---
  const { chatMessages } = useSelector((state: RootState) => state.adminChat);
  const { user: admin } = useSelector((state: RootState) => state.auth);
  const { users: allUsers, activeConversationIds } = useSelector(
    (state: RootState) => state.users,
  );

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchActiveConversations());
  }, [dispatch]);

  const availableCohorts = useMemo(() => {
    const cohorts = allUsers
      .map((u) => u.cohort)
      .filter((c): c is number => c !== undefined);
    return Array.from(new Set(cohorts)).sort((a, b) => b - a);
  }, [allUsers]);

  // --- SIDEBAR FILTERING ---
  const activeChatPersonnel = useMemo<SidebarItem[]>(() => {
    const filteredUsers = allUsers.filter((user) => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.pj.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCohort = selectedCohort === "all" || user.cohort === selectedCohort;
      const isPersistent = activeConversationIds.includes(user._id);

      if (searchQuery.trim() !== "") return matchesSearch && matchesCohort;
      return isPersistent && matchesCohort;
    });

    const broadcastEntry: BroadcastEntry = { _id: "broadcast_global", name: "ORHC Broadcasts", isBroadcast: true };
    if (selectedCohort === "all" && (searchQuery.trim() === "" || "broadcast".includes(searchQuery.toLowerCase()))) {
      return [broadcastEntry, ...filteredUsers];
    }
    return filteredUsers;
  }, [allUsers, searchQuery, activeConversationIds, selectedCohort]);

  // --- MODAL RECIPIENT FILTERING ---
  const filteredRecipientOptions = useMemo(() => {
    const query = recipientSearch.toLowerCase().trim();
    return allUsers.filter((u) => {
      const matchesCohort = modalCohortFilter === "all" || u.cohort === modalCohortFilter;
      const matchesSearch = !query || (
        u.name.toLowerCase().includes(query) ||
        u.pj.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
      return matchesCohort && matchesSearch;
    });
  }, [allUsers, recipientSearch, modalCohortFilter]);

  // --- CHAT LOGIC ---
  useEffect(() => {
    if (!selectedChat) return;
    dispatch(resetChatMessages());
    const fetchParams = selectedChat.isBroadcast ? { isBroadcast: true } : { receiverId: selectedChat.id };
    dispatch(fetchChatMessages(fetchParams));
    if (!selectedChat.isBroadcast) getSocket()?.emit("join_chat", selectedChat.id);
  }, [selectedChat, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewMessage = (msg: Message) => {
      const sId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
      const rId = typeof msg.receiver === "string" ? msg.receiver : msg.receiver?._id;
      if (selectedChat?.id === sId || selectedChat?.id === rId || (selectedChat?.isBroadcast && msg.isBroadcast)) {
        dispatch(receiveMessage(msg));
      }
    };
    socket.on("message:new", handleNewMessage);
    socket.on("message:broadcast", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:broadcast", handleNewMessage);
    };
  }, [selectedChat, dispatch]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedChat?.id || !inputText.trim()) return;
    try {
      const payload = selectedChat.isBroadcast
        ? { text: inputText.trim(), isBroadcast: true }
        : { text: inputText.trim(), receiver: selectedChat.id, receivers: [selectedChat.id] };
      const result = await dispatch(sendMessage(payload)).unwrap();
      getSocket()?.emit(selectedChat.isBroadcast ? "message:broadcast" : "message:send", result);
      if (!selectedChat.isBroadcast) dispatch(addToActiveConversations(selectedChat.id));
      setInputText("");
    } catch (err: any) {
      toast.error("Failed to transmit.");
    }
  }, [dispatch, selectedChat, inputText]);

  const handleBroadcastSubmit = async () => {
    if (!isGlobalBroadcast && selectedRecipients.length === 0) return toast.error("Select recipients");
    if (!broadcastMessage.trim()) return toast.error("Message empty");
    try {
      if (isGlobalBroadcast) {
        const result = await dispatch(sendMessage({ text: broadcastMessage, isBroadcast: true })).unwrap();
        getSocket()?.emit("message:broadcast", result);
        setSelectedChat({ id: "broadcast_global", name: "ORHC Broadcasts", isBroadcast: true });
      } else {
        const results = await dispatch(sendMessage({ text: broadcastMessage, receivers: selectedRecipients })).unwrap();
        if (Array.isArray(results)) {
          results.forEach((msg) => {
            getSocket()?.emit("message:send", msg);
            const tid = typeof msg.receiver === "string" ? msg.receiver : msg.receiver?._id;
            if (tid) dispatch(addToActiveConversations(tid));
          });
        }
        const lastId = selectedRecipients[selectedRecipients.length - 1];
        setSelectedChat({ id: lastId, name: allUsers.find(u => u._id === lastId)?.name || "User" });
      }
      setIsBroadcastModalOpen(false);
      setBroadcastMessage(""); 
      setSelectedRecipients([]);
      setRecipientSearch("");
      setModalCohortFilter("all");
      toast.success("Correspondence dispatched.");
    } catch (err: any) { toast.error("Dispatch failed"); }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR WITH HOVER & TOGGLE */}
      <div 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`
          relative border-r border-slate-100 flex flex-col bg-slate-50/50 
          transition-all duration-300 ease-in-out
          ${isSidebarExpanded ? "w-80" : "w-20"}
        `}
      >
        <div className="p-4 bg-white space-y-3 shadow-sm z-10 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <button 
               onClick={() => setIsBroadcastModalOpen(true)} 
               className={`bg-[#355E3B] text-white rounded-xl flex items-center justify-center font-bold text-xs hover:bg-[#2a4b2f] transition-all shrink-0 ${isSidebarExpanded ? "w-full py-3 px-2 gap-2" : "h-12 w-12"}`}
            >
              <Plus size={18} className="text-[#EFBF04]" /> 
              {isSidebarExpanded && <span className="whitespace-nowrap">NEW MESSAGE</span>}
            </button>
            
            {/* Manual Toggle Menu Button */}
            {isSidebarExpanded && (
              <button 
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 text-slate-400 hover:text-[#355E3B] hidden lg:block"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          {isSidebarExpanded && (
            <>
              <div className="relative animate-in fade-in duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-xs outline-none focus:ring-1 ring-[#355E3B]/20" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar animate-in fade-in duration-500">
                <button onClick={() => setSelectedCohort("all")} className={`px-3 py-1 rounded-full text-[9px] font-black transition-all border ${selectedCohort === "all" ? "bg-[#355E3B] text-white border-[#355E3B]" : "bg-white text-slate-400 border-slate-200"}`}>ALL</button>
                {availableCohorts.map(c => (
                  <button key={c} onClick={() => setSelectedCohort(c)} className={`px-3 py-1 rounded-full text-[9px] font-black transition-all border ${selectedCohort === c ? "bg-[#EFBF04] text-[#355E3B] border-[#EFBF04]" : "bg-white text-slate-400 border-slate-200"}`}>C{c}</button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          {isSidebarExpanded && (
            <h2 className="px-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 animate-in slide-in-from-left-2">Registry</h2>
          )}
          <div className="space-y-1">
            {activeChatPersonnel.map((item) => {
              const isBroad = 'isBroadcast' in item;
              const isActive = selectedChat?.id === item._id;
              return (
                <button
                  key={item._id}
                  onClick={() => setSelectedChat({ id: item._id, name: item.name, isBroadcast: isBroad })}
                  className={`
                    w-full flex items-center transition-all rounded-xl relative
                    ${isSidebarExpanded ? "p-3 px-4 gap-3" : "p-3 justify-center"}
                    ${isActive ? "bg-white border-r-4 border-[#EFBF04] shadow-sm text-[#355E3B]" : "hover:bg-white text-slate-700"}
                  `}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${isActive ? "bg-[#355E3B] text-white" : "bg-slate-300 text-white"}`}>
                    {isBroad ? <Megaphone size={16} className="text-[#EFBF04]" /> : item.name.charAt(0)}
                  </div>
                  
                  {isSidebarExpanded && (
                    <div className="text-left overflow-hidden animate-in fade-in duration-300">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-[9px] text-[#C5A059] font-black uppercase tracking-tighter">
                        {isBroad ? "Official Channel" : `PJ: ${item.pj} • C${item.cohort || '?'}`}
                      </p>
                    </div>
                  )}

                  {!isSidebarExpanded && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#EFBF04] rounded-l-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center gap-3">
                 {!isSidebarExpanded && (
                   <button onClick={() => setIsSidebarExpanded(true)} className="lg:hidden p-2 text-slate-400">
                     <Menu size={20} />
                   </button>
                 )}
                <div>
                  <h3 className="font-serif font-bold text-[#355E3B] text-lg leading-tight">{selectedChat.name}</h3>
                  <p className="text-[10px] font-black uppercase text-[#C5A059]">{selectedChat.isBroadcast ? "ORHC Announcements" : "Secure Correspondence"}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfc]">
              {chatMessages.map((msg, i) => {
                const isFromMe = (typeof msg.sender === "string" ? msg.sender : msg.sender?._id) === admin?._id;
                return (
                  <div key={i} className={`w-full flex flex-col mb-4 ${isFromMe ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[70%] p-4 shadow-sm border ${isFromMe ? "bg-[#355E3B] text-white rounded-2xl rounded-tr-none border-[#2a4b2f]" : "bg-white text-slate-800 rounded-2xl rounded-tl-none border-slate-100"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center gap-2 mt-2 opacity-60 ${isFromMe ? "justify-end" : "justify-start"}`}>
                        <span className="text-[9px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-100 flex items-center gap-4 bg-white">
              <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl px-5 py-3 text-sm bg-slate-100 outline-none focus:ring-1 ring-[#355E3B]/10" />
              <button type="submit" className="bg-[#355E3B] text-white p-3.5 rounded-xl hover:bg-[#2a4b2f] transition-colors"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <Scale size={120} className="text-[#355E3B]" />
            <p className="font-serif italic text-xl mt-4">ORHC Secure Communication</p>
          </div>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-serif font-bold text-[#355E3B]">New Correspondence</h2>
              <button onClick={() => { setIsBroadcastModalOpen(false); setRecipientSearch(""); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
               <button onClick={() => { setIsGlobalBroadcast(!isGlobalBroadcast); setSelectedRecipients([]); }} className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${isGlobalBroadcast ? "border-[#EFBF04] bg-[#355E3B] text-white" : "border-slate-100 bg-slate-50 text-slate-600"}`}>
                <div className="flex items-center gap-3"><Megaphone size={20} /><p className="font-bold text-sm">Public Broadcast (All Users)</p></div>
                {isGlobalBroadcast && <Check size={20} className="text-[#EFBF04]" />}
              </button>

              {!isGlobalBroadcast && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Filter Recipients by Cohort</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setModalCohortFilter("all")} className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-all ${modalCohortFilter === "all" ? "bg-[#355E3B] text-white border-[#355E3B]" : "bg-white text-slate-400 border-slate-200"}`}>ALL</button>
                      {availableCohorts.map(c => (
                        <button key={c} onClick={() => setModalCohortFilter(c)} className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-all ${modalCohortFilter === c ? "bg-[#EFBF04] text-[#355E3B] border-[#EFBF04]" : "bg-white text-slate-400 border-slate-200"}`}>COHORT {c}</button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Search by name or PJ..." value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-xs outline-none focus:ring-1 ring-[#355E3B]/20" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredRecipientOptions.map(u => (
                      <button key={u._id} onClick={() => setSelectedRecipients(prev => prev.includes(u._id) ? prev.filter(x => x !== u._id) : [...prev, u._id])} className={`p-3 text-left text-xs rounded-xl border transition-all flex justify-between items-center ${selectedRecipients.includes(u._id) ? "border-[#355E3B] bg-emerald-50 text-[#355E3B]" : "border-slate-100 hover:bg-slate-50"}`}>
                        <div>
                          <p className="font-bold">{u.name}</p>
                          <p className="text-[9px] opacity-70 uppercase">PJ: {u.pj} • C{u.cohort}</p>
                        </div>
                        {selectedRecipients.includes(u._id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Official Message</label>
                <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type your message..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:border-[#355E3B] outline-none" rows={4} />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-4">
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-500 font-bold px-4 text-sm hover:text-slate-700 transition-colors">Cancel</button>
              <button onClick={handleBroadcastSubmit} disabled={!isGlobalBroadcast && selectedRecipients.length === 0} className="bg-[#355E3B] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-[#2a4b2f] disabled:opacity-50 transition-all">Dispatch Correspondence</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;