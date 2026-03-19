import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserCircle, ArrowRight, Scale, ShieldCheck } from "lucide-react";

import type { RootState } from "../../store/store";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearError, loginUser } from "../../store/slices/adminAuthSlice";

const Login: React.FC = () => {
  const [pj, setPj] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, loading, error, isInitialized } = useAppSelector(
    (state: RootState) => state.auth
  );

  /* =====================================================
      ROLE-BASED REDIRECTION & SESSION CHECK
      If user is already logged in, skip the login screen.
  ===================================================== */
  useEffect(() => {
    // Only redirect if we have a user and initialization is finished
    if (isInitialized && user) {
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "judge":
          navigate("/judge/dashboard", { replace: true });
          break;
        case "guest":
          navigate("/guest/dashboard", { replace: true });
          break;
        default:
          navigate("/unauthorized", { replace: true });
      }
    }
  }, [user, navigate, isInitialized]);

  /* ===========================
      ERROR TOAST HANDLING
  =========================== */
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "auth-error" });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  /* ===========================
      LOGIN HANDLER
  =========================== */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pj.trim()) {
      toast.error("PJ number is required");
      return;
    }

    const toastId = toast.loading("Verifying with High Court Registry...");

    try {
      await dispatch(
        loginUser({
          pj: pj.trim(),
        })
      ).unwrap();

      toast.success("Identity Verified", { id: toastId });
    } catch (err: any) {
      // The error is already handled by the slice, but unwrap() lets us catch it here for the toast
      toast.error(err?.message || "Invalid PJ Number", { id: toastId });
    }
  };

  // Optional: Show nothing while checking if the user is already authenticated
  if (!isInitialized) return null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex items-center justify-center relative fixed inset-0">
      {/* Decorative Borders */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#355E3B] z-50" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-[#C5A059] z-50" />

      {/* Background Watermark */}
      <Scale
        className="absolute -right-24 -bottom-24 text-slate-200/50 rotate-[-15deg] pointer-events-none"
        size={400}
      />

      <div className="w-full max-w-md px-6 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#355E3B]/10 text-[#355E3B] mb-4">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Secure Portal
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#355E3B] leading-tight">
            OFFICE OF THE REGISTRAR
          </h1>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">
            High Court of Kenya
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#355E3B]" />

          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Officer Authentication
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your official PJ Number to establish a secure session.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Official PJ Number
              </label>
              <div className="relative mt-1.5">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserCircle size={18} />
                </div>
                <input
                  type="text"
                  value={pj}
                  onChange={(e) => setPj(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                  placeholder="e.g. PJ-12345"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#355E3B] hover:bg-[#2a4b2f] active:scale-[0.99] disabled:opacity-70 text-white font-black text-[11px] uppercase tracking-[0.25em] py-4 rounded-xl transition-all shadow-lg shadow-[#355E3B]/20 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? "Authenticating..." : "Establish Secure Session"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;