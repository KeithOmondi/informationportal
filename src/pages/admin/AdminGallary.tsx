import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchGalleryAdmin,
  uploadMedia,
  deleteMedia,
  clearGalleryError,
} from "../../store/slices/gallerySlice";
import { 
  Upload, 
  Trash2,  
  Loader2, 
  AlignLeft,
  FilePlus,
  X,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminGallery = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.gallery);

  // State for multiple files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);
  const [description, setDescription] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return toast.error("Please select at least one file");

    const formData = new FormData();
    // Append all files to the "files" field
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("description", description.trim());

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
            <span className="text-[#355E3B]">GALLERY</span>
          </h1>
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
                <p className="text-[9px] text-slate-300 mt-1">Up to 40 images or videos</p>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} accept="image/*,video/*" />
              </div>

              {/* Previews Scroll Area */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {previews.map((prev, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      {prev.type.startsWith("video") ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <Play size={12} className="text-white fill-white" />
                        </div>
                      ) : (
                        <img src={prev.url} className="w-full h-full object-cover" />
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

              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-300"><AlignLeft size={16}/></span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#355E3B]/20 transition-all resize-none"
                  placeholder="You can upload upto 40 images and videos..."
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
            {filteredItems.map((item) => (
              <div key={item._id} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="relative aspect-square bg-slate-900">
                  {item.resourceType === "video" ? (
                    <video className="absolute inset-0 w-full h-full object-cover opacity-60" src={item.url} />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" />
                  )}

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="absolute bottom-3 left-3">
                    <span className="text-[8px] font-black uppercase px-2 py-1 rounded bg-black/50 text-white backdrop-blur-sm">
                      {item.resourceType}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-slate-500 text-[11px] line-clamp-2 italic mb-3">
                    "{item.description || "No metadata provided."}"
                  </p>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="text-[#355E3B]">{item.uploadedBy?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminGallery;