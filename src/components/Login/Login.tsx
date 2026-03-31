import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserCircle, ArrowRight, Scale, ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

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

  const { user, loading, isInitialized, requiresPasswordChange } =
    useAppSelector((state: RootState) => state.auth);

  /* =====================================================
      1. NAVIGATION GUARD & ROLE REDIRECTION
  ===================================================== */
  useEffect(() => {
    // Wait for the 'refreshUser' check to complete before acting
    if (!isInitialized) return;

    if (requiresPasswordChange) {
      navigate("/setup-password", { replace: true });
      return;
    }

    if (user) {
      const routes: Record<string, string> = {
        admin: "/admin/dashboard",
        judge: "/judge/dashboard",
        dr: "/dr/dashboard",
      };

      const targetPath = routes[user.role] || "/unauthorized";
      
      if (window.location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [user, isInitialized, requiresPasswordChange, navigate]);

  /* ===========================
      2. MODE SWITCHING LOGIC
  =========================== */
  const toggleMode = (mode: "pj" | "dr") => {
    setLoginMode(mode);
    // CRITICAL: Clear the other lane's data to prevent payload contamination
    setPj("");
    setEmail("");
    setPassword("");
    dispatch(clearError());
  };

  /* ===========================
      3. LOGIN HANDLER
  =========================== */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const toastId = "auth-action";
    toast.loading("Verifying Credentials...", { id: toastId });

    try {
      const credentials =
        loginMode === "pj"
          ? { pj: pj.trim() }
          : { email: email.trim().toLowerCase(), password };

      const result = await dispatch(loginUser(credentials)).unwrap();

      if (result.requiresPasswordChange) {
        toast.success("Identity Verified. Initializing Setup.", { id: toastId });
      } else {
        toast.success("Welcome, " + (result.user?.name || "Officer"), { id: toastId });
        dispatch(initPushSubscription());
      }
    } catch (err: any) {
      // Backend generic errors like "Invalid credentials" land here
      toast.error(err || "Authentication Failed", { id: toastId });
    }
  };

  /* ===========================
      4. INITIALIZING STATE
  =========================== */
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="text-[#355E3B] animate-spin mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Securing Connection to Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex items-center justify-center relative">
      {/* Visual Identity Borders */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#355E3B] z-50" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-[#C5A059] z-50" />

      {/* Decorative Watermark */}
      <Scale className="absolute -right-24 -bottom-24 text-slate-200/50 rotate-[-15deg] pointer-events-none" size={400} aria-hidden="true" />

      <div className="w-full max-w-md px-6 z-10">
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#355E3B]/10 text-[#355E3B] mb-4">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Authorized Access Only</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#355E3B] leading-tight">
            OFFICE OF THE REGISTRAR
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mt-1">
            High Court of Kenya
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#355E3B]" />

          {/* Lane Toggle */}
          <nav className="flex bg-slate-100 p-1 rounded-xl mb-8" role="tablist">
            <button
              role="tab"
              aria-selected={loginMode === "pj"}
              type="button"
              onClick={() => toggleMode("pj")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                loginMode === "pj" ? "bg-white text-[#355E3B] shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Scale size={14} /> Judge / Admin
            </button>

            <button
              role="tab"
              aria-selected={loginMode === "dr"}
              type="button"
              onClick={() => toggleMode("dr")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                loginMode === "dr" ? "bg-white text-[#355E3B] shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Mail size={14} /> Staff (DR)
            </button>
          </nav>

          <div className="mb-6 text-center">
            <h2 className="text-lg font-serif font-bold text-slate-800 tracking-tight uppercase">
              {loginMode === "pj" ? "Judiciary Login" : "Staff Portal"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {loginMode === "pj"
                ? "Enter your unique PJ identifier to proceed."
                : "Enter your official credentials to authenticate."}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === "pj" ? (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  PJ Number
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserCircle size={18} />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    value={pj}
                    onChange={(e) => setPj(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                    placeholder="PJ-XXXXX"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Official Email
                  </label>
                  <div className="relative mt-1.5">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#C5A059] rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all"
                      placeholder="justice@court.go.ke"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Password
                    </label>
                    <button type="button" className="text-[9px] font-bold text-[#C5A059] uppercase hover:underline">
                      Reset
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      autoComplete="current-password"
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
              className="w-full bg-[#355E3B] hover:bg-[#2a4b2f] active:scale-[0.98] disabled:opacity-70 text-white font-black text-[11px] uppercase tracking-[0.25em] py-4 rounded-xl transition-all shadow-lg shadow-[#355E3B]/20 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Authenticating
                </>
              ) : (
                <>
                  Establish Secure Session <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Login;