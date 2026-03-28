import { useEffect, useState } from "react";
import { 
  Plus, 
  Trash2,  
  X, 
  Loader2,
  Megaphone,
  Paperclip,
  CheckCircle2,
  Eye,
  Edit3,
  FileText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNotices,
  createNotice,
  deleteNotice,
  clearNoticeError,
  type TargetAudience,
  type NoticePriority
} from "../../store/slices/noticeSlice";

type NoticeCategory = "NOTICE" | "CIRCULAR" | "MEMO" | "URGENT";

const AdminNoticesPage = () => {
  const dispatch = useAppDispatch();
  const { notices, loading, uploading } = useAppSelector((state) => state.notices);

  const [open, setOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "NOTICE" as NoticeCategory,
    targetAudience: "ALL" as TargetAudience,
    priority: "NORMAL" as NoticePriority,
    expiryDate: "",
  });

  useEffect(() => {
    dispatch(fetchNotices(undefined));
  }, [dispatch]);

  // Clean up memory leaks from object URLs
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Generate visual previews for images
      const newPreviews = newFiles.map(file => 
        file.type.startsWith('image/') ? URL.createObjectURL(file) : ""
      );
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    if (previews[index]) URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("targetAudience", form.targetAudience);
    payload.append("priority", form.priority);
    if (form.expiryDate) payload.append("expiryDate", form.expiryDate);
    
    selectedFiles.forEach((file) => {
      payload.append("files", file); 
    });

    const result = await dispatch(createNotice(payload));
    
    if (createNotice.fulfilled.match(result)) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "NOTICE",
      targetAudience: "ALL",
      priority: "NORMAL",
      expiryDate: "",
    });
    previews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
    setIsPreview(false);
    dispatch(clearNoticeError());
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently remove this registry notice? This action cannot be undone.")) {
      dispatch(deleteNotice(id));
    }
  };

  const renderFormattedDescription = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim().startsWith("-") || line.trim().startsWith("*") || line.trim().startsWith("•")) {
        return <li key={i} className="ml-4 list-disc text-slate-700">{line.trim().substring(1).trim()}</li>;
      }
      return line.trim() === "" ? <br key={i} /> : <p key={i} className="mb-2 text-slate-700">{line}</p>;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-700 font-sans">
      
      {successMsg && (
        <div className="fixed top-10 right-10 z-[100] bg-[#355E3B] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-500">
          <CheckCircle2 size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Communication Published</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-[#355E3B] mb-2">Registry Communications</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">High Court of Kenya • Admin Portal</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#355E3B] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2a4a2e] transition-all shadow-xl shadow-[#355E3B]/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          New Communication
        </button>
      </div>

      {/* CONTENT TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Notice Details</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Engagement</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && notices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin text-[#355E3B] mx-auto mb-4" size={32} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Registry...</span>
                  </td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${n.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Megaphone size={22} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 mb-1">{n.title}</h3>
                          <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-tighter">Target: {n.targetAudience}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${
                        n.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[#355E3B]/5 text-[#355E3B] border-[#355E3B]/10'
                      }`}>
                        {n.priority}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-center">
                        <p className="text-slate-800 text-sm font-black">{n.stats?.views || 0}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Views</p>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <button onClick={() => handleDelete(n._id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !uploading && setOpen(false)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
            {uploading && (
              <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#355E3B]" size={40} />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#355E3B]">Uploading Media & Data...</p>
              </div>
            )}

            <div className="p-8 md:p-10 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-black text-[#355E3B]">Compose Communication</h2>
                {!uploading && <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice Title</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#355E3B] transition-all"
                    placeholder="Enter heading..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                    <button 
                      onClick={() => setIsPreview(!isPreview)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-[#355E3B] hover:opacity-70"
                    >
                      {isPreview ? <><Edit3 size={14}/> Edit</> : <><Eye size={14}/> Preview</>}
                    </button>
                  </div>

                  {isPreview ? (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 min-h-[160px] text-sm overflow-y-auto max-h-[300px]">
                      {form.description ? renderFormattedDescription(form.description) : <span className="text-slate-300 italic">No content</span>}
                    </div>
                  ) : (
                    <textarea
                      rows={4}
                      placeholder="Use '-' for bullets..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-[#355E3B] transition-all"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audience</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                      value={form.targetAudience}
                      onChange={(e) => setForm({ ...form, targetAudience: e.target.value as TargetAudience })}
                    >
                      <option value="ALL">All Personnel</option>
                      <option value="JUDGES">Judges</option>
                      <option value="REGISTRY">Staff</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Level</label>
                    <div className="flex gap-2">
                      {["NORMAL", "URGENT"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p as NoticePriority })}
                          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            form.priority === p 
                              ? (p === 'URGENT' ? 'bg-red-500 border-red-500 text-white' : 'bg-[#355E3B] border-[#355E3B] text-white')
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* UPDATED ATTACHMENTS SECTION WITH IMAGE SUPPORT */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media & Documents</label>
                  <label className="flex items-center gap-4 w-full p-6 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group">
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <Paperclip size={20} className={selectedFiles.length > 0 ? "text-[#355E3B]" : "text-slate-300"} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-600">Attach Files</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">PDF, PNG, JPG, WEBP • MAX 10MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="application/pdf,image/png,image/jpeg,image/webp" 
                      onChange={handleFileChange} 
                    />
                  </label>

                  {/* ENHANCED FILE LIST PREVIEW */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {previews[idx] ? (
                              <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                <img src={previews[idx]} alt="preview" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-slate-200">
                                <FileText size={18} className="text-[#355E3B]" />
                              </div>
                            )}
                            <div className="flex flex-col truncate">
                              <span className="text-[11px] font-black text-slate-700 truncate">{file.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFile(idx)} 
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCreate}
                  disabled={!form.title || !form.description || uploading}
                  className="w-full px-8 py-5 bg-[#355E3B] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#2a4a2e] disabled:opacity-30 transition-all shadow-xl shadow-[#355E3B]/20"
                >
                  Publish to Registry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoticesPage;