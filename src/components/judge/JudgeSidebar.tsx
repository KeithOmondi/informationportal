import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BellRing,
  Calendar,
  ShieldCheck,
  LogOut,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { logoutUser } from "../../store/slices/adminAuthSlice"; 
import type { AppDispatch } from "../../store/store";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  onClick?: () => void;
}

interface JudgeSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NavItem = ({ icon: Icon, label, to, onClick }: NavItemProps) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-all duration-200 ${
        active
          ? "bg-[#355E3B]/10 border-r-4 border-[#C5A059] text-[#355E3B]"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#355E3B] group"
      }`}
    >
      <Icon
        size={18}
        className={active ? "text-[#C5A059]" : "text-slate-400 group-hover:text-[#355E3B]"}
      />
      <span className={`text-sm font-bold ${active ? "text-[#355E3B]" : ""}`}>
        {label}
      </span>
    </Link>
  );
};

const JudgeSidebar = ({ isOpen, setIsOpen }: JudgeSidebarProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setIsOpen(false);
    navigate("/login"); 
  };

  return (
    <>
      {/* 🌑 MOBILE OVERLAY: Enhanced backdrop blur for focus */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[110] lg:hidden backdrop-blur-md transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🏛️ MAIN SIDEBAR ASIDE */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[73px] left-0 z-[120]
        w-[280px] sm:w-72 lg:w-64 bg-white h-[100dvh] lg:h-[calc(100vh-73px)]
        border-r border-slate-200 flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"}
      `}>
        
        {/* MOBILE TOP BAR: Identity confirmation in the drawer */}
        <div className="lg:hidden p-6 flex justify-between items-center border-b border-slate-50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#355E3B]" />
              <span className="font-black text-[11px] text-[#355E3B] uppercase tracking-wider">Main Navigation</span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE NAVIGATION AREA */}
        <div className="flex-1 overflow-y-auto pt-6 lg:pt-8 scrollbar-hide">
          {/* Mobile Branding - Matches the Information Portal theme */}
          <div className="lg:hidden px-6 mb-8">
            <div className="relative rounded-[0.5rem] overflow-hidden border border-slate-100 shadow-sm group">
              <img src="/JOB_LOGO.jpg" alt="Judiciary Branding" className="w-full h-24 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#355E3B]/80 to-transparent flex items-end p-3">
              </div>
            </div>
          </div>

          <nav className="space-y-0.5 mb-10">
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/judge/dashboard" onClick={() => setIsOpen(false)} />
            <NavItem icon={BookOpen} label="Conference Information" to="/judge/information" onClick={() => setIsOpen(false)} />
            <NavItem icon={Users} label="Conference Documents" to="/judge/documents" onClick={() => setIsOpen(false)} />
          </nav>

          <div className="mb-10">
            <p className="px-6 text-[9px] uppercase tracking-[0.25em] text-[#C5A059] mb-4 font-black flex items-center gap-2">
              <span className="h-px w-4 bg-[#C5A059]/30" />
              Communications
            </p>
            <nav className="space-y-0.5">
              <NavItem icon={BellRing} label="Notice Board" to="/judge/notices" onClick={() => setIsOpen(false)} />
              <NavItem icon={Calendar} label="Events" to="/judge/events" onClick={() => setIsOpen(false)} />
              <NavItem icon={ImageIcon} label="Gallery" to="/judge/gallery" onClick={() => setIsOpen(false)} />
            </nav>
          </div>
        </div>

        {/* FIXED FOOTER AREA: Secure and always accessible */}
        <div className="p-5 border-t border-slate-100 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-4 mb-4 text-rose-600 bg-rose-50/30 hover:bg-rose-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group active:scale-95 border border-rose-100/50"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>

          
        </div>
      </aside>
    </>
  );
};

export default JudgeSidebar;