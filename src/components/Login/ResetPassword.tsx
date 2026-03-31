import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { Lock, ShieldAlert, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { finalizePasswordReset } from "../../store/slices/adminAuthSlice";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    if (password.length < 10) return toast.error("Password too short.");

    try {
      await dispatch(finalizePasswordReset({ token, password })).unwrap();
      toast.success("Security credentials updated.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err || "Link expired or invalid.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border-b-4 border-[#C5A059]">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-50 text-red-600 rounded-full">
            <ShieldAlert size={24} />
          </div>
        </div>
        
        <h2 className="text-xl font-serif font-bold text-center text-slate-800">Establish New Password</h2>
        <p className="text-xs text-center text-slate-500 mt-1 mb-8">Update your registry access credentials.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#C5A059]"
              placeholder="New Password (min 10 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#C5A059]"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#355E3B] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Update Credentials"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;