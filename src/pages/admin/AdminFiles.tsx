import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFiles, uploadFile, deleteFile } from "../../store/slices/filesSlice";
import type { AppDispatch, RootState } from "../../store/store";

const AdminFiles = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { files, loading, error } = useSelector((state: RootState) => state.files);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load files on mount
  useEffect(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select a file first");
    
    await dispatch(uploadFile(selectedFile));
    setSelectedFile(null); // Reset input
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      dispatch(deleteFile(id));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin File Management</h2>

      {/* Upload Section */}
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <input type="file" onChange={handleFileChange} className="mb-2 block" />
        <button
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : "Upload to Cloudinary"}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Files List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file._id} className="border rounded p-4 shadow-sm relative">
            <img
              src={file.url}
              alt={file.originalName}
              className="w-full h-40 object-cover rounded mb-2"
            />
            <p className="text-sm font-medium truncate">{file.originalName}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            
            <div className="flex gap-2 mt-3">
              <a
                href={`/api/files/${file._id}/view`}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-gray-200 px-2 py-1 rounded"
              >
                View
              </a>
              <button
                onClick={() => handleDelete(file._id)}
                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFiles;