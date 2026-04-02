import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Trash2, UserPlus, Loader2, CheckCircle2,
  AlertCircle, Edit3, X, FileText, Users,
  Settings2, CheckSquare
} from "lucide-react";

// Judge Actions
import {
  fetchAdminDashboard,
  addJudgeBio,
  updateJudgeBio,
  deleteCeremonyItem,
  resetCeremonyStatus,
} from "../../store/slices/swearingPreferenceSlice";

// Presentation Actions
import {
  fetchPresentationsForAdmin,
  uploadPresentation,
  deletePresentation,
  updatePresentationsBulk, // NEW
  resetPresentationStatus,
  type PresentationRole
} from "../../store/slices/presentationSlice";

import type { AppDispatch, RootState } from "../../store/store";

const AdminCeremony = () => {
  const dispatch = useDispatch<AppDispatch>();

  // --- SELECTORS ---
  const {
    judges,
    loading: judgeLoading,
    success: judgeSuccess,
    error: judgeError,
  } = useSelector((state: RootState) => state.ceremony);

  const {
    items: presentations,
    uploading: presUploading,
    deleting: presDeletingId,
    success: presSuccess,
    error: presError,
    loading: presLoading
  } = useSelector((state: RootState) => state.presentations);

  // --- NEW: BULK SELECTION STATE ---
  const [selectedPresIds, setSelectedPresIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // --- JUDGE FORM STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [judgeForm, setJudgeForm] = useState({
    name: "",
    title: "",
    description: "",
    audience: "judge",
  });
  const [judgeFile, setJudgeFile] = useState<File | null>(null);

  // --- PRESENTATION FORM STATE ---
  const [presTitle, setPresTitle] = useState("");
  const [presAudience, setPresAudience] = useState<PresentationRole>("all");
  const [presFile, setPresFile] = useState<File | null>(null);

  // --- INITIAL FETCH ---
  useEffect(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchPresentationsForAdmin());
  }, [dispatch]);

  // --- STATUS CLEANUP ---
  useEffect(() => {
    if (judgeSuccess || judgeError || presSuccess || presError) {
      const timer = setTimeout(() => {
        dispatch(resetCeremonyStatus());
        dispatch(resetPresentationStatus());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [judgeSuccess, judgeError, presSuccess, presError, dispatch]);

  // --- BULK HANDLERS ---
  const togglePresSelection = (id: string) => {
    setSelectedPresIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAudienceUpdate = async (role: PresentationRole) => {
    if (selectedPresIds.length === 0) return;
    setIsBulkUpdating(true);
    // Backend expects an array for targetAudience
    await dispatch(updatePresentationsBulk({ 
      ids: selectedPresIds, 
      targetAudience: [role] 
    }));
    setIsBulkUpdating(false);
    setSelectedPresIds([]);
  };

  // --- JUDGE HANDLERS ---
  const handleJudgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", judgeForm.name);
    formData.append("title", judgeForm.title);
    formData.append("description", judgeForm.description);
    formData.append("targetAudience", JSON.stringify([judgeForm.audience]));
    
    if (judgeFile) formData.append("image", judgeFile);
    if (isEditing && editingId) {
      dispatch(updateJudgeBio({ judgeId: editingId, formData }));
      setIsEditing(false);
      setEditingId(null);
    } else {
      if (!judgeFile) return alert("Please select an image");
      dispatch(addJudgeBio(formData));
    }
    setJudgeForm({ name: "", title: "", description: "", audience: "judge" });
    setJudgeFile(null);
  };

  const handleEditJudge = (judge: any) => {
    setIsEditing(true);
    setEditingId(judge._id);
    setJudgeForm({
      name: judge.name,
      title: judge.title,
      description: judge.description,
      audience: judge.targetAudience?.[0] || "all",
    });
  };

  // --- PRESENTATION HANDLERS ---
  const handlePresentationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presFile) return alert("Please select a file");
    if (!presTitle.trim()) return alert("Please enter a title");

    const formData = new FormData();
    formData.append("title", presTitle.trim());
    formData.append("file", presFile);
    formData.append("targetAudience", JSON.stringify([presAudience]));

    dispatch(uploadPresentation(formData)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setPresTitle("");
        setPresFile(null);
        setPresAudience("all");
        const fileInput = document.getElementById("presFileInput") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    });
  };

  const formatDate = (iso: string) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("en-KE", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 sm:space-y-12 pb-32 animate-in fade-in duration-700">
      
      {/* BULK ACTION BAR (PRESENTATIONS) */}
      {selectedPresIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 animate-in slide-in-from-bottom-8">
          <div className="flex items-center gap-3 border-r border-white/20 pr-6">
            <Settings2 size={18} className="text-[#C5A059]" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {selectedPresIds.length} Assets Selected
            </span>
          </div>
          <div className="flex gap-2">
            {(["all", "judge", "dr"] as const).map((role) => (
              <button
                key={role}
                disabled={isBulkUpdating}
                onClick={() => handleBulkAudienceUpdate(role)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#C5A059] transition-colors text-[9px] font-black uppercase tracking-wider"
              >
                Set {role}
              </button>
            ))}
          </div>
          <button onClick={() => setSelectedPresIds([])} className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1a1a1a] uppercase tracking-tight">
            Conference Materials
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Admin Management Portal
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
          {(judgeSuccess || presSuccess) && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-emerald-100 shadow-sm animate-bounce">
              <CheckCircle2 size={14} /> Operation Successful
            </div>
          )}
          {(judgeError || presError) && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-red-100 shadow-sm">
              <AlertCircle size={14} /> {judgeError || presError}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        {/* LEFT: JUDICIAL BIOGRAPHIES */}
        <section className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-[#355E3B]">
                <UserPlus size={20} />
                <h2 className="font-bold uppercase tracking-tight text-lg">
                  {isEditing ? "Modify Profile" : "New Biography"}
                </h2>
              </div>
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="text-red-500 p-2 hover:bg-red-50 rounded-full">
                  <X size={18} />
                </button>
              )}
            </div>
            <form onSubmit={handleJudgeSubmit} className="space-y-4">
              <input
                required
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-[#355E3B]"
                placeholder="Full Name"
                value={judgeForm.name}
                onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })}
              />
              <input
                required
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-[#355E3B]"
                placeholder="Title / Designation"
                value={judgeForm.title}
                onChange={(e) => setJudgeForm({ ...judgeForm, title: e.target.value })}
              />
              <textarea
                required
                className="w-full p-4 bg-slate-50 rounded-2xl text-sm h-32 outline-none border border-transparent focus:border-[#355E3B] resize-none"
                placeholder="Biography..."
                value={judgeForm.description}
                onChange={(e) => setJudgeForm({ ...judgeForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Portrait</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs"
                    onChange={(e) => setJudgeFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visibility</label>
                  <select
                    value={judgeForm.audience}
                    onChange={(e) => setJudgeForm({ ...judgeForm, audience: e.target.value })}
                    className="bg-transparent text-[10px] font-bold uppercase text-[#355E3B]"
                  >
                    <option value="all">All</option>
                    <option value="judge">Judges Only</option>
                    <option value="dr">DRs Only</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={judgeLoading}
                className="w-full py-4 bg-[#355E3B] text-white rounded-2xl font-bold uppercase text-[10px] flex justify-center items-center gap-2"
              >
                {judgeLoading ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? "Update" : "Save Profile")}
              </button>
            </form>
          </div>

          <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-[2rem] shadow-xl">
            <h3 className="text-white/40 text-[10px] font-black uppercase mb-6 tracking-widest">Registry: Judges</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {judges.map((judge) => (
                <div key={judge._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 group">
                  <div className="flex items-center gap-4">
                    <img src={judge.imageUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
                    <div className="min-w-0">
                      <p className="text-xs text-white font-bold truncate">{judge.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{judge.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditJudge(judge)} className="p-2 text-slate-500 hover:text-white"><Edit3 size={16} /></button>
                    <button 
                       onClick={() => dispatch(deleteCeremonyItem({ type: "judges", id: judge._id }))}
                       className="p-2 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT: PRESENTATIONS */}
        <section className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h2 className="font-bold uppercase tracking-tight text-lg text-[#C5A059] mb-8">
              Document Deployment
            </h2>
            <form onSubmit={handlePresentationSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Asset Name</label>
                <input
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-[#C5A059]"
                  placeholder="Keynote Presentation..."
                  value={presTitle}
                  onChange={(e) => setPresTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-3 mb-1">
                    <FileText className="text-slate-400" size={18} />
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">File Source</label>
                  </div>
                  <input
                    id="presFileInput"
                    type="file"
                    className="text-xs"
                    onChange={(e) => setPresFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex flex-col gap-2 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-3 mb-1">
                    <Users className="text-slate-400" size={18} />
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Permissions</label>
                  </div>
                  <select
                    className="w-full bg-transparent text-[10px] font-black uppercase outline-none text-[#C5A059]"
                    value={presAudience}
                    onChange={(e) => setPresAudience(e.target.value as PresentationRole)}
                  >
                    <option value="all">All (Public)</option>
                    <option value="judge">Judges</option>
                    <option value="dr">Deputy Registrar (DR)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={presUploading}
                className="w-full py-4 bg-[#C5A059] text-white rounded-2xl font-bold uppercase text-[10px] flex justify-center items-center gap-2 hover:shadow-xl transition-all disabled:opacity-50"
              >
                {presUploading ? <Loader2 className="animate-spin" size={16} /> : "Deploy Asset"}
              </button>
            </form>
          </div>

          <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-xl overflow-hidden relative">
            <h3 className="text-slate-500 text-[10px] font-black uppercase mb-6 tracking-[0.2em]">Live Assets</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {presLoading ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white/20" /></div>
              ) : presentations.length === 0 ? (
                <div className="text-white/20 text-xs italic text-center py-8">No Assets Deployed</div>
              ) : presentations.map((p) => {
                const isSelected = selectedPresIds.includes(p._id);
                return (
                  <div 
                    key={p._id} 
                    onClick={() => togglePresSelection(p._id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? "bg-[#C5A059]/10 border-[#C5A059] ring-1 ring-[#C5A059]" 
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-2 rounded-xl transition-colors ${isSelected ? "bg-[#C5A059] text-white" : "bg-white/5 text-slate-400"}`}>
                        {isSelected ? <CheckSquare size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-white font-bold truncate">{p.title}</p>
                          <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase ${
                            p.targetAudience?.includes('all') ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {p.targetAudience?.[0] || "all"}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mt-1">
                          {p.mimeType?.split('/')[1] || 'FILE'} <span className="mx-1">•</span> {formatDate(p.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selection when deleting
                        dispatch(deletePresentation(p._id));
                      }}
                      disabled={presDeletingId === p._id}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                    >
                      {presDeletingId === p._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminCeremony;