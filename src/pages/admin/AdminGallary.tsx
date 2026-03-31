import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchGalleryAdmin,
  uploadMedia,
  deleteMedia,
  clearGalleryError,
  updateAudienceBulk, // NEW
  type AudienceRole
} from "../../store/slices/gallerySlice";
import { 
  Upload, 
  Trash2,  
  Loader2, 
  AlignLeft,
  FilePlus,
  X,
  Play,
  Users,
  Eye,
  CheckCircle2, // NEW
  Settings2 // NEW
} from "lucide-react";
import toast from "react-hot-toast";

const AdminGallery = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.gallery);

  // Form States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState<AudienceRole>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");

  // --- NEW: Bulk Selection States ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchGalleryAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearGalleryError());
    }
  }, [error, dispatch]);

  // Handle individual selection toggle
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handle Bulk Update Action
  const handleBulkUpdateAudience = async (role: AudienceRole) => {
    if (selectedIds.length === 0) return;
    
    setIsBulkUpdating(true);
    const result = await dispatch(updateAudienceBulk({ ids: selectedIds, targetAudience: role }));
    setIsBulkUpdating(false);

    if (updateAudienceBulk.fulfilled.match(result)) {
      toast.success(`Updated ${selectedIds.length} items to ${role}`);
      setSelectedIds([]); // Clear selection after success
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 40) {
      return toast.error("Maximum 40 files allowed per upload batch");
    }
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, { url: reader.result as string, type: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setDescription("");
    setTargetAudience("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return toast.error("Please select at least one file");

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("description", description.trim());
    formData.append("targetAudience", targetAudience);

    const result = await dispatch(uploadMedia(formData));
    if (uploadMedia.fulfilled.match(result)) {
      toast.success(`${selectedFiles.length} assets successfully indexed`);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Purge this media from the registry?")) {
      const result = await dispatch(deleteMedia(id));
      if (deleteMedia.fulfilled.match(result)) toast.success("Entry deleted");
    }
  };

  const filteredItems = typeFilter === "all" 
    ? items 
    : items.filter(item => item.resourceType === typeFilter);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1A2F1F]">
            <span className="text-[#355E3B]">GALLERY</span> <span className="text-slate-400 font-sans text-sm tracking-widest font-black">ADMIN</span>
          </h1>
          {selectedIds.length > 0 && (
            <p className="text-[10px] font-black text-[#355E3B] uppercase mt-2 animate-pulse">
              {selectedIds.length} items selected for bulk action
            </p>
          )}
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {(["all", "image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                typeFilter === t ? "bg-[#355E3B] text-white" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* --- BULK ACTION BAR (Floating) --- */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 border-r border-white/20 pr-6">
            <Settings2 size={18} className="text-[#355E3B]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Update Audience:</span>
          </div>
          <div className="flex gap-2">
            {(["all", "judge", "dr"] as const).map((role) => (
              <button
                key={role}
                disabled={isBulkUpdating}
                onClick={() => handleBulkUpdateAudience(role)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-[#355E3B] transition-colors text-[9px] font-black uppercase tracking-wider disabled:opacity-50"
              >
                {role}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setSelectedIds([])}
            className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MULTI-UPLOAD PANEL */}
        <section className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 lg:sticky lg:top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#355E3B]/10 rounded-lg text-[#355E3B]">
                <FilePlus size={20} />
              </div>
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Bulk Upload</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-slate-200 rounded-2xl min-h-[120px] flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:border-[#355E3B] transition-all group"
              >
                <Upload size={24} className="text-slate-300 group-hover:text-[#355E3B] mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase">Click to select files</p>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} accept="image/*,video/*" />
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {previews.map((prev, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      {prev.type.startsWith("video") ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <Play size={12} className="text-white fill-white" />
                        </div>
                      ) : (
                        <img src={prev.url} className="w-full h-full object-cover" alt="Preview" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Target Audience Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Batch Audience</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["all", "judge", "dr"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetAudience(role)}
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                        targetAudience === role 
                          ? "bg-[#355E3B] border-[#355E3B] text-white" 
                          : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-300"><AlignLeft size={16}/></span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#355E3B]/20 transition-all resize-none"
                  placeholder="Shared description for this batch..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || selectedFiles.length === 0}
                className="w-full bg-[#355E3B] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : `Process ${selectedFiles.length} Uploads`}
              </button>
            </form>
          </div>
        </section>

        {/* REPOSITORY */}
        <section className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item._id);
              
              return (
                <div 
                  key={item._id} 
                  onClick={() => toggleSelection(item._id)}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm border transition-all cursor-pointer ${
                    isSelected ? "ring-4 ring-[#355E3B] border-transparent scale-[0.98]" : "border-slate-100 hover:shadow-md"
                  }`}
                >
                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#355E3B]/10 z-10 flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-[#355E3B] fill-white" />
                    </div>
                  )}

                  <div className="relative aspect-square bg-slate-900">
                    {item.resourceType === "video" ? (
                      <video className="absolute inset-0 w-full h-full object-cover opacity-60" src={item.url} />
                    ) : (
                      <img src={item.url} className="w-full h-full object-cover" alt={item.description} />
                    )}

                    <div className="absolute top-3 left-3 flex gap-2 z-20">
                      <span className="text-[8px] font-black uppercase px-2 py-1 rounded bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
                        {item.resourceType === "video" ? <Play size={8} /> : <Eye size={8} />} {item.resourceType}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 ${
                        item.targetAudience === 'all' ? 'bg-blue-500/50 text-white' : 'bg-amber-500/50 text-white'
                      }`}>
                        <Users size={8} /> {item.targetAudience}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Don't trigger selection
                        handleDelete(item._id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white z-20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-slate-500 text-[11px] line-clamp-2 italic mb-3">
                      "{item.description || "No metadata provided."}"
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span className="text-[#355E3B] truncate max-w-[100px]">{item.uploadedBy?.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminGallery;