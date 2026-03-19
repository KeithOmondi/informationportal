import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  UserPlus,
  Trash2,
  Save,
  ArrowRight,
  Loader2,
  CheckCircle,
  ShieldAlert,
  AlertCircle,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchMyGuestList,
  saveGuestList,
  submitGuestList,
  type IGuest,
  type GuestType,
  type Gender,
} from "../../store/slices/guestSlice";

/* =====================================================
    TYPES & HELPERS
===================================================== */
interface IGuestWithId extends IGuest {
  uiId: string;
}

const createEmptyGuest = (): IGuestWithId => ({
  uiId: crypto.randomUUID(),
  name: "",
  type: "ADULT",
  gender: "MALE",
  idNumber: "",
  birthCertNumber: "",
  phone: "",
  email: "",
});

const JudgeGuestsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { guestList, loading } = useAppSelector((state) => state.guest);
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  const [guests, setGuests] = useState<IGuestWithId[]>([createEmptyGuest()]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    if (isInitialized && user) {
      dispatch(fetchMyGuestList());
    }
  }, [dispatch, isInitialized, user]);

  useEffect(() => {
    if (guestList?.guests && guestList.guests.length > 0) {
      setGuests(
        guestList.guests.map((g: IGuest) => ({
          ...g,
          uiId: crypto.randomUUID(),
        })),
      );
    }
  }, [guestList]);

  /* =====================================================
      VALIDATION LOGIC
  ===================================================== */
  const validateGuests = (): boolean => {
  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    const label = `Guest #${i + 1}`;

    // Use ?? "" to treat undefined as an empty string for validation
    const name = g.name ?? "";
    const gender = g.gender ?? "";
    const idNumber = g.idNumber ?? "";
    const phone = g.phone ?? "";
    const email = g.email ?? "";
    const birthCert = g.birthCertNumber ?? "";

    // Common Mandatory Fields
    if (!name.trim()) { toast.error(`${label}: Full Name is required`); return false; }
    if (!gender) { toast.error(`${label}: Gender is required`); return false; }

    if (g.type === "ADULT") {
      if (!idNumber.trim()) { toast.error(`${label}: National ID/Passport is required`); return false; }
      if (!phone.trim()) { toast.error(`${label}: Phone Number is required`); return false; }
      if (!email.trim()) { toast.error(`${label}: Email Address is required`); return false; }
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error(`${label}: Provide a valid email`); return false; }
    } else {
      if (!birthCert.trim()) { toast.error(`${label}: Birth Certificate Number is required`); return false; }
    }
  }
  return true;
};

  /* =====================================================
      HANDLERS
  ===================================================== */
  const addGuestHandler = (): void => {
    if (guests.length < 5) {
      setGuests([...guests, createEmptyGuest()]);
      toast.success("New guest row added.");
    } else {
      toast.error("Maximum allocation (5) reached.");
    }
  };

  const removeGuest = (uiId: string): void => {
    if (guests.length > 1) {
      setGuests(guests.filter((g) => g.uiId !== uiId));
      toast.success("Guest row removed.");
    }
  };

  const updateField = <K extends keyof IGuestWithId>(
    uiId: string,
    field: K,
    value: IGuestWithId[K],
  ): void => {
    setGuests((prev) =>
      prev.map((g) => (g.uiId === uiId ? { ...g, [field]: value } : g)),
    );
  };

  const cleanGuestsForApi = (): IGuest[] =>
    guests.map(({ uiId, ...rest }) => rest);

  const handleSaveDraft = async (): Promise<void> => {
    // We allow saving drafts with partial info, or you can validate here too
    try {
      await dispatch(saveGuestList(cleanGuestsForApi())).unwrap();
      toast.success("Changes saved to registry.");
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Failed to save.");
    }
  };

  const handleFinalSubmit = async (): Promise<void> => {
    if (!validateGuests()) return; // Stop if validation fails

    setShowConfirmModal(false);
    try {
      await dispatch(submitGuestList(cleanGuestsForApi())).unwrap();
      toast.success("Registry updated successfully.", {
        icon: "⚖️",
        duration: 5000,
      });
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Update failed.");
    }
  };

  const isSubmitted = guestList?.status === "SUBMITTED";

  if (loading && !guestList) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#355E3B]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Syncing Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <Toaster position="top-right" />

      {/* --- CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#C5A059]" />
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-amber-50 p-4 rounded-full text-amber-600">
                <AlertCircle size={48} />
              </div>
              <div className="space-y-3">
                <h3 className="text-[#355E3B] font-serif text-2xl font-bold">
                  Confirm Registration
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium px-2">
                  Kindly confirm whether these will be the only guests accompanying you to the swearing-in ceremony.{" "}
                  <span className="text-[#355E3B] font-bold underline decoration-[#C5A059]">
                    {guests.length} guest(s)
                  </span>
                  ? You can still modify this later if required.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-4 bg-[#355E3B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4a2e] shadow-lg shadow-[#355E3B]/20 transition-all"
                >
                  Yes, Confirm & Update
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECURITY NOTICE --- */}
      <div className="bg-[#355E3B]/5 border border-[#355E3B]/10 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="bg-[#355E3B] p-4 rounded-2xl text-white shadow-xl shadow-[#355E3B]/20 shrink-0">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="text-[#355E3B] text-[11px] font-black uppercase tracking-[0.25em]">
            Kind Reminder
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You are allowed to register up to{" "}
            <span className="font-bold text-slate-900">5 guests</span>.
            <br />
            <span className="font-bold text-slate-900">KIndly ensure all the details provided match that on the Identification Document</span>.
            <br />
            <span className="text-amber-600 font-semibold italic">Note: All fields are mandatory for Adults. For Minors, Phone/Email is optional but Birth Certificate is required.</span>
          </p>
        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#355E3B]">
            Guest Registration
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isSubmitted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
            >
              {guestList?.status || "DRAFT"}
            </span>
          </div>
        </div>
        <p className="text-sm font-bold text-slate-700 tracking-tighter">
          {guests.length} / 5 GUESTS
        </p>
      </div>

      {/* --- GUEST FORMS --- */}
      <div className="space-y-6">
        {guests.map((guest, index) => (
          <div
            key={guest.uiId}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#355E3B] text-white text-[10px] font-black">
                {index + 1}
              </span>
              <button
                onClick={() => removeGuest(guest.uiId)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                required
                value={guest.name}
                onChange={(v: string) => updateField(guest.uiId, "name", v)}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Classification <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(["ADULT", "MINOR"] as GuestType[]).map((t) => (
                    <Toggle
                      key={t}
                      active={guest.type === t}
                      label={t}
                      onClick={() => updateField(guest.uiId, "type", t)}
                    />
                  ))}
                </div>
              </div>
              <Select
                label="Gender"
                required
                value={guest.gender}
                options={["MALE", "FEMALE", "OTHER"]}
                onChange={(v: string) =>
                  updateField(guest.uiId, "gender", v as Gender)
                }
              />
              {guest.type === "ADULT" ? (
                <>
                  <Input
                    label="National ID / Passport"
                    required
                    value={guest.idNumber}
                    onChange={(v: string) =>
                      updateField(guest.uiId, "idNumber", v)
                    }
                  />
                  <Input
                    label="Phone Number"
                    required
                    value={guest.phone}
                    onChange={(v: string) =>
                      updateField(guest.uiId, "phone", v)
                    }
                  />
                  <Input
                    label="Email Address"
                    required
                    value={guest.email}
                    onChange={(v: string) =>
                      updateField(guest.uiId, "email", v)
                    }
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Birth Certificate Number"
                    required
                    value={guest.birthCertNumber}
                    onChange={(v: string) =>
                      updateField(guest.uiId, "birthCertNumber", v)
                    }
                  />
                  <Input
                    label="Guardian Phone (Optional)"
                    value={guest.phone}
                    onChange={(v: string) =>
                      updateField(guest.uiId, "phone", v)
                    }
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
        <button
          onClick={addGuestHandler}
          disabled={guests.length >= 5}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#355E3B] disabled:opacity-30 hover:underline underline-offset-8 transition-all"
        >
          <UserPlus size={16} /> Add Another Guest
        </button>

        <div className="flex gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Save size={14} />
            )}
            Save Draft
          </button>
          <button
            onClick={() => {
              // Trigger validation before showing modal
              if(validateGuests()) setShowConfirmModal(true);
            }}
            disabled={loading}
            className="px-8 py-3 bg-[#355E3B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4a2e] shadow-lg shadow-[#355E3B]/20 flex items-center gap-2 transition-all"
          >
            {isSubmitted ? "Update Registration" : "Finalize Registry"}{" "}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {isSubmitted && (
        <div className="flex items-center justify-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
          <CheckCircle size={14} /> ORHC currently active in system
        </div>
      )}
    </div>
  );
};

/* --- Updated Reusable Components --- */

interface InputProps {
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
}

const Input: React.FC<InputProps> = ({ label, value, required, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:border-[#355E3B] outline-none transition-all"
      placeholder={required ? "Mandatory..." : "Optional..."}
    />
  </div>
);

interface SelectProps {
  label: string;
  value?: string;
  required?: boolean;
  options: string[];
  onChange: (v: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, value, required, options, onChange }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ""}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
        onChange(e.target.value)
      }
      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:border-[#355E3B] appearance-none"
    >
      <option value="" disabled>
        Select...
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

interface ToggleProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
      active
        ? "bg-[#355E3B] border-[#355E3B] text-white shadow-md"
        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
    }`}
  >
    {label}
  </button>
);

export default JudgeGuestsPage;