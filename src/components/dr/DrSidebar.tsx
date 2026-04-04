import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  BellRing,
  Gavel,
  Book,
  Camera,
  LogOut,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/adminAuthSlice";

interface DrSidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const DrSidebar: React.FC<DrSidebarProps> = ({ isOpen, setIsOpen }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(false)).unwrap();
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      setIsOpen(false);
      navigate("/login");
    }
  };

  const linkClass =
    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 group mb-1";
  const activeClass =
    "bg-[#355E3B] text-white shadow-lg shadow-emerald-900/20 border-r-4 border-[#C5A059]";
  const inactiveClass = "text-slate-500 hover:bg-slate-50 hover:text-[#355E3B]";

  return (
    <>
      {/* 📱 MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
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

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[#355E3B] hover:bg-slate-100 rounded-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 🌑 MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🏛️ SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[73px] left-0 z-[95] w-72 lg:w-64 bg-white h-full lg:h-[calc(100vh-73px)] border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-6 pt-24 lg:pt-6">
          {/* LOGO SECTION */}
          <div className="hidden lg:flex items-center gap-3 px-2 mb-10">
            <div className="bg-[#355E3B] p-2 rounded-lg shadow-sm">
              <Gavel size={20} className="text-[#C5A059]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none">
                ORHC
              </h2>
              <p className="text-[8px] font-bold text-[#C5A059] uppercase tracking-[0.1em] mt-1">
                Registrar Information
              </p>
            </div>
          </div>

          <nav className="font-serif">
            <NavLink
              to="/dr/dashboard"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>

            <NavLink
              to="/dr/information"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              <BookOpen size={18} /> Conference Information
            </NavLink>

            <NavLink
              to="/dr/programme"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              <Book size={18} /> Conference Documents
            </NavLink>


            <div className="px-6 mb-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A059] font-black flex items-center gap-2">
              <span className="h-[1px] w-3 bg-[#C5A059]/40" />
              Communications
            </p>
          </div>

            <NavLink
              to="/dr/notice"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              <BellRing size={18} /> Notice Board
            </NavLink>

            <NavLink
              to="/dr/events"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              <Calendar size={18} /> Events
            </NavLink>

            <NavLink
              to="/dr/gallery"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              <Camera size={18} /> Gallery
            </NavLink>
          </nav>
        </div>

        {/* LOGOUT SECTION */}
        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 text-rose-500 hover:bg-rose-50 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-transparent hover:border-rose-100 active:scale-95"
          >
            <LogOut size={18} /> End Session
          </button>
        </div>
      </aside>
    </>
  );
};

export default DrSidebar;