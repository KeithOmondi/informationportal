import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { requestPasswordReset } from "../../store/slices/adminAuthSlice";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const dispatch = useAppDispatch();
  const { loading, resetEmailSent } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(requestPasswordReset(email)).unwrap();
      toast.success("Reset link dispatched.");
    } catch (err: any) {
      toast.error(err || "Failed to send link.");
    }
  };

  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-[#355E3B]">
          <CheckCircle2 className="mx-auto text-[#355E3B] mb-4" size={48} />
          <h2 className="text-xl font-serif font-bold text-slate-800">Check Your Email</h2>
          <p className="text-sm text-slate-500 mt-2">
            If an account exists for <strong>{email}</strong>, you will receive a secure link shortly.
          </p>
          <Link to="/login" className="inline-block mt-6 text-[#C5A059] font-bold text-xs uppercase tracking-widest hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border-l-4 border-[#355E3B]">
        <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-[#355E3B] mb-6 transition-colors">
          <ArrowLeft size={16} /> <span className="text-[10px] font-black uppercase">Back</span>
        </Link>
        
        <h2 className="text-xl font-serif font-bold text-slate-800">Account Recovery</h2>
        <p className="text-xs text-slate-500 mt-1 mb-8">Enter your official email to receive a password reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#C5A059]"
              placeholder="justice@court.go.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-[#355E3B] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;