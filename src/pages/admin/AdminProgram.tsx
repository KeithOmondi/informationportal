import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchProgramForAdmin,
  fetchAllProgramsForAdmin,
  createProgram,
  updateProgram,
  deleteProgram,
  resetProgramStatus,
} from "../../store/slices/programSlice";
import type { AudienceRole, ProgramData } from "../../store/slices/programSlice";
import {
  Plus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Users,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  FileText,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIENCE_OPTIONS: {
  label: string;
  value: AudienceRole;
  color: string;
  bg: string;
}[] = [
  { label: "All",    value: "all",   color: "text-slate-600", bg: "bg-slate-100"     },
  { label: "Judges", value: "judge", color: "text-blue-700",  bg: "bg-blue-50"       },
  { label: "DR",     value: "dr",    color: "text-[#C5A059]", bg: "bg-[#C5A059]/10" },
];

const EMPTY_PROGRAM: Partial<ProgramData> & { targetAudience: AudienceRole } = {
  event_title: "HIGH COURT LEADERS 2026 CONFERENCE",
  theme:
    "PROTECTING VULNERABLE WOMEN AND CHILDREN: STRENGTHENING JUDICIAL INTERVENTION FOR ACCESS TO JUSTICE",
  targetAudience: "all",
  schedule: [],
  isLocked: false,
  scheduledRelease: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

const AudienceBadge = ({ audience }: { audience: AudienceRole }) => {
  const opt = AUDIENCE_OPTIONS.find((o) => o.value === audience);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${opt?.bg} ${opt?.color} border-current/20`}
    >
      <Users size={9} />
      {opt?.label ?? audience}
    </span>
  );
};

const StatusBadge = ({ isLocked }: { isLocked: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
      isLocked
        ? "bg-red-50 text-red-600 border-red-100"
        : "bg-emerald-50 text-emerald-600 border-emerald-100"
    }`}
  >
    {isLocked ? <Lock size={9} /> : <Unlock size={9} />}
    {isLocked ? "Locked" : "Active"}
  </span>
);

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface ProgramModalProps {
  initial: Partial<ProgramData> & { targetAudience: AudienceRole };
  onClose: () => void;
  onSave: (data: Partial<ProgramData> & { targetAudience: AudienceRole }) => void;
  loading: boolean;
  mode: "create" | "edit";
}

const ProgramModal = ({
  initial,
  onClose,
  onSave,
  loading,
  mode,
}: ProgramModalProps) => {
  const [form, setForm] = useState(initial);

  const set = (key: keyof typeof form, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[#355E3B] font-serif text-xl font-bold">
              {mode === "create" ? "Create Program" : "Edit Program"}
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              {mode === "create" ? "Add a new program entry" : "Modify existing entry"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Event title */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Event Title
            </label>
            <input
              value={form.event_title ?? ""}
              onChange={(e) => set("event_title", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#355E3B]/30 focus:border-[#355E3B] transition-all"
              placeholder="Conference title..."
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Theme
            </label>
            <textarea
              rows={3}
              value={form.theme ?? ""}
              onChange={(e) => set("theme", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#355E3B]/30 focus:border-[#355E3B] transition-all resize-none"
              placeholder="Conference theme..."
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Target Audience
            </label>
            <div className="flex gap-2 flex-wrap">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("targetAudience", opt.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    form.targetAudience === opt.value
                      ? `${opt.bg} ${opt.color} border-current shadow-sm ring-2 ring-offset-1 ring-current/20`
                      : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Users size={11} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Release */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Scheduled Release
            </label>
            <input
              type="datetime-local"
              value={
                form.scheduledRelease
                  ? new Date(form.scheduledRelease).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                set("scheduledRelease", new Date(e.target.value).toISOString())
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#355E3B]/30 focus:border-[#355E3B] transition-all"
            />
          </div>

          {/* Lock toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700">Lock Program</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Locked programs are hidden from all users regardless of release date
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("isLocked", !form.isLocked)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                form.isLocked ? "bg-red-500" : "bg-emerald-400"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.isLocked ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-[#355E3B] hover:bg-[#2a4b30] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={12} />
            )}
            {mode === "create" ? "Create" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Program Card
// ---------------------------------------------------------------------------

interface ProgramCardProps {
  program: ProgramData;
  onEdit: (p: ProgramData) => void;
  onDelete: (id: string) => void;
}

const ProgramCard = ({ program, onEdit, onDelete }: ProgramCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const releaseDate = program.scheduledRelease
    ? new Date(program.scheduledRelease).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  const totalActivities =
    program.schedule?.reduce(
      (sum, day) => sum + (day.activities?.length ?? 0),
      0
    ) ?? 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group">

      {/* Card header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <AudienceBadge audience={program.targetAudience} />
            <StatusBadge isLocked={program.isLocked} />
          </div>
          <h3 className="font-serif font-bold text-[#355E3B] text-base leading-snug truncate">
            {program.event_title}
          </h3>
          {program.theme && (
            <p className="text-slate-400 text-[10px] mt-1 leading-relaxed line-clamp-2">
              {program.theme}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(program)}
            className="p-2 rounded-lg hover:bg-[#355E3B]/10 text-[#355E3B] transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(program._id)}
            className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-5 pb-4 flex items-center gap-4 flex-wrap text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Clock size={10} /> {releaseDate}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={10} /> {program.schedule?.length ?? 0} day(s)
        </span>
        <span className="flex items-center gap-1.5">
          <FileText size={10} /> {totalActivities} activities
        </span>
        
      </div>

      {/* Schedule accordion */}
      {(program.schedule?.length ?? 0) > 0 && (
        <>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="w-full px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
          >
            <span>Schedule Preview</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {expanded && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {program.schedule.map((day) => (
                <div key={day._id ?? day.day} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#355E3B]/10 text-[#355E3B] px-2 py-0.5 rounded">
                      Day {day.day}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(day.date).toLocaleDateString("en-KE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {day.activities.slice(0, 4).map((act, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <span className="text-slate-300 font-mono text-[10px] shrink-0 mt-0.5 w-16">
                          {act.time}
                        </span>
                        <span className="text-slate-600 font-medium leading-snug">
                          {act.activity}
                        </span>
                        {act.facilitator && (
                          <span className="ml-auto text-[9px] text-slate-300 shrink-0">
                            {act.facilitator}
                          </span>
                        )}
                      </div>
                    ))}
                    {day.activities.length > 4 && (
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest pt-1">
                        +{day.activities.length - 4} more activities
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AdminProgram = () => {
  const dispatch = useAppDispatch();
  const { program, allPrograms, loading, success, error } = useAppSelector(
    (s) => s.program
  );

  const [audienceFilter, setAudienceFilter] = useState<AudienceRole>("all");
  const [modalMode, setModalMode]           = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget]         = useState<ProgramData | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchProgramForAdmin());
    dispatch(fetchAllProgramsForAdmin());
  }, [dispatch]);

  // Close modal / confirm on success
  useEffect(() => {
    if (success) {
      setModalMode(null);
      setEditTarget(null);
      setDeleteConfirm(null);
      dispatch(fetchAllProgramsForAdmin());
      dispatch(resetProgramStatus());
    }
  }, [success, dispatch]);

  // Flatten grouped programs into a single list
  const allFlat: ProgramData[] = allPrograms
    ? (["all", "judge", "dr"] as AudienceRole[]).flatMap(
        (key) => allPrograms.grouped[key] ?? []
      )
    : program
    ? [program]
    : [];

  const displayed =
    audienceFilter === "all"
      ? allFlat
      : allFlat.filter((p) => p.targetAudience === audienceFilter);

  // Counts for filter tabs
  const counts: Record<AudienceRole, number> = {
    all:   allFlat.length,
    judge: allFlat.filter((p) => p.targetAudience === "judge").length,
    dr:    allFlat.filter((p) => p.targetAudience === "dr").length,
  };

  // Handlers
  const handleCreate = (
    data: Partial<ProgramData> & { targetAudience: AudienceRole }
  ) => dispatch(createProgram(data as any));

  const handleUpdate = (
    data: Partial<ProgramData> & { targetAudience: AudienceRole }
  ) => {
    if (!editTarget) return;
    dispatch(updateProgram({ id: editTarget._id, data }));
  };

  const handleDelete = (id: string) => dispatch(deleteProgram(id));

  const openEdit = (p: ProgramData) => {
    setEditTarget(p);
    setModalMode("edit");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-[#355E3B] font-serif text-3xl font-bold">Programs</h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            Manage conference programs by audience — judges, DR, or all attendees.
          </p>
        </div>
        <button
          onClick={() => setModalMode("create")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#355E3B] hover:bg-[#2a4b30] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          <Plus size={13} /> New Program
        </button>
      </div>

      {/* TOASTS */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          {error}
          <button
            onClick={() => dispatch(resetProgramStatus())}
            className="ml-auto"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm font-medium">
          <CheckCircle2 size={16} className="shrink-0" />
          Operation completed successfully.
        </div>
      )}

      {/* AUDIENCE FILTER TABS */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { label: "All Programs", value: "all" as AudienceRole },
          ...AUDIENCE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
        ] as { label: string; value: AudienceRole }[]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setAudienceFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              audienceFilter === tab.value
                ? "bg-[#355E3B] text-white border-[#355E3B] shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                audienceFilter === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {/* PROGRAM GRID */}
      {loading && !allPrograms ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse space-y-3"
            >
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-slate-100 rounded" />
              <div className="h-3 w-full bg-slate-50 rounded" />
              <div className="h-3 w-2/3 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={24} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-sm">No programs found</p>
          <p className="text-slate-300 text-xs mt-1">
            {audienceFilter !== "all"
              ? `No programs targeting "${audienceFilter}" yet.`
              : "Create your first program to get started."}
          </p>
          <button
            onClick={() => setModalMode("create")}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#355E3B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2a4b30] transition-all"
          >
            <Plus size={12} /> Create Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {displayed.map((p) => (
            <ProgramCard
              key={p._id}
              program={p}
              onEdit={openEdit}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalMode && (
        <ProgramModal
          mode={modalMode}
          initial={
            modalMode === "edit" && editTarget
              ? { ...editTarget }
              : { ...EMPTY_PROGRAM }
          }
          onClose={() => {
            setModalMode(null);
            setEditTarget(null);
          }}
          onSave={modalMode === "create" ? handleCreate : handleUpdate}
          loading={loading}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 rounded-xl text-red-500 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-700 text-base">Delete Program</h3>
                <p className="text-slate-400 text-sm mt-1">
                  This action is permanent and cannot be undone. Are you sure?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProgram;