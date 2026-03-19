import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, MessageSquare, Users, LogOut, Gavel, PinIcon, Menu, X,
   User, GalleryThumbnails, Book, Bell, BellOff, Loader2
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../store/hooks";
import type { AppDispatch } from "../../store/store";
import { logoutUser } from "../../store/slices/adminAuthSlice";
import { subscribeUserToPush } from "../../store/slices/pushSlice";

const AdminSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Notification logic for mobile view
  const { permission, loading: pushLoading } = useAppSelector((state) => state.push);
  const { unreadCount } = useAppSelector((state) => state.adminChat);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setIsOpen(false);
    navigate("/admin/login");
  };

  const handleBellClick = () => {
    if (permission !== "granted") {
      dispatch(subscribeUserToPush());
    } else {
      // Redirect to messages on mobile when bell is clicked to see details
      navigate("/admin/messages");
      setIsOpen(false);
    }
  };

  const linkClass = "flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 group";
  const activeClass = "bg-[#355E3B] text-white shadow-lg shadow-emerald-900/20 border-r-4 border-[#C5A059]";
  const inactiveClass = "text-slate-500 hover:bg-slate-50 hover:text-[#355E3B]";

  return (
    <>
      {/* 📱 MOBILE TOP BAR (Updated with Notifications & Messages) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#355E3B] p-1.5 rounded-lg">
            <Gavel size={16} className="text-[#C5A059]" />
          </div>
          <span className="text-xs font-black tracking-tighter">ORHC ADMIN</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Message Access */}
          <button 
            onClick={() => navigate("/admin/messages")}
            className="p-2 text-slate-400 relative"
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EFBF04] rounded-full border border-white" />
            )}
          </button>

          {/* Bell/Push Subscription */}
          <button onClick={handleBellClick} className="p-2 text-slate-400">
            {pushLoading ? <Loader2 size={20} className="animate-spin" /> : permission === "granted" ? <Bell size={20} /> : <BellOff size={20} className="text-red-300" />}
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[#355E3B] hover:bg-slate-100 rounded-lg"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* 🌑 MOBILE OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* 🏛️ SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 lg:top-[73px] left-0 z-[95] w-72 lg:w-64 bg-white h-full lg:h-[calc(100vh-73px)] border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex-1 overflow-y-auto p-6 pt-24 lg:pt-6">
          <div className="hidden lg:flex items-center gap-3 px-2 mb-10">
            <div className="bg-[#355E3B] p-2 rounded-lg shadow-sm">
              <Gavel size={20} className="text-[#C5A059]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight">ORHC</h2>
              <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest mt-0.5">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <NavLink to="/admin/dashboard" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><LayoutDashboard size={18} /> Dashboard</NavLink>
            <NavLink to="/admin/information" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><PinIcon size={18} /> Conference Information</NavLink>
            <NavLink to="/admin/documents" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><Book size={18} /> Documents</NavLink>
            <NavLink to="/admin/messages" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><MessageSquare size={18} /> Messages</NavLink>
            <NavLink to="/admin/notice" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><Users size={18} /> Notice Board</NavLink>
            <NavLink to="/admin/event" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><Users size={18} /> Events</NavLink>
            <NavLink to="/admin/gallery" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><GalleryThumbnails size={18} /> Gallery</NavLink>
            <NavLink to="/admin/users" onClick={() => setIsOpen(false)} className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}><User size={18} /> Users</NavLink>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 text-rose-500 hover:bg-rose-50 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-transparent hover:border-rose-100 active:scale-95">
            <LogOut size={18} /> End Session
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;