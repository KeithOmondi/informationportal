import { useEffect, useState, useRef } from "react";
import {
  fetchCourtInfo,
  createDivision,
  updateDivision,
  deleteDivision,
  createFaq,
  updateFaq,
  deleteFaq,
  createContact,
  updateContact,
  deleteContact,
  type AudienceRole, // Imported from slice
} from "../../store/slices/courtInformationSlice";
import {
  Pencil,
  Trash,
  Plus,
  Gavel,
  BookOpen,
  Contact as ContactIcon,
  Upload,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const AdminCourtInfo = () => {
  const dispatch = useAppDispatch();
  const { divisions, faqs, contacts, loading } = useAppSelector(
    (state) => state.court,
  );

  // --- LOCAL STATE: DIVISIONS ---
  const [newDivName, setNewDivName] = useState("");
  const [newDivTitle, setNewDivTitle] = useState("");
  const [newDivBody, setNewDivBody] = useState("");
  const [newDivAudience, setNewDivAudience] = useState<AudienceRole>("all");
  const [divFile, setDivFile] = useState<File | null>(null);

  const [editDivId, setEditDivId] = useState<string | null>(null);
  const [editDivName, setEditDivName] = useState("");
  const [editDivTitle, setEditDivTitle] = useState("");
  const [editDivAudience, setEditDivAudience] = useState<AudienceRole>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOCAL STATE: FAQs ---
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [faqForm, setFaqForm] = useState<{
    question: string;
    answer: string;
    targetAudience: AudienceRole;
  }>({ question: "", answer: "", targetAudience: "all" });
  const [editFaqId, setEditFaqId] = useState<string | null>(null);

  // --- LOCAL STATE: CONTACTS ---
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState<{
    title: string;
    detail: string;
    sub: string;
    targetAudience: AudienceRole;
  }>({
    title: "",
    detail: "",
    sub: "",
    targetAudience: "all",
  });
  const [editContactId, setEditContactId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCourtInfo());
  }, [dispatch]);

  // --- RENDER HELPER: AUDIENCE SELECTOR ---
  const AudienceSelector = ({ 
    value, 
    onChange 
  }: { 
    value: AudienceRole, 
    onChange: (val: AudienceRole) => void 
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Target Audience</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value as AudienceRole)}
        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#355E3B] transition-all"
      >
        <option value="all">Everyone</option>
        <option value="dr">Deputy Registrars Only</option>
        <option value="judge">Judges Only</option>
      </select>
    </div>
  );

  // --- HANDLERS: DIVISIONS ---
  const handleAddDiv = () => {
    if (!newDivName.trim() || !newDivTitle.trim()) return;

    const formData = new FormData();
    formData.append("name", newDivName);
    formData.append("title", newDivTitle);
    formData.append("body", newDivBody);
    formData.append("targetAudience", newDivAudience);
    if (divFile) formData.append("file", divFile);

    dispatch(createDivision(formData));

    setNewDivName("");
    setNewDivTitle("");
    setNewDivBody("");
    setNewDivAudience("all");
    setDivFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdateDiv = (id: string) => {
    const formData = new FormData();
    formData.append("name", editDivName);
    formData.append("title", editDivTitle);
    formData.append("targetAudience", editDivAudience);
    dispatch(updateDivision({ id, formData }));
    setEditDivId(null);
  };

  const handleMoveDivision = (id: string, direction: "up" | "down") => {
    const currentIndex = divisions.findIndex((d) => d._id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === divisions.length - 1)
    )
      return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetDivision = divisions[targetIndex];

    dispatch(
      updateDivision({
        id,
        formData: { swapWith: targetDivision._id },
      }),
    );
  };

  // --- HANDLERS: FAQs & CONTACTS ---
  const handleFaqSubmit = () => {
    if (!faqForm.question || !faqForm.answer) return;
    if (editFaqId) {
      dispatch(updateFaq({ _id: editFaqId, ...faqForm }));
      setEditFaqId(null);
    } else {
      dispatch(createFaq(faqForm));
      setIsAddingFaq(false);
    }
    setFaqForm({ question: "", answer: "", targetAudience: "all" });
  };

  const handleContactSubmit = () => {
    if (!contactForm.title || !contactForm.detail) return;
    if (editContactId) {
      dispatch(updateContact({ _id: editContactId, ...contactForm }));
      setEditContactId(null);
    } else {
      dispatch(createContact(contactForm));
      setIsAddingContact(false);
    }
    setContactForm({ title: "", detail: "", sub: "", targetAudience: "all" });
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-[#355E3B] font-serif text-3xl font-bold italic">
            Conference Information
          </h1>
        </div>
        {loading && (
          <span className="text-[10px] font-black text-[#C5A059] animate-pulse">
            SYNCING DATA...
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#355E3B]/5 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Gavel size={18} className="text-[#355E3B]" />
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#355E3B]">
                Welcome Message from the Principal Judge
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  Create New Official Entry
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">OFFICIAL NAME</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#355E3B] transition-all"
                      placeholder="e.g. Hon. Eliud Njai"
                      value={newDivName}
                      onChange={(e) => setNewDivName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">OFFICIAL TITLE</label>
                    <input
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#355E3B] transition-all"
                      placeholder="e.g. Registrar High Court"
                      value={newDivTitle}
                      onChange={(e) => setNewDivTitle(e.target.value)}
                    />
                  </div>
                  <AudienceSelector value={newDivAudience} onChange={setNewDivAudience} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">MESSAGE / SHORT BIOGRAPHY</label>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#355E3B] min-h-[150px] resize-y transition-all"
                    placeholder="Enter the official message here..."
                    value={newDivBody}
                    onChange={(e) => setNewDivBody(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                      <Upload size={14} className="text-[#C5A059]" />
                      {divFile ? <span className="text-[#355E3B]">{divFile.name}</span> : "Attach Portrait Photo"}
                      <input type="file" hidden ref={fileInputRef} onChange={(e) => setDivFile(e.target.files?.[0] || null)} accept="image/*" />
                    </label>
                  </div>

                  <button
                    onClick={handleAddDiv}
                    disabled={loading || !newDivName || !newDivTitle}
                    className="bg-[#355E3B] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4b2f] disabled:opacity-50 shadow-lg shadow-[#355E3B]/20 transition-all"
                  >
                    {loading ? "Publishing..." : "Publish Entry"}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {divisions.map((d, index) => (
                  <div key={d._id} className="p-6 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group relative bg-white">
                    <div className="flex justify-between items-start mb-4">
                      {editDivId === d._id ? (
                        <div className="flex-1 space-y-3 p-2 bg-slate-50 rounded-xl border border-[#355E3B]/20">
                          <div className="grid grid-cols-2 gap-2">
                             <input
                              className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#355E3B]"
                              value={editDivName}
                              onChange={(e) => setEditDivName(e.target.value)}
                            />
                            <AudienceSelector value={editDivAudience} onChange={setEditDivAudience} />
                          </div>
                          <input
                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-[#C5A059] outline-none focus:border-[#355E3B]"
                            value={editDivTitle}
                            onChange={(e) => setEditDivTitle(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateDiv(d._id)} className="flex items-center gap-1 text-[9px] font-black bg-[#355E3B] text-white px-3 py-1.5 rounded-full">
                              <Check size={10} /> SAVE
                            </button>
                            <button onClick={() => setEditDivId(null)} className="text-[9px] font-black bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full">
                              CANCEL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          {d.content?.find((c) => c.type === "IMAGE") && (
                            <img src={d.content.find((c) => c.type === "IMAGE")?.url} className="w-12 h-12 rounded-full object-cover border border-[#C5A059]/30" alt="portrait" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-serif font-bold text-[#355E3B]">{d.name}</h3>
                              <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                {d.targetAudience}
                              </span>
                            </div>
                            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">{d.title}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all items-center">
                        <div className="flex flex-col mr-2 bg-slate-100 rounded-lg p-1">
                          <button onClick={() => handleMoveDivision(d._id, "up")} disabled={index === 0 || loading} className="text-slate-400 hover:text-[#355E3B] disabled:opacity-20"><ArrowUp size={14} /></button>
                          <button onClick={() => handleMoveDivision(d._id, "down")} disabled={index === divisions.length - 1 || loading} className="text-slate-400 hover:text-[#355E3B] disabled:opacity-20"><ArrowDown size={14} /></button>
                        </div>
                        <button onClick={() => { setEditDivId(d._id); setEditDivName(d.name); setEditDivTitle(d.title || ""); setEditDivAudience(d.targetAudience || 'all'); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Pencil size={14} /></button>
                        <button onClick={() => { if (window.confirm("Delete this official?")) dispatch(deleteDivision(d._id)); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash size={14} /></button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {d.content?.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          {item.body && <p className="text-sm text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-4 whitespace-pre-line">"{item.body}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Registry FAQs Section */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#355E3B]/5 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#355E3B]" />
                <h2 className="font-bold text-xs uppercase tracking-widest text-[#355E3B]">INFORMATION TO NOTE</h2>
              </div>
              <button onClick={() => { setIsAddingFaq(true); setEditFaqId(null); setFaqForm({ question: "", answer: "", targetAudience: "all" }); }} className="text-[10px] font-black text-[#C5A059] border border-[#C5A059] px-3 py-1 rounded-full hover:bg-[#C5A059] hover:text-white transition-all">+ ADD FAQ</button>
            </div>

            <div className="p-6 space-y-4">
              {(isAddingFaq || editFaqId) && (
                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-[#C5A059]/20 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[#355E3B]" placeholder="Question" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} />
                    <AudienceSelector value={faqForm.targetAudience} onChange={(val) => setFaqForm({ ...faqForm, targetAudience: val })} />
                  </div>
                  <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm min-h-[150px] outline-none focus:border-[#355E3B]" placeholder="Answer..." value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} />
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setIsAddingFaq(false); setEditFaqId(null); }} className="text-xs font-bold text-slate-400">Cancel</button>
                    <button onClick={handleFaqSubmit} className="bg-[#355E3B] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Save FAQ</button>
                  </div>
                </div>
              )}

              {faqs.map((f) => (
                <div key={f._id} className="group border-b border-slate-50 py-4 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{f.question}</h4>
                        <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">{f.targetAudience}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 whitespace-pre-line leading-relaxed">{f.answer}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditFaqId(f._id); setFaqForm({ question: f.question, answer: f.answer, targetAudience: f.targetAudience || 'all' }); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                      <button onClick={() => { if (window.confirm("Delete FAQ?")) dispatch(deleteFaq(f._id)); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Contacts */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-8">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#C5A059]">
                <ContactIcon size={18} />
                <h2 className="font-bold text-xs uppercase tracking-widest">ORHC Contact</h2>
              </div>
              <button onClick={() => { setIsAddingContact(true); setEditContactId(null); setContactForm({ title: "", detail: "", sub: "", targetAudience: "all" }); }} className="text-white hover:text-[#C5A059]"><Plus size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {(isAddingContact || editContactId) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <input className="w-full text-xs font-black bg-white border border-slate-200 p-2 rounded-lg outline-none uppercase" placeholder="Label" value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} />
                  <input className="w-full text-sm font-bold bg-white border border-slate-200 p-2 rounded-lg outline-none" placeholder="Details" value={contactForm.detail} onChange={(e) => setContactForm({ ...contactForm, detail: e.target.value })} />
                  <AudienceSelector value={contactForm.targetAudience} onChange={(val) => setContactForm({ ...contactForm, targetAudience: val })} />
                  <button onClick={handleContactSubmit} className="w-full bg-[#C5A059] text-white py-2 rounded-lg text-[10px] font-black uppercase shadow-md shadow-[#C5A059]/20 hover:bg-[#b08d4a] transition-all">Save Contact</button>
                  <button onClick={() => { setIsAddingContact(false); setEditContactId(null); }} className="w-full text-[9px] font-bold text-slate-400">Cancel</button>
                </div>
              )}

              {contacts.map((c) => (
                <div key={c._id} className="group relative pl-4 border-l-2 border-[#C5A059] py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="text-[9px] font-black text-[#C5A059] uppercase">{c.title}</p>
                         <span className="text-[7px] text-slate-300 font-bold uppercase">{c.targetAudience}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 break-all">{c.detail}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditContactId(c._id); setContactForm({ title: c.title, detail: c.detail, sub: c.sub || "", targetAudience: c.targetAudience || 'all' }); }} className="text-blue-400 hover:text-blue-600"><Pencil size={12} /></button>
                      <button onClick={() => { if (window.confirm("Delete contact?")) dispatch(deleteContact(c._id)); }} className="text-red-400 hover:text-red-600"><Trash size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminCourtInfo;