import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Trash2, 
  Upload, 
  UserPlus, 
  FilePlus, 
  Loader2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Edit3,
  X
} from "lucide-react";
import { 
  addJudgeBio, 
  updateJudgeBio, 
  addPresentation, 
  updateProgram,
  deleteCeremonyItem,
  resetCeremonyStatus
} from "../../store/slices/swearingPreferenceSlice";
import type { AppDispatch, RootState } from "../../store/store";

const AdminCeremony = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { judges, presentations, program, loading, success, error } = useSelector(
    (state: RootState) => state.ceremony
  );

  // --- FORM STATES ---
  const [uploadType, setUploadType] = useState<"PRESENTATION" | "PROGRAM">("PRESENTATION");
  
  // Judge/Bio States (Synced with 'description' schema)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [judgeForm, setJudgeForm] = useState({ name: "", title: "", description: "" });
  const [judgeFile, setJudgeFile] = useState<File | null>(null);

  // Presentation States
  const [presTitle, setPresTitle] = useState("");
  const [presFile, setPresFile] = useState<File | null>(null);

  // Program States (Simplified)
  const [releaseDateTime, setReleaseDateTime] = useState("");
  const [programFile, setProgramFile] = useState<File | null>(null);

  // Success/Error Toast Reset
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => dispatch(resetCeremonyStatus()), 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // --- HANDLERS ---

  const handleEditInit = (judge: any) => {
    setIsEditing(true);
    setEditingId(judge._id);
    setJudgeForm({ 
      name: judge.name, 
      title: judge.title, 
      description: judge.description || judge.bio // Handle fallback 
    });
    setJudgeFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setJudgeForm({ name: "", title: "", description: "" });
    setJudgeFile(null);
  };

  const handleJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", judgeForm.name);
    formData.append("title", judgeForm.title);
    formData.append("description", judgeForm.description); // Backend expects description
    if (judgeFile) formData.append("image", judgeFile);

    if (isEditing && editingId) {
      dispatch(updateJudgeBio({ judgeId: editingId, formData }));
      cancelEdit();
    } else {
      if (!judgeFile) return alert("Please select an image");
      dispatch(addJudgeBio(formData));
      setJudgeForm({ name: "", title: "", description: "" });
      setJudgeFile(null);
    }
  };

  const handlePresentationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presFile) return alert("Please select a file");
    const formData = new FormData();
    formData.append("title", presTitle);
    formData.append("file", presFile); 
    dispatch(addPresentation(formData));
    setPresTitle("");
    setPresFile(null);
  };

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    // Use 'scheduledFor' to match your controller's req.body parsing
    if (releaseDateTime) formData.append("scheduledFor", releaseDateTime);
    if (programFile) formData.append("file", programFile);
    
    dispatch(updateProgram(formData));
    setReleaseDateTime("");
    setProgramFile(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* NOTIFICATION HEADER */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1a1a1a]">ADMINISTRATION</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Ceremony Materials & Schedule
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-[10px] font-black uppercase animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={14} /> Update Successful
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full text-[10px] font-black uppercase">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* LEFT: JUDICIAL BIOGRAPHIES */}
        <section className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-[#355E3B]">
                <UserPlus size={20} />
                <h2 className="font-bold uppercase tracking-tighter text-lg">
                  {isEditing ? "Update Biography" : "Add Biography"}
                </h2>
              </div>
              {isEditing && (
                <button onClick={cancelEdit} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-[10px] font-bold uppercase">
                  <X size={14} /> Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleJudgeSubmit} className="space-y-4">
              <input 
                type="text" placeholder="Full Name" required 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm"
                value={judgeForm.name}
                onChange={(e) => setJudgeForm({...judgeForm, name: e.target.value})}
              />
              <input 
                type="text" placeholder="Title (e.g. High Court Judge)" required 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm" 
                value={judgeForm.title}
                onChange={(e) => setJudgeForm({...judgeForm, title: e.target.value})} 
              />
              <textarea 
                placeholder="Professional Description" required
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm h-40" 
                value={judgeForm.description}
                onChange={(e) => setJudgeForm({...judgeForm, description: e.target.value})} 
              />
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-[#355E3B] transition-colors group">
                <Upload className="text-slate-400 group-hover:text-[#355E3B]" size={20} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {isEditing ? "Replace Image (Optional)" : "Profile Image"}
                  </span>
                  <input 
                    type="file" accept="image/*" 
                    onChange={(e) => setJudgeFile(e.target.files?.[0] || null)} 
                    className="text-xs mt-1" 
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full py-4 bg-[#355E3B] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#2a4a2f] transition-all flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : isEditing ? "Update Profile" : "Save Profile"}
              </button>
            </form>
          </div>

          <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] shadow-xl">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-slate-500">Stored Biographies</h3>
             <div className="space-y-3">
                {judges.map(judge => (
                  <div key={judge._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden">
                        <img src={judge.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white">{judge.name}</p>
                        <p className="text-[9px] uppercase text-slate-500">{judge.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditInit(judge)} className="p-2 text-slate-400 hover:text-[#C5A059] transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => dispatch(deleteCeremonyItem({ type: "judges", id: judge._id }))} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* RIGHT: DYNAMIC ASSETS & PROGRAM */}
        <section className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="relative mb-8">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Upload Category</label>
              <div className="relative">
                <select 
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                  className="w-full p-4 bg-slate-900 text-white rounded-2xl appearance-none font-bold text-xs tracking-widest cursor-pointer outline-none"
                >
                  <option value="PRESENTATION">PRESENTATION MATERIALS</option>
                  <option value="PROGRAM">CEREMONY PROGRAM</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C5A059]" size={18} />
              </div>
            </div>

            {uploadType === "PRESENTATION" ? (
              <form onSubmit={handlePresentationSubmit} className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-4 text-[#C5A059]">
                  <FilePlus size={20} />
                  <h2 className="font-bold uppercase tracking-tighter text-sm">Upload Material</h2>
                </div>
                <input type="text" placeholder="Document/Video Title" required className="w-full p-4 bg-slate-50 rounded-2xl text-sm" value={presTitle} onChange={(e) => setPresTitle(e.target.value)} />
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl group hover:border-[#C5A059] transition-colors">
                  <Upload className="text-slate-400 group-hover:text-[#C5A059]" size={20} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">File (PDF/Video)</span>
                    <input type="file" accept=".pdf,.doc,.docx,video/*" onChange={(e) => setPresFile(e.target.files?.[0] || null)} className="text-xs mt-1" />
                  </div>
                </div>
                <button disabled={loading} className="w-full py-4 bg-[#C5A059] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#a8894c] transition-all flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Upload Material"}
                </button>
              </form>
            ) : (
              /* SIMPLIFIED PROGRAM FORM: Only Release Time & File Upload */
              <form onSubmit={handleProgramSubmit} className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-2 text-[#C5A059]">
                  <Calendar size={20} />
                  <h2 className="font-bold uppercase tracking-tighter text-sm">Schedule & File</h2>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-[#C5A059]" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Release Date & Time</label>
                  </div>
                  <input 
                    type="datetime-local" 
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold" 
                    value={releaseDateTime} 
                    onChange={(e) => setReleaseDateTime(e.target.value)} 
                  />
                </div>

                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl group hover:border-slate-900 transition-colors">
                  <FileText className="text-slate-400 group-hover:text-slate-900" size={20} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Upload PDF Program</span>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      onChange={(e) => setProgramFile(e.target.files?.[0] || null)} 
                      className="text-xs mt-1" 
                    />
                  </div>
                </div>

                <button disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Update Schedule"}
                </button>
              </form>
            )}
          </div>

          {/* ASSET STATUS LIST */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-slate-400">Current Assets</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {uploadType === "PRESENTATION" ? (
                presentations.map(p => (
                  <div key={p._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex flex-col">
                      <p className="text-[11px] font-bold truncate pr-4">{p.title}</p>
                      <span className="text-[8px] uppercase text-slate-500">{p.fileType}</span>
                    </div>
                    <button onClick={() => dispatch(deleteCeremonyItem({ type: "presentations", id: p._id }))} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-1">Status</p>
                    <p className="text-[12px] font-serif">
                      {program?.scheduledRelease 
                        ? `Public after: ${new Date(program.scheduledRelease).toLocaleString()}` 
                        : "No release time set"}
                    </p>
                  </div>
                  {program?.programFileUrl && (
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-bold">PDF Program Uploaded</span>
                      </div>
                      <a href={program.programFileUrl} target="_blank" rel="noreferrer" className="text-[10px] underline text-slate-400 hover:text-white">View File</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminCeremony;