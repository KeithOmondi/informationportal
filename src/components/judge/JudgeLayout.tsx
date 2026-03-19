import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import JudgeHeader from './JudgeHeader';
import JudgeSidebar from './JudgeSidebar';

interface JudgeLayoutProps {
  children?: ReactNode;
}

const JudgeLayout = ({ children }: JudgeLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFDFD]">
      {/* 1. SIDEBAR 
          Controlled via FAB in Header. 
          On Desktop (lg), it stays fixed/sticky on the left.
      */}
      <JudgeSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* 2. RIGHT SIDE WRAPPER 
          This container holds the Header and Main Content.
          'flex-1' allows it to take the remaining width next to the sidebar.
      */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* 3. STICKY HEADER 
            High z-index to stay above main content.
        */}
        <div className="sticky top-0 z-[90] shrink-0">
          <JudgeHeader toggleSidebar={toggleSidebar} />
        </div>

        {/* 4. SCROLLABLE MAIN CONTENT 
            'overflow-y-auto' ensures only this section scrolls, 
            keeping the Header and Sidebar visible.
        */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 transition-all duration-300 ease-in-out scroll-smooth bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto min-h-full">
            {/* Animate presence or simple entry transitions can be added here 
                to make page changes feel smoother.
            */}
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children || <Outlet />}
            </section>
          </div>
          
          {/* OPTIONAL: Mobile Bottom Spacer 
              Ensures content isn't hidden behind the FAB (Floating Action Button) 
              when scrolling to the absolute bottom.
          */}
          <div className="h-24 lg:hidden" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
};

export default JudgeLayout;