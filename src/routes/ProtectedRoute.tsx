import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { ReactNode } from "react";
import type { RootState } from "../store/store";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import type { UserRole } from "../store/slices/adminAuthSlice";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[]; // Use the central UserRole type
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isInitialized, requiresPasswordChange } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const navigate = useNavigate();

  /* =====================================================
      1. INITIALIZATION LOAD
  ===================================================== */
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-[#060b13] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#c5a059]" size={40} />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
          Verifying Registry Credentials...
        </p>
      </div>
    );
  }

  /* =====================================================
      2. AUTHENTICATION CHECK
  ===================================================== */
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* =====================================================
      3. FORCE PASSWORD CHANGE (DR LANE)
      If the user is logged in but hasn't verified/set 
      their password, they MUST go to setup.
  ===================================================== */
  if (requiresPasswordChange) {
    return <Navigate to="/setup-password" replace />;
  }

  /* =====================================================
      4. AUTHORIZATION (ROLE) CHECK
  ===================================================== */
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#060b13] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <ShieldAlert className="text-red-500" size={32} />
        </div>

        <h1 className="text-2xl font-serif text-white uppercase tracking-tight">
          Access Restrained
        </h1>

        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-3 max-w-xs leading-relaxed">
          The <span className="text-red-400">{user.role}</span> role has insufficient clearance for this registry section.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="mt-8 flex items-center gap-2 text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] hover:text-[#e2bc7a] transition-colors"
        >
          <ArrowLeft size={14} />
          Return to Previous
        </button>
      </div>
    );
  }

  /* =====================================================
      5. GRANTED ACCESS
  ===================================================== */
  return <>{children}</>;
}