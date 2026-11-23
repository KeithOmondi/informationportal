import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  UserCircle,
  ArrowRight,
  Scale,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import type { RootState } from "../../store/store";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { initPushSubscription } from "../../store/slices/notificationSlice";
import { clearError, loginUser } from "../../store/slices/adminAuthSlice";

// The portal's look: deep green and gold, serif headings
const GREEN = "#1B3A2A";
const GOLD = "#C9A24A";

const Login: React.FC = () => {
  const [loginMode, setLoginMode] = useState<"pj" | "dr">("pj");
  const [pj, setPj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, loading, isInitialized, requiresPasswordChange } =
    useAppSelector((state: RootState) => state.auth);

  /* =====================================================
      1. NAVIGATION GUARD & ROLE REDIRECTION
  ===================================================== */
  useEffect(() => {
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
    setPj("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
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
        toast.success("Identity Verified. Initializing Setup.", {
          id: toastId,
        });
      } else {
        toast.success("Welcome, " + (result.user?.name || "Officer"), {
          id: toastId,
        });
        dispatch(initPushSubscription());
      }
    } catch (err) {
      let errorMessage = "Authentication Failed";

      if (typeof err === "string") {
        errorMessage = err;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String((err as { message: unknown }).message);
      }

      toast.error(errorMessage, { id: toastId });
    }
  };

  /* ===========================
      4. INITIALIZING STATE
  =========================== */
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin mb-4" style={{ color: GREEN }} size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Securing Connection to Registry...
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-transparent bg-[#e9eefb] py-4 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#C9A24A] focus:bg-white focus:ring-4 focus:ring-[#C9A24A]/15";

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Brand panel ───────────────────────────────────────────────────── */}
      <div
        className="relative hidden items-center justify-center overflow-hidden p-12 lg:flex lg:w-1/2"
        style={{ background: `linear-gradient(135deg, #0f2a1c 0%, ${GREEN} 55%, #234a35 100%)` }}
      >
        {/* faint cross pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <Scale
          className="pointer-events-none absolute -bottom-20 -left-16 -rotate-12 text-white/[0.04]"
          size={380}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-md space-y-8 text-center">
          <div className="inline-block rounded-md bg-white p-3 shadow-2xl">
            <img src="/JOB_LOGO.jpg" alt="Republic of Kenya, the Judiciary" className="h-28 w-auto" />
          </div>

          <div className="space-y-4">
            <h1 className="font-serif text-5xl font-bold uppercase leading-tight tracking-tight text-white">
              Information <span style={{ color: GOLD }}>Portal</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-14 bg-white/25" />
              <span className="h-2 w-2 rotate-45" style={{ background: GOLD }} />
              <span className="h-px w-14 bg-white/25" />
            </div>
            <p className="font-serif text-sm font-semibold uppercase tracking-[0.35em]" style={{ color: GOLD }}>
              Office of the Registrar
            </p>
            <p className="font-serif text-sm font-semibold uppercase tracking-[0.35em] text-white/90">
              High Court of Kenya
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
          <span>© 2026 Republic of Kenya</span>
          <span className="hidden xl:inline">Justice | Efficiency | Integrity</span>
        </div>
      </div>

      {/* ── Sign-in panel ─────────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 sm:p-10 lg:w-1/2 lg:bg-white lg:p-16">
        <div className="w-full max-w-md">
          {/* compact brand on small screens */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="rounded bg-white p-1.5 shadow">
              <img src="/JOB_LOGO.jpg" alt="" className="h-10 w-auto" />
            </div>
            <div className="text-left">
              <p className="font-serif text-lg font-bold leading-tight" style={{ color: GREEN }}>Information Portal</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>Office of the Registrar</p>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h2 className="font-serif text-4xl font-bold" style={{ color: GREEN }}>
              {loginMode === "pj" ? (
                <>Judges <span style={{ color: GOLD }}>Login</span></>
              ) : (
                <>Registrar <span style={{ color: GOLD }}>Login</span></>
              )}
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-500">
              {loginMode === "pj"
                ? "Enter your PJ number to sign in."
                : "Enter your email and password to sign in."}
            </p>
          </div>

          {/* who is signing in */}
          <nav className="mb-8 flex rounded-xl bg-slate-100 p-1" role="tablist">
            {([
              { key: "pj", label: "Judge", icon: Scale },
              { key: "dr", label: "Deputy Registrar", icon: Mail },
            ] as const).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={loginMode === t.key}
                type="button"
                onClick={() => toggleMode(t.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  loginMode === t.key ? "bg-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
                style={loginMode === t.key ? { color: GREEN } : undefined}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </nav>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginMode === "pj" ? (
              <div>
                <label className="ml-1 text-[11px] font-black uppercase tracking-widest text-slate-500">PJ Number</label>
                <div className="relative mt-2">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    autoComplete="username"
                    value={pj}
                    onChange={(e) => setPj(e.target.value)}
                    className={inputCls}
                    placeholder="12345"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="ml-1 text-[11px] font-black uppercase tracking-widest text-slate-500">Email</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                      placeholder="name@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Password</label>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-[10px] font-black uppercase tracking-widest hover:underline"
                      style={{ color: GOLD }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputCls} pr-12`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              style={{ background: GREEN, boxShadow: "0 12px 28px -10px rgba(27,58,42,0.55)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Authenticating
                </>
              ) : (
                <>
                  Authorize Session <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">End-to-end encrypted</span>
            </div>
            <div className="flex gap-1.5">
              <span className="h-1 w-8 rounded-full bg-slate-200" />
              <span className="h-1 w-8 rounded-full" style={{ background: GOLD }} />
              <span className="h-1 w-8 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
