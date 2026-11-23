import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  LogOut,
  PinIcon,
  Menu,
  X,
  User,
  GalleryThumbnails,
  Book,
  Bell,
  BellOff,
  Loader2,
  BookA,
  CalendarDays,
  Megaphone,
  Lock,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../store/hooks";
import type { AppDispatch } from "../../store/store";
import { subscribeUserToPush } from "../../store/slices/pushSlice";
import { logoutUser } from "../../store/slices/adminAuthSlice";

const GOLD = "#C9A24A";

const NAV = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/information", icon: PinIcon, label: "Conference Info" },
  { to: "/admin/documents", icon: Book, label: "Documents" },
  { to: "/admin/view-documents", icon: Lock, label: "Confidential Correspondence" },
  { to: "/admin/messages", icon: MessageSquare, label: "Messages" },
  { to: "/admin/notice", icon: Megaphone, label: "Notice Board" },
  { to: "/admin/event", icon: CalendarDays, label: "Events" },
  { to: "/admin/gallery", icon: GalleryThumbnails, label: "Gallery" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/program", icon: BookA, label: "Programme" },
];

const AdminSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Notification logic for mobile view
  const { permission, loading: pushLoading } = useAppSelector(
    (state) => state.push,
  );
  const { unreadCount } = useAppSelector((state) => state.adminChat);
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      // Pass 'false' for the allDevices parameter to satisfy the thunk
      await dispatch(logoutUser(false)).unwrap();
      setIsOpen(false);
      navigate("/admin/login");
    } catch {
      // Local state is cleared by the slice matcher regardless of a successful server response.
      setIsOpen(false);
      navigate("/admin/login");
    }
  };

  const handleBellClick = () => {
    if (permission !== "granted") {
      dispatch(subscribeUserToPush());
    } else {
      navigate("/admin/messages");
      setIsOpen(false);
    }
  };

  const linkClass =
    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-all duration-200";
  const activeClass = "bg-white/10 text-white shadow-inner";
  const inactiveClass = "text-emerald-50/60 hover:bg-white/5 hover:text-white";

  return (
    <>
      {/* 📱 MOBILE TOP BAR */}
      <div className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between border-b border-white/10 bg-[#14301f] px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center gap-2">
          <div className="rounded bg-white p-1">
            <img src="/JOB_LOGO.jpg" alt="" className="h-6 w-auto" />
          </div>
          <span className="font-serif text-sm font-bold tracking-tight text-white">Information Portal</span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => navigate("/admin/messages")} className="relative p-2 text-white/70">
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-[#14301f]" style={{ background: GOLD }} />
            )}
          </button>

          <button onClick={handleBellClick} className="p-2 text-white/70">
            {pushLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : permission === "granted" ? (
              <Bell size={20} />
            ) : (
              <BellOff size={20} className="text-rose-300" />
            )}
          </button>

          <div className="mx-1 h-6 w-px bg-white/15" />

          <button onClick={() => setIsOpen(!isOpen)} className="rounded-lg p-2 text-white hover:bg-white/10">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* 🌑 MOBILE OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* 🏛️ SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-[95] flex h-full w-72 flex-col transition-transform duration-300 ease-in-out lg:sticky lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "linear-gradient(180deg, #14301f 0%, #1B3A2A 100%)" }}
      >
        {/* Brand */}
        <div className="px-6 pb-5 pt-24 lg:pt-7">
          <div className="hidden items-center gap-3 lg:flex">
            <div className="shrink-0 rounded bg-white p-1.5 shadow-lg">
              <img src="/JOB_LOGO.jpg" alt="Republic of Kenya, the Judiciary" className="h-9 w-auto" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base font-bold leading-tight text-white">Information</h2>
              <p className="font-serif text-base font-bold leading-tight" style={{ color: GOLD }}>Portal</p>
            </div>
          </div>
          <div className="mt-5 hidden h-px bg-gradient-to-r from-white/20 to-transparent lg:block" />
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Admin console</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ background: GOLD }} />}
                  <link.icon size={18} style={isActive ? { color: GOLD } : undefined} />
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Signed in as + sign out */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: GOLD }}>
              <User size={18} className="text-[#14301f]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{user?.name || "Administrator"}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{user?.role || "Authorized"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-200 transition-all hover:border-rose-300/30 hover:bg-rose-500/10 active:scale-95"
          >
            <LogOut size={16} /> End session
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
