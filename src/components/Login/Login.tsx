import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserCircle, ArrowRight, Scale, ShieldCheck, Mail, Lock } from "lucide-react";

import type { RootState } from "../../store/store";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { initPushSubscription } from "../../store/slices/notificationSlice";
import { clearError, loginUser } from "../../store/slices/adminAuthSlice";

const Login: React.FC = () => {
  const [loginMode, setLoginMode] = useState<"pj" | "dr">("pj");
  const [pj, setPj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, loading, error, isInitialized, requiresPasswordChange } = useAppSelector(
    (state: RootState) => state.auth
  );

  /* =====================================================
      ROLE-BASED REDIRECTION & PASSWORD SETUP
      Updated to prevent infinite loops.
  ===================================================== */
  useEffect(() => {
    if (!isInitialized) return;

    // 1. Priority: DR Password Setup
    if (requiresPasswordChange) {
      navigate("/setup-password", { replace: true });
      return;
    }

    // 2. Standard Role Redirection (Only if user exists and setup not required)
    if (user) {
      let targetPath = "";
      switch (user.role) {
        case "admin":
          targetPath = "/admin/dashboard";
          break;
        case "judge":
          targetPath = "/judge/dashboard";
          break;
        case "dr":
          targetPath = "/dr/dashboard";
          break;
        default:
          targetPath = "/unauthorized";
      }

      // Check current window location to prevent redundant navigation loops
      if (window.location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [user, navigate, isInitialized, requiresPasswordChange]);

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
    const toastId = toast.loading("Verifying with High Court Registry...");

    try {
      const credentials = 
        loginMode === "pj" 
          ? { pj: pj.trim() } 
          : { email: email.trim(), password };

      const result = await dispatch(loginUser(credentials)).unwrap();

      if (!result.requiresPasswordChange) {
        toast.success("Identity Verified", { id: toastId });
        dispatch(initPushSubscription());
      } else {
        toast.success("Identity Verified. Setup Required.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err || "Authentication Failed", { id: toastId });
    }
  };

  if (!isInitialized) return null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex items-center justify-center relative fixed inset-0">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#355E3B] z-50" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-[#C5A059] z-50" />

      <Scale className="absolute -right-24 -bottom-24 text-slate-200/50 rotate-[-15deg] pointer-events-none" size={400} />

      <div className="w-full max-w-md px-6 z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#355E3B]/10 text-[#355E3B] mb-4">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Portal</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#355E3B] leading-tight">OFFICE OF THE REGISTRAR</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">High Court of Kenya</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#355E3B]" />

          {/* Lane Toggle Switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setLoginMode("pj")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                loginMode === "pj" ? "bg-white text-[#355E3B] shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Scale size={14} />  Judge
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("dr")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                loginMode === "dr" ? "bg-white text-[#355E3B] shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Mail size={14} /> Deputy Registrar
            </button>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-lg font-serif font-bold text-slate-800 tracking-tight uppercase">
              {loginMode === "pj" ? "Judges Login Page" : "Deputy Registrar Login"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {loginMode === "pj" 
                ? "Kindly enter your PJ number to continue." 
                : "Kindly use your email and password to Login."}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === "pj" ? (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PJ Number</label>
                <div className="relative mt-1.5">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserCircle size={18} />
                  </div>
                  <input
                    type="text"
                    value={pj}
                    onChange={(e) => setPj(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                    placeholder="Enter PJ Number"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Email</label>
                  <div className="relative mt-1.5">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                      placeholder="name@court.go.ke"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <div className="relative mt-1.5">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </>
            )}

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