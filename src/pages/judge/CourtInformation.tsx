import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCourtInfo } from "../../store/slices/courtInformationSlice";

/* =====================================================
    REUSABLE SUB-COMPONENTS
===================================================== */

const ContactCard: React.FC<{
  title: string;
  detail: string;
  sub?: string;
}> = ({ title, detail, sub }) => {
  const getIcon = () => {
    const t = title.toLowerCase();
    if (t.includes("email") || t.includes("@")) return <Mail size={24} />;
    if (t.includes("location") || t.includes("address"))
      return <MapPin size={24} />;
    return <Phone size={24} />;
  };

  return (
    <div className="bg-white border border-slate-300 p-6 md:p-8 rounded-none text-center group hover:bg-slate-50 transition-all duration-300 shadow-sm">
      <div className="text-[#355E3B] mb-4 flex justify-center">
        {React.cloneElement(getIcon(), { className: "text-[#C5A059]" })}
      </div>
      <h3 className="text-[#355E3B] text-[10px] font-black uppercase tracking-[0.2em] mb-3">
        {title}
      </h3>
      <p className="text-[#355E3B] font-bold text-sm mb-1 break-words">{detail}</p>
      {sub && <p className="text-slate-500 text-[10px] font-medium uppercase tracking-tighter">{sub}</p>}
    </div>
  );
};

/* =====================================================
    MAIN PAGE COMPONENT
===================================================== */

const CourtInformation: React.FC = () => {
  const dispatch = useAppDispatch();
  const { divisions, faqs, contacts } = useAppSelector((state) => state.court);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCourtInfo());
  }, [dispatch]);

  const leadData = divisions[0];

  return (
    <div className="max-w-7xl mx-auto space-y-1 p-4 md:p-6 animate-in fade-in duration-700">
      
      {/* HERO SECTION */}
      <section className="bg-[#355E3B] rounded-t-[0.5rem] border-b-4 border-[#C5A059] p-8 md:p-12 text-center relative shadow-md">
        <p className="text-[#C5A059] uppercase font-black text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] mb-4">
          Republic of Kenya
        </p>
        <h1 className="text-white font-serif text-2xl md:text-2xl font-bold tracking-tight uppercase">
          The High Court of Kenya
        </h1>
      </section>

      {/* LEADERSHIP MESSAGE SECTION */}
      {leadData && (
        <section className="bg-white rounded-b-[0.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row border-t-0">
          
          {/* IMAGE BLOCK - Fixed for Mobile */}
          <div className="relative w-full md:w-[40%] bg-slate-100 shrink-0">
            <div className="aspect-[1/1] sm:aspect-[4/3] md:h-full w-full">
              <img
                src={leadData.content?.find((c: any) => c.type === "IMAGE")?.url}
                className="w-full h-full object-cover object-top grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                alt={leadData.name}
              />
            </div>
            {/* Overlay Label - Adjusted for better mobile visibility */}
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 bg-gradient-to-t from-[#355E3B] via-[#355E3B]/90 to-transparent md:bg-[#355E3B]/95 md:border-t-4 border-[#C5A059]">
              <h3 className="text-white text-center font-serif font-bold text-lg md:text-1xl tracking-wide leading-tight">
                {leadData.name}
              </h3>
              <p className="text-[#C5A059] text-center font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] mt-1 md:mt-2">
                {leadData.title}
              </p>
            </div>
          </div>

          {/* MESSAGE BLOCK */}
          <div className="relative flex-1 p-6 md:p-12 lg:p-16 flex flex-col justify-center">
            {/* OFFICIAL HEADER STACK */}
            <div className="flex flex-row items-center gap-4 md:gap-6 mb-8 md:mb-12 border-b border-slate-100 pb-6 md:pb-8">
              <img
                src="https://res.cloudinary.com/drls2cpnu/image/upload/v1772111715/JOB_LOGO_ebsbgu.jpg"
                className="h-14 md:h-20 w-auto rounded-none object-contain border border-slate-100 p-1 bg-white"
                alt="Judiciary Logo"
              />
              <div className="flex flex-col">
                <p className="text-[#355E3B] font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
                  The Judiciary
                </p>
                <h4 className="text-[#355E3B] font-black text-[12px] md:text-[14px] uppercase mt-1">
                  OFFICE OF THE {leadData.title}
                </h4>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <h2 className="text-[#1a1a1a] text-2xl md:text-3xl lg:text-4xl font-serif font-bold leading-none border-l-4 md:border-l-8 border-[#355E3B] pl-4 md:pl-6">
                Welcome Message
              </h2>
              
              <div className="space-y-4 md:space-y-6">
                <p className="font-serif text-lg md:text-xl text-slate-800 font-bold italic">
                  Greetings,
                </p>
                <div className="text-slate-700 leading-relaxed text-base md:text-lg font-serif whitespace-pre-line text-justify">
                  {leadData.content?.find((c: any) => c.type === "TEXT")?.body || leadData.content?.[0]?.body}
                </div>
              </div>

              <div className="pt-6 md:pt-8 border-t border-slate-100 flex flex-col items-start">
                <p className="font-serif italic text-xl md:text-2xl text-[#355E3B]">
                  {leadData.title}
                </p>
                <p className="text-[10px] md:text-[11px] font-black text-[#C5A059] uppercase mt-2 tracking-widest">
                  High Court of Kenya
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* INFORMATION TO NOTE SECTION */}
      <section className="bg-white border border-slate-200 p-6 md:p-10 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-10">
          <h2 className="text-[#355E3B] font-serif text-xl md:text-2xl font-bold uppercase tracking-tighter shrink-0">
            Information to Note
          </h2>
          <div className="h-1 flex-1 bg-slate-100" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
          {faqs.map((faq) => {
            const isOpen = openFaq === faq._id;
            return (
              <div key={faq._id} className="transition-all duration-300 bg-white">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : faq._id)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left outline-none group"
                >
                  <span className={`text-[12px] md:text-sm font-bold uppercase tracking-tight transition-colors ${isOpen ? 'text-[#355E3B]' : 'text-slate-600 group-hover:text-[#355E3B]'}`}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`transition-transform shrink-0 ${isOpen ? "rotate-180 text-[#C5A059]" : "text-slate-300"}`}
                    size={18}
                  />
                </button>
                {isOpen && (
                  <div className="p-5 md:p-6 pt-0 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-slate-50 border-l-4 border-[#C5A059] text-slate-700 text-[14px] md:text-[15px] leading-relaxed font-serif">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACTS SECTION */}
      <section className="space-y-1">
        <div className="bg-[#355E3B] p-5 text-center rounded-t-[0.5rem]">
            <h2 className="text-white font-serif text-lg md:text-xl font-bold uppercase tracking-wide">
               For inquiries please contact
            </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
          {contacts.map((contact) => (
            <ContactCard
              key={contact._id}
              title={contact.title}
              detail={contact.detail}
              sub={contact.sub}
            />
          ))}
        </div>
      </section>

      {/* FOOTER BLOCK */}
      <div className="bg-slate-50 p-6 text-center border border-slate-200 rounded-b-[0.5rem]">
        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
          Judges Information Portal • High Court of Kenya • 2026
        </p>
      </div>
    </div>
  );
};

export default CourtInformation;