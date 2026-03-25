import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BellRing, 
  Calendar, 
  LogOut, 
  Image as ImageIcon, 
  Scale,
  type LucideIcon 
} from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/adminAuthSlice";

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
      className={`flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-all duration-300 group ${
        active
          ? "bg-[#355E3B]/5 border-r-[4px] border-[#C5A059] text-[#355E3B]"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#355E3B]"
      }`}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2.5 : 2}
        className={active ? "text-[#C5A059]" : "text-slate-400 group-hover:text-[#355E3B]"}
      />
      <span className={`text-sm font-serif font-bold tracking-tight ${active ? "text-[#355E3B]" : "text-slate-600"}`}>
        {label}
      </span>
    </Link>
  );
};

const JudgeSidebar = ({ isOpen, setIsOpen }: JudgeSidebarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // The Matcher in authSlice clears local state immediately
      await dispatch(logoutUser()).unwrap();
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      // Even if server fails, user is logged out locally
      navigate("/login");
    }
  };

  return (
    <>
      {/* 🌑 MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0F172A]/40 z-[110] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🏛️ MAIN SIDEBAR ASIDE */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[73px] left-0 z-[120]
        w-[280px] lg:w-64 bg-white h-[100dvh] lg:h-[calc(100vh-73px)]
        border-r border-slate-200 flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"}
      `}>
        
        {/* TOP STATUS: Judicial Registry Branding */}
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#355E3B]/10 rounded-lg">
              <Scale size={16} className="text-[#355E3B]" />
            </div>
            <span className="font-black text-[10px] text-[#355E3B] uppercase tracking-[0.15em]">
              Registry Navigation
            </span>
          </div>
        </div>

        {/* SCROLLABLE NAVIGATION AREA */}
        <div className="flex-1 overflow-y-auto pt-4 lg:pt-6 scrollbar-hide">
          
          <div className="px-6 mb-4">
             <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-black flex items-center gap-2">
              <span className="h-[1px] w-3 bg-[#C5A059]/40" />
              Core Portals
            </p>
          </div>

          <nav className="space-y-0.5 mb-8">
            <NavItem icon={LayoutDashboard} label="Dashboard" to="/judge/dashboard" onClick={() => setIsOpen(false)} />
            <NavItem icon={BookOpen} label="Conference Information" to="/judge/information" onClick={() => setIsOpen(false)} />
            <NavItem icon={Users} label="Conference Documents" to="/judge/documents" onClick={() => setIsOpen(false)} />
          </nav>

          <div className="px-6 mb-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-black flex items-center gap-2">
              <span className="h-[1px] w-3 bg-[#C5A059]/40" />
              Communications
            </p>
          </div>

          <nav className="space-y-0.5">
            <NavItem icon={BellRing} label="Notice Board" to="/judge/notices" onClick={() => setIsOpen(false)} />
            <NavItem icon={Calendar} label="Events" to="/judge/events" onClick={() => setIsOpen(false)} />
            <NavItem icon={ImageIcon} label="Gallery" to="/judge/gallery" onClick={() => setIsOpen(false)} />
          </nav>
        </div>

        {/* FIXED FOOTER AREA: Secure Exit */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-red-700 bg-white hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group border border-red-100 shadow-sm active:scale-[0.98]"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            End Session
          </button>
          
          <div className="mt-4 flex flex-col items-center gap-1 opacity-40">
            <div className="h-px w-8 bg-slate-300" />
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
              Secure Registry Access
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default JudgeSidebar;