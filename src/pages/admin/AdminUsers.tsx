import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  UserPlus,
  Trash2,
  Users,
  UserCog,
  Search,
  RefreshCw,
  Lock,
  GraduationCap,
  Fingerprint,
  Edit3,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  clearUserError,
  createAdminUser,
  deleteAdminUser,
  fetchUsers,
  updateAdminUser,
  fetchProfile,
  editAdminDetails,
} from "../../store/slices/adminUserSlice";

type UserRole = "admin" | "judge" | "guest";

// Identifying the Master Admin by PJ now instead of Email if necessary, 
// but keeping your existing env variable logic for compatibility.
const MASTER_ADMIN_EMAIL = import.meta.env.VITE_MASTER_ADMIN_EMAIL;

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const { user: authUser } = useAppSelector((state) => state.auth);

  // Authorization Check
  const isMasterAdmin = !!MASTER_ADMIN_EMAIL && authUser?.email === MASTER_ADMIN_EMAIL;

  // New User State
  const [newUserName, setNewUserName] = useState("");
  const [newUserPJ, setNewUserPJ] = useState("");
  const [newUserCohort, setNewUserCohort] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("guest");
  
  // Search & Edit State
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", pj: "", cohort: "" });

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [error, dispatch]);

  const handleCreateUser = async () => {
    if (!isMasterAdmin) return toast.error("Unauthorized: Master Admin access required");
    if (!newUserName.trim() || !newUserPJ.trim()) {
      return toast.error("Full Name and PJ Number are mandatory for registration");
    }

    try {
      await dispatch(
        createAdminUser({
          name: newUserName.trim(),
          pj: newUserPJ.trim().toUpperCase(),
          role: newUserRole,
          cohort: newUserCohort ? parseInt(newUserCohort) : undefined,
        })
      ).unwrap();

      toast.success(`${newUserRole.toUpperCase()} successfully onboarded`);
      setNewUserName("");
      setNewUserPJ("");
      setNewUserCohort("");
      setNewUserRole("guest");
    } catch (err: any) {
      toast.error(err || "Failed to register personnel");
    }
  };

  const startEditing = (user: any) => {
    setEditingId(user._id);
    setEditForm({
      name: user.name,
      pj: user.pj,
      cohort: user.cohort?.toString() || "",
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await dispatch(
        editAdminDetails({
          id,
          updates: {
            name: editForm.name.trim(),
            pj: editForm.pj.trim().toUpperCase(),
            cohort: editForm.cohort ? parseInt(editForm.cohort) : undefined,
          },
        })
      ).unwrap();
      toast.success("Personnel record updated");
      setEditingId(null);
    } catch (err: any) {
      toast.error(err || "Failed to update record");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!isMasterAdmin) return toast.error("Unauthorized action");
    if (!window.confirm("Confirm: Permanent removal of user from registry?")) return;

    try {
      await dispatch(deleteAdminUser(id)).unwrap();
      toast.success("Record purged from system");
    } catch (err: any) {
      toast.error(err || "Failed to delete record");
    }
  };

  const handleChangeRole = async (id: string, newRole: UserRole) => {
    if (!isMasterAdmin) return toast.error("Master Admin authorization required");

    try {
      await dispatch(updateAdminUser({ id, updates: { role: newRole } })).unwrap();
      toast.success(`Access level updated to ${newRole.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err || "Failed to update authorization");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.pj.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F3F4] font-sans">
      {/* HEADER */}
      <header className="bg-[#355E3B] text-white px-4 md:px-8 py-6 shadow-md border-b-4 border-[#EFBF04]">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-[#EFBF04] p-2 md:p-2.5 rounded-lg text-[#355E3B]">
              <UserCog size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg md:text-2xl tracking-tight uppercase">Personnel Management</h1>
              <p className="text-[9px] md:text-[10px] text-white/70 uppercase tracking-widest font-medium italic">Internal Registry (PJ Identifiers)</p>
            </div>
          </div>
          <button onClick={() => dispatch(fetchUsers())} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#EFBF04]">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
        
        {/* ONBOARDING SECTION */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          {!isMasterAdmin && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2">
                <Lock size={20} className="text-red-500" />
                <span className="text-slate-800 font-bold text-xs uppercase tracking-widest text-center">Master Admin Only</span>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-b bg-slate-50 flex items-center gap-2">
            <UserPlus size={18} className="text-[#355E3B]" />
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Onboard New Personnel</h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name</label>
              <input 
                type="text" 
                value={newUserName} 
                onChange={(e) => setNewUserName(e.target.value)} 
                placeholder="Full Name" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#355E3B]/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">PJ Number</label>
              <div className="relative">
                <Fingerprint size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={newUserPJ} 
                  onChange={(e) => setNewUserPJ(e.target.value)} 
                  placeholder="PJ-XXXX" 
                  className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#355E3B]/20" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cohort</label>
              <div className="relative">
                <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  value={newUserCohort} 
                  onChange={(e) => setNewUserCohort(e.target.value)} 
                  placeholder="Year" 
                  className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#355E3B]/20" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Designation</label>
              <select 
                value={newUserRole} 
                onChange={(e) => setNewUserRole(e.target.value as UserRole)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none"
              >
                <option value="guest">Guest</option>
                <option value="judge">Judge</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button 
              onClick={handleCreateUser} 
              disabled={loading} 
              className="bg-[#355E3B] hover:bg-[#2a4b2f] text-white rounded-xl px-6 py-2.5 font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 h-[42px] disabled:opacity-50 w-full sm:col-span-2 md:col-span-1"
            >
              <UserPlus size={18} /> {loading ? "..." : "Register"}
            </button>
          </div>
        </section>

        {/* DIRECTORY SECTION */}
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-[#355E3B]" />
              <h2 className="font-bold text-slate-800 text-lg font-serif">REGISTRY DIRECTORY</h2>
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{users.length} Records</span>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Name or PJ Number..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs w-full outline-none" 
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Personnel Information</th>
                  <th className="px-6 py-4">Cohort</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Access Level</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-[#F8F9FA] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#355E3B] flex items-center justify-center text-[#EFBF04] font-bold shadow-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {editingId === user._id ? (
                          <div className="space-y-1">
                            <input 
                              className="block w-full text-sm border-b border-[#355E3B] outline-none bg-transparent font-bold"
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})} 
                            />
                            <input 
                              className="block w-full text-[10px] border-b border-slate-300 outline-none bg-transparent uppercase font-mono"
                              value={editForm.pj} 
                              onChange={e => setEditForm({...editForm, pj: e.target.value})} 
                            />
                          </div>
                        ) : (
                          <div className="truncate">
                            <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight font-mono">PJ: {user.pj}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600">
                      {editingId === user._id ? (
                        <input 
                          type="number"
                          className="w-16 border-b border-[#355E3B] outline-none bg-transparent"
                          value={editForm.cohort} 
                          onChange={e => setEditForm({...editForm, cohort: e.target.value})} 
                        />
                      ) : (
                        user.cohort ? `C${user.cohort}` : "—"
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                        user.role === "admin" ? "bg-red-50 text-red-700 border-red-200" : 
                        user.role === "judge" ? "bg-[#EFBF04]/10 text-[#355E3B] border-[#EFBF04]/30" : 
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={user.role}
                        disabled={!isMasterAdmin || user.email === MASTER_ADMIN_EMAIL || editingId === user._id}
                        onChange={(e) => handleChangeRole(user._id, e.target.value as UserRole)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="guest">GUEST</option>
                        <option value="judge">JUDGE</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === user._id ? (
                          <>
                            <button onClick={() => handleSaveEdit(user._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                              <Check size={18} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            {isMasterAdmin && (
                              <button onClick={() => startEditing(user)} className="p-2 text-slate-400 hover:text-[#355E3B] transition-all md:opacity-0 md:group-hover:opacity-100">
                                <Edit3 size={18} />
                              </button>
                            )}
                            {user.email !== MASTER_ADMIN_EMAIL && isMasterAdmin && (
                              <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-slate-400 hover:text-red-600 transition-all md:opacity-0 md:group-hover:opacity-100">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;