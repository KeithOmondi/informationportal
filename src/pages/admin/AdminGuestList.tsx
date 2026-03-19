import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { 
  fetchAllGuestLists, 
  downloadAllGuestsReport, 
  downloadJudgeReport,
  type IJudgeGuest 
} from "../../store/slices/guestSlice";
import {
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  Mail,
  ChevronDown,
  ChevronUp,
  Phone,
  Hash,
  FileDown,
  Printer
} from "lucide-react";

/* =====================================================
    TYPES
===================================================== */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}

const AdminGuestList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { allGuestLists, loading } = useAppSelector((state) => state.guest);
  const { user, isInitialized } = useAppSelector((state) => state.auth);
  
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null); // 'master' or userId

  useEffect(() => {
    if (isInitialized && user) {
      dispatch(fetchAllGuestLists());
    }
  }, [dispatch, isInitialized, user]);

  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  /* =====================================================
      HANDLERS
  ===================================================== */
  const handleDownloadAll = async () => {
    setDownloadingId('master');
    await dispatch(downloadAllGuestsReport());
    setDownloadingId(null);
  };

  const handleDownloadSingle = async (userId: string, name: string) => {
    setDownloadingId(userId);
    await dispatch(downloadJudgeReport({ userId, judgeName: name }));
    setDownloadingId(null);
  };

  /* =====================================================
      COMPUTED PROPERTIES
  ===================================================== */
  const totalSubmissions = allGuestLists.length;
  const completedLists = allGuestLists.filter(list => list.status === "SUBMITTED").length;
  const totalGuestsCount = allGuestLists.reduce((acc, list) => acc + (list.guests?.length || 0), 0);

  const getUserDisplay = (userData: IJudgeGuest["user"]) => {
    if (typeof userData === "object" && userData !== null) {
      return { 
        id: userData._id,
        name: userData.name || "Unknown Identity", 
        email: userData.email || "No Email Provided" 
      };
    }
    return { 
      id: String(userData),
      name: `User ID: ...${String(userData).slice(-6)}`, 
      email: "Fetch details manually" 
    };
  };

  if (loading && allGuestLists.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#355E3B]" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Synchronizing Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header & Stats */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-4 w-full xl:w-auto">
          <div>
            <h1 className="text-[#355E3B] font-serif text-3xl font-bold mb-2 tracking-tight">Guest Registration</h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">High Court Registry Management</p>
          </div>
          
          <button 
            onClick={handleDownloadAll}
            disabled={!!downloadingId}
            className="flex items-center gap-2 bg-[#1a3a32] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#2a4d43] transition-all disabled:opacity-50 shadow-lg shadow-[#1a3a32]/20"
          >
            {downloadingId === 'master' ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
            Download Master Registry (PDF)
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatCard icon={<ShieldCheck size={18} />} label="Total Entries" value={totalSubmissions} />
          <StatCard icon={<CheckCircle2 size={18} />} label="Finalized" value={completedLists} color="text-green-600" />
          <StatCard icon={<Users size={18} />} label="Guest Total" value={totalGuestsCount} />
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Registrant Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Allocation</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocol Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Modified Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allGuestLists.map((list) => {
                const userInfo = getUserDisplay(list.user);
                const isExpanded = expandedRowId === list._id;

                return (
                  <React.Fragment key={list._id}>
                    <tr className={`hover:bg-slate-50/80 transition-all ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#355E3B]">{userInfo.name}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                            <Mail size={12} /> {userInfo.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-slate-700">{list.guests?.length || 0}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Guests List</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {list.status === "SUBMITTED" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                            <CheckCircle2 size={12} /> Finalized
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            <Clock size={12} /> Draft Mode
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-500 font-semibold">
                        {list.updatedAt ? new Date(list.updatedAt).toLocaleDateString("en-KE") : "N/A"}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => toggleRow(list._id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isExpanded ? 'bg-[#355E3B] text-white shadow-lg shadow-[#355E3B]/20' : 'bg-white border border-slate-200 text-[#355E3B] hover:bg-slate-50'
                          }`}
                        >
                          {isExpanded ? 'Close' : 'View'} {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED SECTION */}
                    {isExpanded && (
                      <tr className="bg-white">
                        <td colSpan={5} className="px-8 py-8 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex flex-col gap-8">
                            {/* Actions bar inside expanded view */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Authorized Guest Details</h3>
                              <button 
                                onClick={() => handleDownloadSingle(userInfo.id, userInfo.name)}
                                disabled={!!downloadingId}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#355E3B] hover:underline"
                              >
                                {downloadingId === userInfo.id ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
                                Download PDF Report
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {list.guests.map((guest, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-[#355E3B]/10 flex items-center justify-center text-[#355E3B] font-bold text-xs">
                                        {idx + 1}
                                      </div>
                                      <h4 className="text-sm font-bold text-slate-800">{guest.name || "Unnamed Guest"}</h4>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                                      {guest.type}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <DetailItem label="Gender" value={guest.gender || "Not Specified"} />
                                    <DetailItem 
                                      label="ID Status" 
                                      value={guest.idNumber || guest.birthCertNumber ? "Verified" : "Missing Info"} 
                                    />
                                  </div>

                                  <div className="space-y-2 pt-2 border-t border-slate-200">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Hash size={14} className="text-slate-400" />
                                      <span className="font-medium">{guest.idNumber || guest.birthCertNumber || "No ID/Cert"}</span>
                                    </div>
                                    {guest.type === "ADULT" && (
                                      <>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <Phone size={14} className="text-slate-400" />
                                          <span className="font-medium">{guest.phone || "No Phone"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <Mail size={14} className="text-slate-400" />
                                          <span className="truncate font-medium">{guest.email || "No Email"}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --- Sub-Components --- */

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-xs font-bold text-slate-700">{value}</p>
  </div>
);

const StatCard = ({ icon, label, value, color = "text-[#355E3B]" }: StatCardProps) => (
  <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl flex items-center gap-5 shadow-sm min-w-[180px]">
    <div className={`${color} bg-slate-50 p-3 rounded-2xl`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className={`text-xl font-bold leading-none ${color} tracking-tight`}>{value}</p>
    </div>
  </div>
);

export default AdminGuestList;