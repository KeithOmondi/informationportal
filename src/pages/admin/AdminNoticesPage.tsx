import { useEffect, useState } from "react";
import { 
  Plus, 
  Trash2,  
  X, 
  Loader2,
  Megaphone,
  Paperclip,
  Users
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNotices,
  createNotice,
  deleteNotice,
  type TargetAudience,
  type NoticePriority
} from "../../store/slices/noticeSlice";

type NoticeCategory = "NOTICE" | "CIRCULAR" | "MEMO" | "URGENT";

const AdminNoticesPage = () => {
  const dispatch = useAppDispatch();
  const { notices, loading } = useAppSelector((state) => state.notices);

  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    payload.append("type", form.type);
    payload.append("targetAudience", form.targetAudience);
    payload.append("priority", form.priority);
    if (form.expiryDate) payload.append("expiryDate", form.expiryDate);
    selectedFiles.forEach((file) => payload.append("attachments", file));

    await dispatch(createNotice(payload));
    setOpen(false);
    resetForm();
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
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently remove this registry notice?")) {
      dispatch(deleteNotice(id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-700 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6 gap-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#355E3B]">ORHC Communications</h1>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#355E3B] text-white px-6 py-3.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4a2e] transition-all shadow-lg shadow-[#355E3B]/20"
        >
          <Plus size={16} />
          Create Communication
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white md:border md:border-slate-200 md:rounded-sm overflow-hidden md:shadow-sm">
        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Notice & Audience</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stats</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && notices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <Loader2 className="animate-spin text-[#355E3B] mx-auto" size={24} />
                  </td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${n.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Megaphone size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{n.title}</h3>
                          <p className="text-[10px] font-bold text-[#C5A059] uppercase">Target: {n.targetAudience}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                        n.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[#355E3B]/5 text-[#355E3B] border-[#355E3B]/10'
                      }`}>
                        {n.priority}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center gap-6 text-slate-400 text-[10px] font-black uppercase">
                        <span className="flex flex-col items-center">
                          <span className="text-slate-800 text-xs">{n.stats?.views || 0}</span>
                          <span>Views</span>
                        </span>
                        <span className="flex flex-col items-center">
                          <span className="text-slate-800 text-xs">{n.stats?.downloads || 0}</span>
                          <span>Clicks</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => handleDelete(n._id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View - Only Visible on Mobile */}
        <div className="md:hidden space-y-4">
          {loading && notices.length === 0 ? (
             <div className="py-10 text-center"><Loader2 className="animate-spin text-[#355E3B] mx-auto" size={24} /></div>
          ) : (
            notices.map((n) => (
              <div key={n._id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-lg ${n.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Megaphone size={18} />
                  </div>
                  <button onClick={() => handleDelete(n._id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{n.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
                    <Users size={12} /> Target: {n.targetAudience}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                   <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                        n.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-[#355E3B]/5 text-[#355E3B] border-[#355E3B]/10'
                    }`}>{n.priority}</span>
                   <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase">
                     <span>{n.stats?.views || 0} Views</span>
                     <span>{n.stats?.downloads || 0} Clicks</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          
          <div className="relative bg-white w-full max-w-2xl rounded-t-2xl md:rounded-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
            <div className="p-6 md:p-10 space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#355E3B]">New Communication</h2>
                <button onClick={() => setOpen(false)} className="text-slate-400 p-2"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brief Title</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#355E3B] transition-all"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content / Instructions</label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#355E3B] transition-all"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm outline-none appearance-none"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as NoticeCategory })}
                  >
                    <option value="NOTICE">Notice</option>
                    <option value="CIRCULAR">Circular</option>
                    <option value="MEMO">Memo</option>
                    <option value="URGENT">Urgent Brief</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm outline-none appearance-none"
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value as TargetAudience })}
                  >
                    <option value="ALL">All Personnel</option>
                    <option value="JUDGES">Judges Only</option>
                    <option value="REGISTRY">Registry Staff</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attachments</label>
                  <label className="flex flex-col items-center justify-center w-full h-28 md:h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center px-4 text-center">
                      <Paperclip className="w-6 h-6 mb-2 text-slate-400" />
                      <p className="text-xs text-slate-500 font-bold">Tap to upload files</p>
                      <p className="text-[9px] text-slate-400 uppercase mt-1">{selectedFiles.length} files selected</p>
                    </div>
                    <input type="file" className="hidden" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry (Optional)</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm outline-none"
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div 
                    onClick={() => setForm({ ...form, priority: form.priority === "URGENT" ? "NORMAL" : "URGENT" })}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className={`w-10 h-6 rounded-full transition-all relative ${form.priority === "URGENT" ? 'bg-red-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all ${form.priority === "URGENT" ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Urgent</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full md:flex-1 px-6 py-4 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.title || !form.description}
                  className="w-full md:flex-1 px-6 py-4 bg-[#355E3B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4a2e] disabled:opacity-50 transition-all"
                >
                  Publish Communication
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