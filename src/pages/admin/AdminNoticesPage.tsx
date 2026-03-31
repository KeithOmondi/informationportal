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
  AlertCircle,
  PencilLine,
  Calendar,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  clearNoticeError,
  type TargetAudience,
  type NoticePriority,
  type INotice,
} from "../../store/slices/noticeSlice";

const AdminNoticesPage = () => {
  const dispatch = useAppDispatch();
  const { notices, loading, uploading, error } = useAppSelector((state) => state.notices);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAudience: "ALL" as TargetAudience,
    priority: "NORMAL" as NoticePriority,
    expiryDate: "",
  });

  useEffect(() => {
    dispatch(fetchNotices(undefined));
  }, [dispatch]);

  useEffect(() => {
    return () => previews.forEach((url) => url && URL.revokeObjectURL(url));
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
      );
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    if (previews[index]) URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      targetAudience: "ALL",
      priority: "NORMAL",
      expiryDate: "",
    });
    previews.forEach((url) => url && URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
    setIsPreview(false);
    setEditId(null);
    dispatch(clearNoticeError());
  };

  const handleEditClick = (notice: INotice) => {
    setEditId(notice._id);
    setForm({
      title: notice.title,
      description: notice.description,
      targetAudience: notice.targetAudience,
      priority: notice.priority,
      expiryDate: notice.expiryDate ? notice.expiryDate.split("T")[0] : "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("targetAudience", form.targetAudience);
    payload.append("priority", form.priority);
    if (form.expiryDate) payload.append("expiryDate", form.expiryDate);
    selectedFiles.forEach((file) => payload.append("files", file));

    let result;
    if (editId) {
      result = await dispatch(updateNotice({ id: editId, formData: payload }));
    } else {
      result = await dispatch(createNotice(payload));
    }

    if (createNotice.fulfilled.match(result) || updateNotice.fulfilled.match(result)) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      setOpen(false);
      resetForm();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently remove this registry notice?")) {
      dispatch(deleteNotice(id));
    }
  };

  const renderFormattedDescription = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-600 mb-1">
            {line.trim().substring(1).trim()}
          </li>
        );
      }
      return line.trim() === "" ? <br key={i} /> : <p key={i} className="mb-2 text-slate-600 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-in fade-in duration-500 font-sans text-slate-900">
      {/* SUCCESS TOAST */}
      {successMsg && (
        <div className="fixed bottom-10 right-10 z-[100] bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 border-l-4 border-[#c2a336]">
          <CheckCircle2 size={20} className="text-[#c2a336]" />
          <p className="text-sm font-medium">Notice successfully processed</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a3a32]">Registry Communications</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-1 w-8 bg-[#c2a336] rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">High Court of Kenya</p>
          </div>
        </div>

        <button
          onClick={() => { resetForm(); setOpen(true); }}
          className="flex items-center gap-2 bg-[#1a3a32] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#122a24] transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
        >
          <Plus size={18} />
          New Communication
        </button>
      </div>

      {/* CONTENT LIST */}
      <div className="grid gap-4">
        {loading && notices.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="animate-spin text-[#c2a336] mx-auto mb-4" size={32} />
            <p className="text-slate-400 font-medium">Fetching registry records...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Megaphone className="mx-auto mb-4 text-slate-300" size={40} />
            <p className="text-slate-500 font-medium">No official notices currently listed.</p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n._id} className="group bg-white border border-slate-200 p-5 md:p-6 rounded-2xl hover:border-[#c2a336]/40 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-5 flex-1">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${n.priority === "URGENT" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-[#1a3a32]"}`}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg">{n.title}</h3>
                    {n.priority === "URGENT" && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Urgent</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(n.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} /> {n.targetAudience}</span>
                    <span className="flex items-center gap-1.5"><Eye size={14} /> {n.stats?.views || 0} reads</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center">
                <button onClick={() => handleEditClick(n)} className="p-2.5 text-slate-400 hover:text-[#1a3a32] hover:bg-slate-50 rounded-lg transition-colors">
                  <PencilLine size={18} />
                </button>
                <button onClick={() => handleDelete(n._id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !uploading && resetForm()} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-[#1a3a32]">{editId ? "Update Notice" : "Compose New Notice"}</h2>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Registry Management</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-xs font-bold border border-red-100">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="grid gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Notice Title</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1a3a32]/10 focus:border-[#1a3a32] outline-none transition-all"
                    placeholder="e.g. Annual Judicial Recess Schedule"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Message Content</label>
                    <button onClick={() => setIsPreview(!isPreview)} className="text-[11px] font-bold text-[#c2a336] hover:underline flex items-center gap-1">
                      {isPreview ? <><Edit3 size={12} /> Back to Editor</> : <><Eye size={12} /> Preview Formatting</>}
                    </button>
                  </div>
                  {isPreview ? (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 min-h-[150px] max-h-[300px] overflow-y-auto prose prose-sm">
                      {form.description ? renderFormattedDescription(form.description) : <span className="text-slate-300 italic text-sm">No content provided...</span>}
                    </div>
                  ) : (
                    <textarea
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1a3a32]/10 focus:border-[#1a3a32] outline-none transition-all resize-none"
                      placeholder="Type your notice here. Use '-' for bullets."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Audience</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a3a32] outline-none appearance-none"
                      value={form.targetAudience}
                      onChange={(e) => setForm({ ...form, targetAudience: e.target.value as TargetAudience })}
                    >
                      <option value="ALL">Public & Staff</option>
                      <option value="JUDGES">Judges Only</option>
                      <option value="DR">Deputy Registrars</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Priority</label>
                    <div className="flex gap-2">
                      {["NORMAL", "URGENT"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm({ ...form, priority: p as NoticePriority })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                            form.priority === p 
                              ? "bg-[#1a3a32] text-white border-[#1a3a32] shadow-md shadow-emerald-900/10" 
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Attachments (Optional)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group">
                    <Paperclip className="text-slate-300 group-hover:text-[#c2a336] transition-colors mb-2" size={24} />
                    <span className="text-xs font-bold text-slate-500">Click to upload PDFs or Images</span>
                    <input type="file" className="hidden" multiple accept="application/pdf,image/*" onChange={handleFileChange} />
                  </label>

                  {selectedFiles.length > 0 && (
                    <div className="grid gap-2 mt-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {previews[idx] ? <img src={previews[idx]} className="h-8 w-8 rounded object-cover" /> : <FileText size={16} className="text-slate-400" />}
                            <span className="text-xs font-medium text-slate-600 truncate">{file.name}</span>
                          </div>
                          <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-slate-100 bg-white">
              <button
                onClick={handleSubmit}
                disabled={!form.title || !form.description || uploading}
                className="w-full py-4 bg-[#1a3a32] text-white rounded-xl text-sm font-bold hover:bg-[#122a24] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {uploading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : editId ? "Update Notice" : "Publish to Registry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoticesPage;