import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Trash2, UserPlus, Loader2, CheckCircle2,
  AlertCircle, Edit3, X, Lock, Unlock, Calendar, Clock
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
  const { items: presentations, loading: presLoading, success: presSuccess, error: presError } = useSelector(
    (state: RootState) => state.presentations
  );

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
      // Format: YYYY-MM-DDTHH:mm
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
      }, 4000);
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
    const formData = new FormData();
    formData.append("title", presTitle);
    formData.append("file", presFile); 
    dispatch(uploadPresentation(formData));
    setPresTitle("");
    setPresFile(null);
  };

  const handleTimerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!program?._id) return;
    
    // Send as JSON since we aren't uploading files for the program anymore
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

  const formatFileSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + " MB";
  const isGlobalLoading = bioLoading || programLoading || presLoading;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1a1a1a]">ADMINISTRATION</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Judiciary Materials & Access Control
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {(bioSuccess || presSuccess || programSuccess) && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-[10px] font-black uppercase">
              <CheckCircle2 size={14} /> Action Successful
            </div>
          )}
          {(bioError || programError || presError) && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full text-[10px] font-black uppercase">
              <AlertCircle size={14} /> System Error
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
                <h2 className="font-bold uppercase tracking-tighter text-lg">{isEditing ? "Update Bio" : "Add Bio"}</h2>
              </div>
              {isEditing && (
                <button 
                  onClick={() => { setIsEditing(false); setEditingId(null); setJudgeForm({name: "", title: "", description: ""}); }} 
                  className="text-red-500 text-[10px] font-bold uppercase"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <form onSubmit={handleJudgeSubmit} className="space-y-4">
              <input 
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none" 
                placeholder="Full Name" value={judgeForm.name} 
                onChange={(e) => setJudgeForm({...judgeForm, name: e.target.value})} 
              />
              <input 
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none" 
                placeholder="Title" value={judgeForm.title} 
                onChange={(e) => setJudgeForm({...judgeForm, title: e.target.value})} 
              />
              <textarea 
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm h-32 outline-none" 
                placeholder="Description" value={judgeForm.description} 
                onChange={(e) => setJudgeForm({...judgeForm, description: e.target.value})} 
              />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Profile Image</label>
                <input type="file" className="text-xs" onChange={(e) => setJudgeFile(e.target.files?.[0] || null)} />
              </div>
              <button disabled={isGlobalLoading} className="w-full py-4 bg-[#355E3B] text-white rounded-2xl font-bold uppercase text-[10px]">
                {bioLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : isEditing ? "Update Profile" : "Save Profile"}
              </button>
            </form>
          </div>

          <div className="bg-[#1a1a1a] p-6 rounded-[2.5rem]">
            <h3 className="text-white/40 text-[10px] font-black uppercase mb-4">Saved Profiles</h3>
            <div className="space-y-3">
              {judges.map(judge => (
                <div key={judge._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <img src={judge.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div>
                      <p className="text-xs text-white font-bold">{judge.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{judge.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditingId(judge._id);
                        setJudgeForm({ name: judge.name, title: judge.title, description: judge.description });
                      }}
                      className="text-slate-500 hover:text-white"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => dispatch(deleteCeremonyItem({ type: "judges", id: judge._id }))} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT: PRESENTATIONS & ACCESS TIMER */}
        <section className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
               <button 
                onClick={() => setUploadType("PRESENTATION")}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${uploadType === "PRESENTATION" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
               >
                Materials
               </button>
               <button 
                onClick={() => setUploadType("TIMER")}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${uploadType === "TIMER" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
               >
                Access Timer
               </button>
            </div>

            {uploadType === "PRESENTATION" ? (
              <form onSubmit={handlePresentationSubmit} className="space-y-4">
                <input 
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none" 
                  placeholder="Material Title" value={presTitle} onChange={(e) => setPresTitle(e.target.value)} 
                />
                <input type="file" className="text-xs" onChange={(e) => setPresFile(e.target.files?.[0] || null)} />
                <button disabled={isGlobalLoading} className="w-full py-4 bg-[#C5A059] text-white rounded-2xl font-bold uppercase text-[10px]">
                  {presLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Upload Asset"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleTimerUpdate} className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Security Lock</span>
                    <button 
                      type="button"
                      onClick={toggleMasterLock}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-bold uppercase transition-all ${program?.isLocked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                    >
                      {program?.isLocked ? <><Lock size={12}/> Locked</> : <><Unlock size={12}/> Open</>}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    When locked, the program content is hidden regardless of the timer below.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Scheduled Reveal Date & Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="datetime-local" 
                      className="w-full p-4 pl-12 bg-slate-50 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-[#C5A059] transition-all"
                      value={releaseDateTime} 
                      onChange={(e) => setReleaseDateTime(e.target.value)} 
                    />
                  </div>
                </div>

                <button disabled={isGlobalLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] flex items-center justify-center gap-2">
                  {programLoading ? <Loader2 className="animate-spin" size={16} /> : <><Clock size={16}/> Sync Countdown</>}
                </button>
              </form>
            )}
          </div>

          {/* ASSET LISTS */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem]">
            <h3 className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-widest">Live Status</h3>
            <div className="space-y-3">
              {uploadType === "PRESENTATION" ? (
                presentations.map((p: Presentation) => (
                  <div key={p._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex flex-col">
                      <p className="text-xs text-white font-bold">{p.title}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{p.mimeType} • {formatFileSize(p.fileSize)}</p>
                    </div>
                    <button onClick={() => dispatch(deletePresentation(p._id))} className="text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#C5A059] font-bold uppercase tracking-tighter">Current Target</p>
                      <p className="text-sm text-white font-serif mt-1">
                        {program?.scheduledRelease 
                          ? new Date(program.scheduledRelease).toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })
                          : "No Target Set"}
                      </p>
                    </div>
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