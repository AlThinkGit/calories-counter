import React, { useMemo, useState } from "react";
import { ActivityLevel, BiologicalSex, FamilyMember, WeightGoal } from "../../types";
import { useLanguage } from "../context/LanguageContext";

interface MemberDraft {
  name: string;
  age: string;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  weightGoal: WeightGoal;
}

interface FamilyMembersPanelProps {
  members: FamilyMember[];
  activeMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  onAddMember: (draft: {
    name: string;
    age: number;
    sex: BiologicalSex;
    activityLevel: ActivityLevel;
    heightCm: number;
    weightKg: number;
    targetWeightKg: number;
    weightGoal: WeightGoal;
    customDailyGoal?: number;
    useSuggestedGoal: boolean;
  }) => Promise<void>;
  onUpdateMember: (memberId: string, draft: {
    name: string;
    age: number;
    sex: BiologicalSex;
    activityLevel: ActivityLevel;
    heightCm: number;
    weightKg: number;
    targetWeightKg: number;
    weightGoal: WeightGoal;
  }) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
}

const initialDraft: MemberDraft = {
  name: "",
  age: "",
  sex: "female",
  activityLevel: "moderate",
  heightCm: "",
  weightKg: "",
  targetWeightKg: "",
  weightGoal: "maintain",
};

const FamilyMembersPanel: React.FC<FamilyMembersPanelProps> = ({
  members,
  activeMemberId,
  onSelectMember,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) => {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<MemberDraft>(initialDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeMemberId) ?? members[0] ?? null,
    [activeMemberId, members]
  );

  const handleChange = (field: keyof MemberDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setDraft(initialDraft);
    setFormError(null);
    setIsFormOpen(false);
    setEditingMemberId(null);
  };

  const startEditing = (member: FamilyMember) => {
    setDraft({
      name: member.name,
      age: String(member.age),
      sex: member.sex,
      activityLevel: member.activityLevel,
      heightCm: String(member.heightCm),
      weightKg: String(member.weightKg),
      targetWeightKg: String(member.targetWeightKg),
      weightGoal: member.weightGoal,
    });
    setEditingMemberId(member.id);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const age = Number(draft.age);
    const heightCm = Number(draft.heightCm);
    const weightKg = Number(draft.weightKg);
    const targetWeightKg = Number(draft.targetWeightKg);

    if (!draft.name.trim()) {
      setFormError(t("memberNameRequired"));
      return;
    }

    if ([age, heightCm, weightKg, targetWeightKg].some((value) => Number.isNaN(value) || value <= 0)) {
      setFormError(t("memberMetricsRequired"));
      return;
    }

    if (!draft.sex || !draft.activityLevel) {
      setFormError(t("memberAdditionalDataRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: draft.name.trim(),
        age,
        sex: draft.sex,
        activityLevel: draft.activityLevel,
        heightCm,
        weightKg,
        targetWeightKg,
        weightGoal: draft.weightGoal,
      };

      if (editingMemberId) {
        await onUpdateMember(editingMemberId, payload);
      } else {
        await onAddMember({
          ...payload,
          useSuggestedGoal: true,
        });
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t("familyMembersTitle")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("familyMembersSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen((current) => !current)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <span>+</span>
          {t("addFamilyMember")}
        </button>
      </div>

      {members.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((member) => {
            const isActive = member.id === activeMember?.id;
            const dailyGoal = member.useSuggestedGoal ? member.suggestedDailyCalories : member.customDailyGoal ?? member.suggestedDailyCalories;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectMember(member.id)}
                className={`text-left rounded-2xl border p-4 transition ${isActive ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-emerald-200"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{member.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{t(`sex.${member.sex}`)} · {t(`activity.${member.activityLevel}`)}</p>
                  </div>
                  {isActive && <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-500 text-white">{t("activeMember")}</span>}
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>{member.age} {t("yearsShort")}</p>
                  <p>{member.heightCm} cm · {member.weightKg} kg</p>
                  <p>{t(`weightGoal.${member.weightGoal}`)} · {targetWeightKgLabel(member.targetWeightKg, t)}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{t("dailyGoalLabel")}</span>
                  <span className="text-sm font-bold text-orange-500">{dailyGoal} kcal</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); startEditing(member); }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
                  >
                    {t("editMember")}
                  </button>
                  <button
                    type="button"
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (window.confirm(t("deleteMemberConfirm"))) {
                        await onDeleteMember(member.id);
                        if (editingMemberId === member.id) {
                          resetForm();
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    {t("deleteMember")}
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          {t("noFamilyMembers")}
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-5 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("memberName")}</label>
            <input
              value={draft.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder={t("memberNamePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <Field label={t("ageLabel")}>
            <input type="number" min={1} value={draft.age} onChange={(event) => handleChange("age", event.target.value)} className={inputClassName} />
          </Field>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("sexLabel")}</label>
            <div className="grid grid-cols-2 gap-2">
              {(["female", "male"] as BiologicalSex[]).map((sex) => (
                <button
                  key={sex}
                  type="button"
                  onClick={() => handleChange("sex", sex)}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition ${draft.sex === sex ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                >
                  {t(`sex.${sex}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("activityLevelLabel")}</label>
            <select
              value={draft.activityLevel}
              onChange={(event) => handleChange("activityLevel", event.target.value)}
              className={inputClassName}
            >
              {(["low", "moderate", "high"] as ActivityLevel[]).map((activity) => (
                <option key={activity} value={activity}>{t(`activity.${activity}`)}</option>
              ))}
            </select>
          </div>
          <Field label={t("heightLabel")}>
            <input type="number" min={30} value={draft.heightCm} onChange={(event) => handleChange("heightCm", event.target.value)} className={inputClassName} />
          </Field>
          <Field label={t("weightLabel")}>
            <input type="number" min={1} step="0.1" value={draft.weightKg} onChange={(event) => handleChange("weightKg", event.target.value)} className={inputClassName} />
          </Field>
          <Field label={t("targetWeightLabel")}>
            <input type="number" min={1} step="0.1" value={draft.targetWeightKg} onChange={(event) => handleChange("targetWeightKg", event.target.value)} className={inputClassName} />
          </Field>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("weightGoalLabel")}</label>
            <div className="grid sm:grid-cols-3 gap-2">
              {(["lose", "maintain", "gain"] as WeightGoal[]).map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleChange("weightGoal", goal)}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition ${draft.weightGoal === goal ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                >
                  {t(`weightGoal.${goal}`)}
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="md:col-span-2 text-sm text-red-600">{formError}</p>}

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 justify-end">
            <button type="button" onClick={resetForm} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition">
              {t("cancel")}
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition disabled:bg-emerald-300">
              {isSubmitting ? t("saving") : editingMemberId ? t("updateMember") : t("saveMember")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

const inputClassName = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const targetWeightKgLabel = (targetWeightKg: number, t: (key: string) => string) => `${t("targetShort")} ${targetWeightKg} kg`;

export default FamilyMembersPanel;
