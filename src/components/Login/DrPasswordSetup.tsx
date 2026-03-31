import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Scale,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setupPassword, logoutUser } from "../../store/slices/adminAuthSlice";
import toast from "react-hot-toast";

const DrPasswordSetup = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tempUserId, loading } = useAppSelector((state) => state.auth);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (!tempUserId) {
      toast.error("Session expired. Please login again.");
      dispatch(logoutUser(false));
      navigate("/login");
      return;
    }

    const toastId = toast.loading("Updating secure credentials...");

    try {
      // 1. Finalize password setup on server
      await dispatch(
        setupPassword({ userId: tempUserId, newPassword: password }),
      ).unwrap();

      toast.success("Security Setup Complete. Please login.", { id: toastId });

      // 2. Clear the temporary session and force a fresh login
      await dispatch(logoutUser(false)).unwrap();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err || "Failed to set password", { id: toastId });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex items-center justify-center relative fixed inset-0">
      {/* Brand Borders */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#355E3B] z-50" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-[#C5A059] z-50" />

      {/* Background Decorative Icon */}
      <Scale
        className="absolute -right-24 -bottom-24 text-slate-200/50 rotate-[-15deg] pointer-events-none"
        size={400}
      />

      <div className="w-full max-w-md px-6 z-10">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 text-[#C5A059] mb-4">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
              Action Required
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#355E3B] leading-tight">
            PASSWORD RESET
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059]" />

          <div className="mb-8 text-center">
            <p className="text-xs text-slate-500 italic">
              "Your account was created with a temporary email and password. Kindly
              reset your password to proceed."
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                New Password
              </label>
              <div className="relative mt-1.5 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#355E3B] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-12 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Confirm password
              </label>
              <div className="relative mt-1.5 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#355E3B] transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#355E3B] hover:bg-[#2a4b2f] active:scale-[0.99] disabled:opacity-70 text-white font-black text-[11px] uppercase tracking-[0.25em] py-4 rounded-xl transition-all shadow-lg shadow-[#355E3B]/20 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    reset password<ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  dispatch(logoutUser(false));
                  navigate("/login");
                }}
                className="w-full mt-4 text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors py-2"
              >
                Cancel & Return to Login
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          Office of thr Registrar High Court &copy; 2026
        </p>
      </div>
    </div>
  );
};

export default DrPasswordSetup;
