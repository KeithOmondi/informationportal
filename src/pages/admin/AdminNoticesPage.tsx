import { useEffect, useState } from "react";
import { 
  Plus, 
  Trash2,  
  X, 
  Loader2,
  Megaphone,
  Paperclip,
  CheckCircle2,
  AlertTriangle
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
  const { notices, loading, uploading, error } = useAppSelector((state) => state.notices);

  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("targetAudience", form.targetAudience);
    payload.append("priority", form.priority);
    
    if (form.expiryDate) payload.append("expiryDate", form.expiryDate);
    
    // Append multiple files for the array.isArray(req.files) check in the controller
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
    setSelectedFiles([]);
    dispatch(clearNoticeError());
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently remove this registry notice? This action cannot be undone.")) {
      dispatch(deleteNotice(id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-700 font-sans">
      
      {/* SUCCESS NOTIFICATION */}
      {successMsg && (
        <div className="fixed top-10 right-10 z-[100] bg-[#355E3B] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-500">
          <CheckCircle2 size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Communication Published Successfully</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-[#355E3B] mb-2">ORHC Registry Admin</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C5A059]">Internal Communication Management System</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#355E3B] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2a4a2e] transition-all shadow-xl shadow-[#355E3B]/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          New Communication
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Content & Audience</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Engagement</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && notices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin text-[#355E3B] mx-auto mb-4" size={32} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Records...</span>
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
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-tighter">Target: {n.targetAudience}</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">• Published: {new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
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
                    <td className="px-8 py-7">
                      <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest">
                        <div className="text-center">
                          <p className="text-slate-800 text-sm">{n.stats?.views || 0}</p>
                          <p className="text-slate-400">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-800 text-sm">{n.stats?.downloads || 0}</p>
                          <p className="text-slate-400">Clicks</p>
                        </div>
                      </div>
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
          
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {uploading && (
              <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#355E3B]" size={40} />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#355E3B]">Encrypting & Uploading...</p>
              </div>
            )}

            <div className="p-8 md:p-12 space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-black text-[#355E3B]">New Communication</h2>
                {!uploading && <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600">
                  <AlertTriangle size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication Title</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#355E3B] focus:ring-4 focus:ring-[#355E3B]/5 transition-all"
                    placeholder="e.g. JUDICIAL CIRCULAR NO. 4 OF 2026"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brief Description</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-[#355E3B] focus:ring-4 focus:ring-[#355E3B]/5 transition-all"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none cursor-pointer"
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value as TargetAudience })}
                  >
                    <option value="ALL">All Personnel</option>
                    <option value="JUDGES">Judicial Officers</option>
                    <option value="REGISTRY">Registry Staff</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Level</label>
                  <div className="flex gap-2">
                    {["NORMAL", "URGENT"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm({ ...form, priority: p as NoticePriority })}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          form.priority === p 
                            ? (p === 'URGENT' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200' : 'bg-[#355E3B] border-[#355E3B] text-white shadow-lg shadow-green-200')
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF Attachments</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group">
                    <div className="flex flex-col items-center justify-center px-4 text-center">
                      <Paperclip className={`w-8 h-8 mb-2 ${selectedFiles.length > 0 ? 'text-[#355E3B]' : 'text-slate-300'} group-hover:scale-110 transition-transform`} />
                      <p className="text-xs text-slate-500 font-black uppercase tracking-widest">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} Documents Selected` : 'Click to scan & upload'}
                      </p>
                    </div>
                    <input type="file" className="hidden" multiple accept="application/pdf" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreate}
                  disabled={!form.title || !form.description || uploading}
                  className="w-full px-8 py-5 bg-[#355E3B] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#2a4a2e] disabled:opacity-30 transition-all shadow-xl shadow-[#355E3B]/20"
                >
                  Confirm & Publish
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