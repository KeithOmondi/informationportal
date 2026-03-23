import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Trash2, UserPlus, Loader2, CheckCircle2,
  AlertCircle, Edit3, X, Lock, Unlock, Calendar, Clock, FileText
} from "lucide-react";

// Slices
import { 
  addJudgeBio, updateJudgeBio, deleteCeremonyItem, resetCeremonyStatus
} from "../../store/slices/swearingPreferenceSlice";
import { 
  updateProgram, fetchProgramForAdmin, clearProgramError, resetProgramStatus 
} from "../../store/slices/programSlice";
import {
  fetchPresentations, uploadPresentation, deletePresentation, resetPresentationStatus,
  type Presentation 
} from "../../store/slices/presentationSlice";

import type { AppDispatch, RootState } from "../../store/store";

const AdminCeremony = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // --- SELECTORS ---
  const { judges, loading: bioLoading, success: bioSuccess, error: bioError } = useSelector(
    (state: RootState) => state.ceremony
  );
  const { program, loading: programLoading, success: programSuccess, error: programError } = useSelector(
    (state: RootState) => state.program
  );
  const { 
    items: presentations,  
    uploading: presUploading, 
    deleting: presDeletingId, 
    success: presSuccess, 
    error: presError 
  } = useSelector((state: RootState) => state.presentations);

  // --- FORM STATES ---
  const [uploadType, setUploadType] = useState<"PRESENTATION" | "TIMER">("PRESENTATION");
  
  // Judge/Bio States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [judgeForm, setJudgeForm] = useState({ name: "", title: "", description: "" });
  const [judgeFile, setJudgeFile] = useState<File | null>(null);

  // Presentation States
  const [presTitle, setPresTitle] = useState("");
  const [presFile, setPresFile] = useState<File | null>(null);

  // Program Timer States
  const [releaseDateTime, setReleaseDateTime] = useState("");

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchProgramForAdmin());
    dispatch(fetchPresentations());
  }, [dispatch]);

  // Sync internal state when program data is loaded
  useEffect(() => {
    if (program?.scheduledRelease) {
      const date = new Date(program.scheduledRelease);
      const formatted = date.toISOString().slice(0, 16);
      setReleaseDateTime(formatted);
    }
  }, [program]);

  // Status Cleanup
  useEffect(() => {
    if (bioSuccess || presSuccess || programSuccess || bioError || programError || presError) {
      const timer = setTimeout(() => {
        dispatch(resetCeremonyStatus());
        dispatch(clearProgramError());
        dispatch(resetPresentationStatus());
        dispatch(resetProgramStatus());
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [bioSuccess, presSuccess, programSuccess, bioError, programError, presError, dispatch]);

  // --- HANDLERS ---

  const handleJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", judgeForm.name);
    formData.append("title", judgeForm.title);
    formData.append("description", judgeForm.description);
    if (judgeFile) formData.append("image", judgeFile);

    if (isEditing && editingId) {
      dispatch(updateJudgeBio({ judgeId: editingId, formData }));
      setIsEditing(false);
      setEditingId(null);
    } else {
      if (!judgeFile) return alert("Please select an image");
      dispatch(addJudgeBio(formData));
    }
    setJudgeForm({ name: "", title: "", description: "" });
    setJudgeFile(null);
  };

  const handlePresentationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presFile) return alert("Please select a file");
    if (!presTitle.trim()) return alert("Please enter a title");

    const formData = new FormData();
    formData.append("title", presTitle.trim());
    formData.append("file", presFile); 
    // Sending original filename specifically to ensure backend stores it for download headers
    formData.append("fileName", presFile.name);

    dispatch(uploadPresentation(formData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setPresTitle("");
        setPresFile(null);
        const fileInput = document.getElementById('presFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    });
  };

  const handleTimerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!program?._id) return;
    dispatch(updateProgram({ 
      id: program._id, 
      data: { scheduledRelease: releaseDateTime } 
    }));
  };

  const toggleMasterLock = () => {
    if (!program?._id) return;
    dispatch(updateProgram({ 
      id: program._id, 
      data: { isLocked: !program.isLocked } 
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 sm:space-y-12 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1a1a1a] uppercase tracking-tight">
            Administration
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Judiciary Materials & Access Control
          </p>
        </div>
        
        <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
          {(bioSuccess || presSuccess || programSuccess) && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-emerald-100 shadow-sm">
              <CheckCircle2 size={14} /> Action Successful
            </div>
          )}
          {(bioError || programError || presError) && (
            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-red-100 shadow-sm">
                <AlertCircle size={14} /> {presError || bioError || programError || "Server Error"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        
        {/* LEFT: JUDICIAL BIOGRAPHIES */}
        <section className="space-y-6 sm:space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-[#355E3B]">
                <UserPlus size={20} />
                <h2 className="font-bold uppercase tracking-tight text-lg">{isEditing ? "Update Bio" : "Add Bio"}</h2>
              </div>
              {isEditing && (
                <button 
                  onClick={() => { setIsEditing(false); setEditingId(null); setJudgeForm({name: "", title: "", description: ""}); }} 
                  className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleJudgeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
                <input 
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-[#355E3B] focus:bg-white transition-all" 
                  placeholder="Hon. Justice..." value={judgeForm.name} 
                  onChange={(e) => setJudgeForm({...judgeForm, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Title / Designation</label>
                <input 
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-[#355E3B] focus:bg-white transition-all" 
                  placeholder="Judge of the High Court" value={judgeForm.title} 
                  onChange={(e) => setJudgeForm({...judgeForm, title: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Profile Biography</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm h-32 outline-none border border-transparent focus:border-[#355E3B] focus:bg-white transition-all resize-none" 
                  placeholder="Enter biography details..." value={judgeForm.description} 
                  onChange={(e) => setJudgeForm({...judgeForm, description: e.target.value})} 
                />
              </div>
              <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Profile Portrait</label>
                <input type="file" accept="image/*" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#355E3B] file:text-white" onChange={(e) => setJudgeFile(e.target.files?.[0] || null)} />
              </div>
              <button disabled={bioLoading} className="w-full py-4 bg-[#355E3B] text-white rounded-2xl font-bold uppercase text-[10px] flex justify-center items-center gap-2 hover:bg-[#2a4a2e] transition-colors shadow-lg shadow-[#355E3B]/20">
                {bioLoading ? <Loader2 className="animate-spin" size={16} /> : isEditing ? "Update Profile" : "Save Profile"}
              </button>
            </form>
          </div>

          <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl">
            <h3 className="text-white/40 text-[10px] font-black uppercase mb-6 tracking-[0.2em]">Saved Profiles</h3>
            <div className="space-y-3">
              {judges.length === 0 && <p className="text-white/20 text-xs italic text-center py-4">No records found</p>}
              {judges.map(judge => (
                <div key={judge._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                      <img src={judge.imageUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <p className="text-xs text-white font-bold">{judge.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{judge.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditingId(judge._id);
                        setJudgeForm({ name: judge.name, title: judge.title, description: judge.description });
                      }}
                      className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => dispatch(deleteCeremonyItem({ type: "judges", id: judge._id }))} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT: PRESENTATIONS & ACCESS TIMER */}
        <section className="space-y-6 sm:space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => setUploadType("PRESENTATION")}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${uploadType === "PRESENTATION" ? "bg-white shadow-md text-slate-900" : "text-slate-500"}`}
                >
                  Materials
                </button>
                <button 
                  onClick={() => setUploadType("TIMER")}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${uploadType === "TIMER" ? "bg-white shadow-md text-slate-900" : "text-slate-500"}`}
                >
                  Access Timer
                </button>
            </div>

            {uploadType === "PRESENTATION" ? (
              <form onSubmit={handlePresentationSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Document Title</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-[#C5A059] focus:bg-white transition-all" 
                    placeholder="e.g. Judicial Ethics Keynote" value={presTitle} onChange={(e) => setPresTitle(e.target.value)} 
                  />
                </div>
                <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-3 mb-1">
                    <FileText className="text-slate-400" size={18} />
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Attach File (Max 55MB)</label>
                  </div>
                  <input id="presFileInput" type="file" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#C5A059] file:text-white" onChange={(e) => setPresFile(e.target.files?.[0] || null)} />
                </div>
                <button disabled={presUploading} className="w-full py-4 bg-[#C5A059] text-white rounded-2xl font-bold uppercase text-[10px] flex justify-center items-center gap-2 hover:bg-[#b08e4d] transition-colors shadow-lg shadow-[#C5A059]/20">
                  {presUploading ? <><Loader2 className="animate-spin" size={16} /> Uploading Document...</> : "Upload Material"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleTimerUpdate} className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Content Lock</span>
                    <button 
                      type="button"
                      onClick={toggleMasterLock}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold uppercase transition-all shadow-sm ${program?.isLocked ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}
                    >
                      {program?.isLocked ? <><Lock size={12}/> Content Hidden</> : <><Unlock size={12}/> Content Visible</>}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    The master lock overrides the countdown. Content will remain hidden until set to "Visible".
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Automatic Release Schedule</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="datetime-local" 
                      className="w-full p-4 pl-12 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-[#C5A059] transition-all"
                      value={releaseDateTime} 
                      onChange={(e) => setReleaseDateTime(e.target.value)} 
                    />
                  </div>
                </div>

                <button disabled={programLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all">
                  {programLoading ? <Loader2 className="animate-spin" size={16} /> : <><Clock size={16}/> Save Schedule</>}
                </button>
              </form>
            )}
          </div>

          {/* ASSET LISTS */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl">
            <h3 className="text-slate-500 text-[10px] font-black uppercase mb-6 tracking-[0.2em]">Deployment Status</h3>
            <div className="space-y-3">
              {uploadType === "PRESENTATION" ? (
                presentations.length > 0 ? (
                  presentations.map((p: Presentation) => (
                    <div key={p._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 group">
                      <div className="flex flex-col min-w-0">
                        <p className="text-xs text-white font-bold truncate">{p.title}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black truncate">
                          {p.fileName} <span className="mx-1 opacity-30">•</span> {formatFileSize(p.fileSize || 0)}
                        </p>
                      </div>
                      <button 
                        onClick={() => dispatch(deletePresentation(p._id))} 
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        disabled={presDeletingId === p._id}
                      >
                        {presDeletingId === p._id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-white/20 text-xs italic text-center py-4">No materials currently deployed</p>
                )
              ) : (
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] text-[#C5A059] font-black uppercase tracking-widest">Reveal Target</p>
                      <p className="text-sm text-white font-serif italic">
                        {program?.scheduledRelease 
                          ? new Date(program.scheduledRelease).toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })
                          : "No countdown scheduled"}
                      </p>
                    </div>
                    <Clock className="text-white/10" size={32} />
                  </div>
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