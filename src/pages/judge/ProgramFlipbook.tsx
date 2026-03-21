import React from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useSelector } from "react-redux";
import { Clock, UserCheck } from "lucide-react";
import type { RootState } from '../../store/store';

// 1. Define the Page component with ForwardRef for the flip engine
const Page = React.forwardRef<HTMLDivElement, { number: number; children: React.ReactNode }>((props, ref) => {
  return (
    <div className="bg-white border shadow-inner w-full h-full flex flex-col" ref={ref}>
      <div className="flex-1 m-4 border-2 border-[#355E3B]/5 p-6 rounded-xl relative bg-[#fdfbf7]">
        {props.children}
        <div className="absolute bottom-2 right-4 text-[9px] font-black text-slate-300 tracking-widest">
          PAGE {props.number}
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
Page.displayName = "Page";

const ProgramFlipbook = () => {
  const { program } = useSelector((state: RootState) => state.program);

  if (!program || !program.schedule) return null;

  return (
    <div className="flex justify-center items-center py-12 bg-slate-200/50 rounded-[2.5rem] overflow-hidden">
      {/* @ts-ignore - Some versions of react-pageflip have legacy Ref types */}
      <HTMLFlipBook
        width={550}
        height={733}
        size="stretch"
        minWidth={315}
        maxWidth={1000}
        minHeight={420}
        maxHeight={1350}
        drawShadow={true}
        flippingTime={1000}
        usePortrait={true}
        startPage={0}
        autoSize={true}
        showCover={true}
        mobileScrollSupport={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
        className="shadow-2xl"
        style={{ margin: '0 auto' }}
        startZIndex={0}
      >
        {/* PAGE 1: COVER */}
        <Page number={1}>
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-12 h-1.5 bg-[#C5A059] rounded-full" />
            <div className="space-y-2">
              <p className="text-[#355E3B] text-[10px] font-black uppercase tracking-[0.3em]">Republic of Kenya</p>
              <h1 className="text-[#355E3B] font-serif text-3xl font-bold leading-tight">
                {program.event_title}
              </h1>
            </div>
            <div className="py-4 px-6 border-y border-[#C5A059]/20">
              <p className="text-[#C5A059] text-[11px] font-black uppercase tracking-[0.2em]">
                Official Event Programme
              </p>
            </div>
            <p className="text-slate-400 text-[9px] font-medium italic mt-8">
              Office of the Registrar High Court
            </p>
          </div>
        </Page>

        {/* SCHEDULE PAGES */}
        {program.schedule.map((day, index) => (
          <Page key={day._id || index} number={index + 2}>
            <div className="space-y-4">
              <header className="border-b border-[#C5A059]/30 pb-3">
                <h2 className="text-[#355E3B] font-serif text-xl font-bold">Day {day.day}</h2>
                <p className="text-[#C5A059] text-[10px] font-black uppercase">
                  {new Date(day.date).toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </header>

              {day.session_chairs && day.session_chairs.length > 0 && (
                <div className="flex items-center gap-2 bg-[#355E3B]/5 p-2 rounded-lg">
                  <UserCheck size={12} className="text-[#355E3B]" />
                  <p className="text-[9px] font-bold text-[#355E3B] uppercase">
                    Chairs: {day.session_chairs.join(" & ")}
                  </p>
                </div>
              )}

              <div className="space-y-4 mt-6">
                {day.activities.map((act, i) => (
                  <div key={i} className="group">
                    <div className="flex items-baseline gap-3">
                      <div className="flex items-center gap-1 text-[#C5A059] font-mono text-[10px] font-bold shrink-0">
                        <Clock size={10} /> {act.time}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-serif font-bold text-slate-800 leading-snug">
                          {act.activity}
                        </p>
                        {act.facilitator && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            {act.facilitator}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Page>
        ))}

        {/* BACK COVER */}
        <Page number={program.schedule.length + 2}>
          <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
             <div className="w-20 h-20 rounded-full border-4 border-[#355E3B] flex items-center justify-center">
                <span className="font-serif font-bold text-2xl text-[#355E3B]">ORHC</span>
             </div>
          </div>
        </Page>
      </HTMLFlipBook>
    </div>
  );
};

export default ProgramFlipbook;