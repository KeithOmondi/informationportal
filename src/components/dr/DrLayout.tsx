import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import DrHeader from "./DrHeader";
import DrSidebar from "./DrSidebar";
import { Menu } from "lucide-react";
import DrPasswordSetup from "../Login/DrPasswordSetup";

const DrLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, requiresPasswordChange, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) return null; // Or a loading spinner

  // AUTH GUARD: Redirect if not logged in or wrong role
  if (!user || user.role !== "dr") {
    return <Navigate to="/login" replace />;
  }

  // LANE GUARD: If DR needs to set password, block layout and show setup
  if (requiresPasswordChange) {
    return <DrPasswordSetup />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DrHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1">
        <DrSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Menu Button for Mobile */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[130]"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default DrLayout;