import React from "react";
import Navbar from "../components/Navbar";
import FamilyMembersPanel from "../components/FamilyMembersPanel";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useFamilyMembers } from "../hooks/useFamilyMembers";

const FamilyMembersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const uid = currentUser?.uid ?? "";

  const {
    profile,
    activeMember,
    activeGoalCalories,
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember,
    handleSelectMember,
  } = useFamilyMembers(uid);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-2xl font-bold text-slate-800">{t("familyMembersTitle")}</h1>
          <p className="text-slate-500 mt-2">{t("familyMembersSubtitle")}</p>
        </div>

        <FamilyMembersPanel
          members={profile.members}
          activeMemberId={profile.activeMemberId}
          onSelectMember={handleSelectMember}
          onAddMember={handleAddMember}
          onUpdateMember={handleUpdateMember}
          onDeleteMember={handleDeleteMember}
        />

        {activeMember && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{t("activeMemberSummary")} {activeMember.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{t("suggestionBasedOnGoal")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">{t("dailyGoalLabel")}</p>
                <p className="text-3xl font-bold text-orange-500">{activeGoalCalories} kcal</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{t(`sex.${activeMember.sex}`)}</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{t(`activity.${activeMember.activityLevel}`)}</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{t("currentWeight")}: {activeMember.weightKg} kg</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{t("targetWeight")}: {activeMember.targetWeightKg} kg</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">{t(`weightGoal.${activeMember.weightGoal}`)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMembersPage;
