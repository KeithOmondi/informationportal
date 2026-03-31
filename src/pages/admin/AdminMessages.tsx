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
} from "lucide-react";
import toast from "react-hot-toast";

import type { AppDispatch, RootState } from "../../store/store";
import {
  type Message,
  type MessageAudience,
  sendMessage,
  fetchChatMessages,
  receiveMessage,
  resetChatMessages,
} from "../../store/slices/adminMessageSlice";
import {
  fetchUsers,
  addToActiveConversations,
  fetchActiveConversations,
} from "../../store/slices/adminUserSlice";
import { getSocket } from "../../services/socket";

type BroadcastEntry = { _id: string; name: string; isBroadcast: true };
type SidebarItem = any | BroadcastEntry;

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
  const [broadcastAudience, setBroadcastAudience] = useState<MessageAudience>("ALL");

  // --- REDUX DATA ---
  const { chatMessages, sending } = useSelector((state: RootState) => state.adminChat);
  const { profile: admin } = useSelector((state: RootState) => state.users); // Adjusted to profile from adminUserSlice
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

    const broadcastEntry: BroadcastEntry = { _id: "broadcast_global", name: "Official Broadcasts", isBroadcast: true };
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
      // Validating against the new Judicial Roles
      return matchesCohort && matchesSearch && (u.role === "judge" || u.role === "dr");
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
      
      const isRelevant = 
        selectedChat?.id === sId || 
        selectedChat?.id === rId || 
        (selectedChat?.isBroadcast && msg.isBroadcast);

      if (isRelevant) {
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
    if (!selectedChat?.id || !inputText.trim() || sending) return;
    
    try {
      const recipient = allUsers.find(u => u._id === selectedChat.id);
      const payload: any = { text: inputText.trim() };

      if (selectedChat.isBroadcast) {
        payload.isBroadcast = true;
        payload.audience = "ALL";
      } else {
        payload.receiver = selectedChat.id;
        payload.targetRole = recipient?.role; 
      }

      const result = await dispatch(sendMessage(payload)).unwrap();
      
      const socket = getSocket();
      const messages = Array.isArray(result) ? result : [result];
      messages.forEach(m => socket?.emit(m.isBroadcast ? "message:broadcast" : "message:send", m));

      if (!selectedChat.isBroadcast) dispatch(addToActiveConversations(selectedChat.id));
      setInputText("");
    } catch (err: any) {
      toast.error(err || "Failed to transmit.");
    }
  }, [dispatch, selectedChat, inputText, allUsers, sending]);

  const handleBroadcastSubmit = async () => {
    if (!isGlobalBroadcast && selectedRecipients.length === 0) return toast.error("Select recipients");
    if (!broadcastMessage.trim()) return toast.error("Message empty");

    try {
      let result;
      if (isGlobalBroadcast) {
        result = await dispatch(sendMessage({ 
          text: broadcastMessage, 
          isBroadcast: true,
          audience: broadcastAudience 
        })).unwrap();
        setSelectedChat({ id: "broadcast_global", name: "Official Broadcasts", isBroadcast: true });
      } else {
        const firstRecipient = allUsers.find(u => u._id === selectedRecipients[0]);
        result = await dispatch(sendMessage({ 
          text: broadcastMessage, 
          receivers: selectedRecipients,
          targetRole: firstRecipient?.role as "judge" | "dr"
        })).unwrap();
      }

      const socket = getSocket();
      const messages = Array.isArray(result) ? result : [result];
      messages.forEach((msg) => {
        socket?.emit(msg.isBroadcast ? "message:broadcast" : "message:send", msg);
        const tid = typeof msg.receiver === "string" ? msg.receiver : msg.receiver?._id;
        if (tid && !msg.isBroadcast) dispatch(addToActiveConversations(tid));
      });

      if (!isGlobalBroadcast) {
        const lastId = selectedRecipients[selectedRecipients.length - 1];
        setSelectedChat({ id: lastId, name: allUsers.find(u => u._id === lastId)?.name || "User" });
      }

      setIsBroadcastModalOpen(false);
      setBroadcastMessage(""); 
      setSelectedRecipients([]);
      toast.success("Correspondence dispatched.");
    } catch (err: any) { 
      toast.error(err || "Dispatch failed"); 
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`relative border-r border-slate-100 flex flex-col bg-slate-50/50 transition-all duration-300 ease-in-out ${isSidebarExpanded ? "w-80" : "w-20"}`}
      >
        <div className="p-4 bg-white space-y-3 shadow-sm z-10 overflow-hidden">
          <button 
             onClick={() => setIsBroadcastModalOpen(true)} 
             className={`bg-[#1a3a32] text-white rounded-xl flex items-center justify-center font-bold text-xs hover:bg-[#122923] transition-all shrink-0 ${isSidebarExpanded ? "w-full py-3 px-2 gap-2" : "h-12 w-12"}`}
          >
            <Plus size={18} className="text-[#c2a336]" /> 
            {isSidebarExpanded && <span className="whitespace-nowrap tracking-wider">NEW MESSAGE</span>}
          </button>

          {isSidebarExpanded && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-xs outline-none focus:ring-1 ring-[#1a3a32]/20" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button onClick={() => setSelectedCohort("all")} className={`px-3 py-1 rounded-full text-[9px] font-black transition-all border ${selectedCohort === "all" ? "bg-[#1a3a32] text-white border-[#1a3a32]" : "bg-white text-slate-400 border-slate-200"}`}>ALL</button>
                {availableCohorts.map(c => (
                  <button key={c} onClick={() => setSelectedCohort(c)} className={`px-3 py-1 rounded-full text-[9px] font-black transition-all border ${selectedCohort === c ? "bg-[#c2a336] text-[#1a3a32] border-[#c2a336]" : "bg-white text-slate-400 border-slate-200"}`}>C{c}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-1">
            {activeChatPersonnel.map((item) => {
              const isBroad = 'isBroadcast' in item;
              const isActive = selectedChat?.id === item._id;
              return (
                <button
                  key={item._id}
                  onClick={() => setSelectedChat({ id: item._id, name: item.name, isBroadcast: isBroad })}
                  className={`w-full flex items-center transition-all rounded-xl relative ${isSidebarExpanded ? "p-3 px-4 gap-3" : "p-3 justify-center"} ${isActive ? "bg-white border-r-4 border-[#c2a336] shadow-sm text-[#1a3a32]" : "hover:bg-white text-slate-700"}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${isActive ? "bg-[#1a3a32] text-white" : "bg-slate-300 text-white"}`}>
                    {isBroad ? <Megaphone size={16} className="text-[#c2a336]" /> : item.name.charAt(0)}
                  </div>
                  {isSidebarExpanded && (
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-[9px] text-[#c2a336] font-black uppercase tracking-tighter">
                        {isBroad ? "Official Channel" : `PJ: ${item.pj} • ${item.role?.toUpperCase()}`}
                      </p>
                    </div>
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
              <div>
                <h3 className="font-serif font-bold text-[#1a3a32] text-lg leading-tight">{selectedChat.name}</h3>
                <p className="text-[10px] font-black uppercase text-[#c2a336]">{selectedChat.isBroadcast ? "Registry Announcements" : "Secure Judicial Briefing"}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfc]">
              {chatMessages.map((msg, i) => {
                const senderId = typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
                const isFromMe = senderId === admin?._id;
                return (
                  <div key={msg._id || i} className={`w-full flex flex-col mb-4 ${isFromMe ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[70%] p-4 shadow-sm border ${isFromMe ? "bg-[#1a3a32] text-white rounded-2xl rounded-tr-none border-[#122923]" : "bg-white text-slate-800 rounded-2xl rounded-tl-none border-slate-100"}`}>
                      {selectedChat.isBroadcast && !isFromMe && <p className="text-[9px] font-black text-[#c2a336] uppercase mb-1">REGISTRY ADMIN</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center gap-2 mt-2 opacity-60 justify-end text-[9px]`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-5 border-t border-slate-100 flex items-center gap-4 bg-white">
              <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type an official message..." className="flex-1 rounded-xl px-5 py-3 text-sm bg-slate-100 outline-none" />
              <button type="submit" disabled={sending} className="bg-[#1a3a32] text-white p-3.5 rounded-xl hover:bg-[#122923] transition-colors disabled:opacity-50">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <Scale size={120} className="text-[#1a3a32]" />
            <p className="font-serif italic text-xl mt-4">Registry Secure Correspondence</p>
          </div>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-serif font-bold text-[#1a3a32]">New Correspondence</h2>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Type Selection */}
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsGlobalBroadcast(true); setSelectedRecipients([]); }} 
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${isGlobalBroadcast ? "border-[#c2a336] bg-[#1a3a32] text-white" : "border-slate-100 bg-slate-50 text-slate-600"}`}
                >
                  <Megaphone size={20} className="mx-auto mb-2" />
                  <p className="font-bold text-xs uppercase">Broadcast</p>
                </button>
                <button 
                  onClick={() => setIsGlobalBroadcast(false)} 
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all text-center ${!isGlobalBroadcast ? "border-[#c2a336] bg-[#1a3a32] text-white" : "border-slate-100 bg-slate-50 text-slate-600"}`}
                >
                  <Plus size={20} className="mx-auto mb-2" />
                  <p className="font-bold text-xs uppercase">Direct Select</p>
                </button>
              </div>

              {isGlobalBroadcast ? (
                <div className="p-4 bg-slate-100 rounded-2xl space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500">Target Audience</label>
                  <div className="flex gap-2">
                    {(["ALL", "JUDGES", "DR"] as MessageAudience[]).map((aud) => (
                      <button key={aud} onClick={() => setBroadcastAudience(aud)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${broadcastAudience === aud ? "bg-[#c2a336] text-[#1a3a32] shadow-sm" : "bg-white text-slate-400"}`}>
                        {aud}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Search PJ or Name..." value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-100 rounded-xl text-xs outline-none" />
                    </div>
                    {/* RESOLVED: Modal Cohort Filter UI */}
                    <select 
                      value={modalCohortFilter} 
                      onChange={(e) => setModalCohortFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="bg-slate-100 border-none rounded-xl px-4 py-3 text-xs font-bold text-[#1a3a32] outline-none"
                    >
                      <option value="all">All Cohorts</option>
                      {availableCohorts.map(c => <option key={c} value={c}>Cohort {c}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredRecipientOptions.map(u => (
                      <button key={u._id} onClick={() => setSelectedRecipients(prev => prev.includes(u._id) ? prev.filter(x => x !== u._id) : [...prev, u._id])} className={`p-3 text-left text-xs rounded-xl border transition-all flex justify-between items-center ${selectedRecipients.includes(u._id) ? "border-[#c2a336] bg-[#1a3a32] text-white" : "border-slate-100 hover:bg-slate-50"}`}>
                        <div className="overflow-hidden">
                          <p className="font-bold truncate">{u.name}</p>
                          <p className={`text-[9px] uppercase ${selectedRecipients.includes(u._id) ? "text-[#c2a336]" : "text-slate-400"}`}>PJ: {u.pj} • {u.role}</p>
                        </div>
                        {selectedRecipients.includes(u._id) && <Check size={14} className="text-[#c2a336]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Official Correspondence</label>
                <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type the registry briefing here..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 ring-[#1a3a32]/5 transition-all" rows={4} />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-4">
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-500 font-bold px-4 text-sm hover:text-slate-700">Discard</button>
              <button onClick={handleBroadcastSubmit} disabled={sending || (!isGlobalBroadcast && selectedRecipients.length === 0)} className="bg-[#1a3a32] text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-[#122923] shadow-lg shadow-[#1a3a32]/20 disabled:opacity-50 transition-all uppercase text-xs tracking-widest">Dispatch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;